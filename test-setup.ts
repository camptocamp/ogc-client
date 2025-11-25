// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import mitt from 'mitt';
import { TextDecoder } from 'util';
import CacheMock from 'browser-cache-mock';
import 'isomorphic-fetch';
import { Buffer } from './node_modules/buffer/index.js';

globalThis.Buffer = Buffer;

// --- Only mock fetch if we're NOT in live mode (CSAPI_LIVE !== 'true') ---
const isLiveTestMode = process.env.CSAPI_LIVE === 'true';

// Set up fetch mocking only if not live mode.
if (!isLiveTestMode) {
  globalThis.fetchPreHandler = (url, options) => {};
  globalThis.fetchResponseFactory = (url, options) => '<empty></empty>';
  globalThis.originalFetch = globalThis.fetch;
  globalThis.mockFetch = jest.fn().mockImplementation(async (url, options) => {
    const preResult = await globalThis.fetchPreHandler(url, options);
    if (preResult) return preResult;
    return {
      text: () =>
        Promise.resolve(globalThis.fetchResponseFactory(url, options)),
      json: () =>
        Promise.resolve(
          JSON.parse(globalThis.fetchResponseFactory(url, options))
        ),
      arrayBuffer: () =>
        Promise.resolve(
          Buffer.from(globalThis.fetchResponseFactory(url, options), 'utf-8')
        ),
      clone: function () {
        return this;
      },
      status: 200,
      ok: true,
      headers: { get: () => null },
    };
  });
  globalThis.fetch = globalThis.mockFetch;

  // reset fetch response to XML by default
  beforeEach(() => {
    globalThis.fetchResponseFactory = (url) => '<empty></empty>';
  });
}

// Always set up caches mock
globalThis.caches = {
  open: async () => new CacheMock(),
};

// mock Worker class to work synchronously (no change here)
globalThis.Worker = function Worker(filePath) {
  let getScopeVar;
  let messageQueue = [];
  const inside = mitt();
  const outside = mitt();
  const scope = {
    onmessage: null,
    dispatchEvent: inside.emit,
    addEventListener: inside.on,
    removeEventListener: inside.off,
    postMessage(data) {
      outside.emit('message', { data });
    },
    fetch: global.fetch,
    importScripts() {},
  };
  inside.on('message', (e) => {
    const f = scope.onmessage || getScopeVar('onmessage');
    if (f) f.call(scope, e);
  });
  this.addEventListener = outside.on;
  this.removeEventListener = outside.off;
  this.dispatchEvent = outside.emit;
  outside.on('message', (e) => {
    if (this.onmessage) this.onmessage(e);
  });
  this.postMessage = (data) => {
    if (messageQueue != null) messageQueue.push(data);
    else inside.emit('message', { data });
  };
  this.terminate = () => {
    throw Error('Not Supported');
  };

  import('esbuild')
    .then((esbuild) =>
      esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        write: false,
      })
    )
    .then((result) => {
      const code = new TextDecoder('utf-8').decode(
        result.outputFiles[0].contents
      );
      let vars = 'var self=this,global=self,globalThis=self';
      for (const k in scope) vars += `,${k}=self.${k}`;
      getScopeVar = Function(
        vars +
          ';\n' +
          code +
          '\nreturn function(n){return n=="onmessage"?onmessage:null;}'
      ).call(scope);
      const q = messageQueue;
      messageQueue = null;
      q.forEach(this.postMessage);
    })
    .catch((e) => {
      outside.emit('error', e);
      console.error(e);
    });

  globalThis.WorkerGlobalScope = scope;
};

globalThis.TextDecoder = TextDecoder;
