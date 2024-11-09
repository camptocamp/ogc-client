// @ts-nocheck
import 'regenerator-runtime/runtime';
import mitt from 'mitt';
import * as util from 'util';
import { TextDecoder } from 'util';
import CacheMock from 'browser-cache-mock';
import 'isomorphic-fetch';
import { Buffer } from './node_modules/buffer/index.js';

globalThis.Buffer = Buffer;

// mock the global fetch API
window.fetchPreHandler = (url, options) => {};
window.fetchResponseFactory = (url, options) => '<empty></empty>';
window.originalFetch = window.fetch;
window.mockFetch = jest.fn().mockImplementation(async (url, options) => {
  const preResult = await window.fetchPreHandler(url, options);
  if (preResult) return preResult;
  return {
    text: () => Promise.resolve(globalThis.fetchResponseFactory(url, options)),
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
window.fetch = window.mockFetch;

// reset fetch response to XML by default
beforeEach(() => {
  window.fetchResponseFactory = (url) => '<empty></empty>';
});

window.caches = {
  open: async () => new CacheMock(),
};

// mock Worker class to work synchronously
// requires an absolute file path
// this is mainly ripped off of https://github.com/developit/jsdom-worker
global.Worker = function Worker(filePath) {
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

  // bundle the worker code and create a function from it
  import('esbuild')
    .then((esbuild) =>
      esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        write: false,
      })
    )
    .then((result) => {
      const code = new util.TextDecoder('utf-8').decode(
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

  // mock global scope
  global.WorkerGlobalScope = scope;
};

// global.TextDecoder = StringDecoder
// global.TextDecoder.prototype.decode = StringDecoder.prototype.write
global.TextDecoder = TextDecoder;
