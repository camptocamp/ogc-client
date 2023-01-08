// @ts-nocheck
import 'regenerator-runtime/runtime';
import { EventEmitter } from 'events';
import { Blob } from 'buffer';
import fetch from 'node-fetch';

global.Blob = Blob;

global.fetch = fetch;

// mimic window events
const emitter = new EventEmitter();
global.addEventListener = emitter.addListener.bind(emitter);
global.removeEventListener = emitter.removeListener.bind(emitter);
global.dispatchEvent = (event) => emitter.emit(event.type, event);
global.CustomEvent = class {
  constructor(type, payload) {
    this.type = type;
    Object.assign(this, payload);
  }
};
