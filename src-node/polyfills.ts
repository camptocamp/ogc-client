// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import 'regenerator-runtime/runtime';
import { Blob } from 'buffer';
import fetch from 'node-fetch';

if (!('Blob' in global)) {
  global.Blob = Blob;
}
if (!('fetch' in global)) {
  global.fetch = fetch;
}

if (!('CustomEvent' in global)) {
  global.CustomEvent = class {
    constructor(type, payload) {
      this.type = type;
      Object.assign(this, payload);
    }
  };
}

// mock the window.location object
if (!('location' in global)) {
  global.location = new URL('http://localhost');
}
