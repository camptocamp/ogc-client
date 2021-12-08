import { enableFallbackWithoutWorker } from '../worker';
import '../worker/worker';
export * from '../index';

// use this entrypoint to disable worker usage completely
// (the worker code will be included in the sources)
enableFallbackWithoutWorker();
