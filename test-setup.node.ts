// first apply the node polyfills & specificities
import './src-node/polyfills.js';

// then run the test environment setup
import './test-setup.ts';

import { enableFallbackWithoutWorker } from './src/worker/index.js';
import './src/worker-fallback/index.js';

// then enable worker fallback
typeof enableFallbackWithoutWorker();
