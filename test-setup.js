import 'regenerator-runtime/runtime';
import mitt from 'mitt';
import * as esbuild from 'esbuild';
import * as util from 'util';
import CacheMock from 'browser-cache-mock';
import 'isomorphic-fetch';
import { TextDecoder } from 'util';

// mock the global fetch API
window.fetchResponseFactory = (url) => '<empty></empty>';
window.originalFetch = window.fetch;
window.mockFetch = jest.fn((url) =>
  Promise.resolve({
    text: () => Promise.resolve(globalThis.fetchResponseFactory(url)),
    arrayBuffer: () =>
      Promise.resolve(
        Buffer.from(globalThis.fetchResponseFactory(url), 'utf-8')
      ),
    status: 200,
    ok: true,
    headers: { get: () => null },
  })
);
window.fetch = window.mockFetch;

window.caches = {
  open: async () => new CacheMock(),
};

// mock Worker class to work synchronously
// requires an absolute file path
// this is mainly ripped off https://github.com/developit/jsdom-worker
global.Worker = function Worker(filePath) {
  let getScopeVar;
  let messageQueue = [];
  let inside = mitt();
  let outside = mitt();
  let scope = {
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
    let f = scope.onmessage || getScopeVar('onmessage');
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
  esbuild
    .build({
      entryPoints: [filePath],
      bundle: true,
      write: false,
    })
    .then((result) => {
      const code = new util.TextDecoder('utf-8').decode(
        result.outputFiles[0].contents
      );
      let vars = 'var self=this,global=self';
      for (let k in scope) vars += `,${k}=self.${k}`;
      getScopeVar = Function(
        vars +
          ';\n' +
          code +
          '\nreturn function(n){return n=="onmessage"?onmessage:null;}'
      ).call(scope);
      let q = messageQueue;
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
