// test-edr.ts

import OgcApiEndpoint from '../src/ogc-api/endpoint.js';

const baseUrl = 'https://api.wwdh.internetofwater.app/collections?f=html';

(async () => {
  try {
    const oaf = new OgcApiEndpoint(baseUrl);

    const collections = await oaf.allCollections;
    console.log('Collections:', collections);
  } catch (err) {
    console.error('Test error:', err);
  }
})();
