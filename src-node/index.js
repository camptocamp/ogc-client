import 'regenerator-runtime/runtime';
import mitt from 'mitt';
import fetch from 'node-fetch';
import { Blob, resolveObjectURL } from 'node:buffer';
export * from '../src/index';

global.Blob = Blob;

// this is a custom polyfill which only works when creating a worker from an object url
global.Worker = function Worker(blobUrl) {
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
    fetch: fetch,
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

  resolveObjectURL(blobUrl)
    .text()
    .then((code) => {
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
};
