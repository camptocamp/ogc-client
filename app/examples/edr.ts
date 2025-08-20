// npx tsx examples/edr.ts

import { OgcApiEndpoint } from '../../src-node/index.js';

const baseUrl = 'https://dummy.edr.app?f=json';

(async () => {
  const api = new OgcApiEndpoint(baseUrl);
  const collections = await api.allCollections;
  const edr_collections = await api.edrCollections;

  const first_edr_collection = edr_collections[0];
  const first_edr_collection_document = collections.find(
    (c) => c.name === first_edr_collection
  );
  console.log('First EDR collection:', first_edr_collection_document);
  console.log(
    'Supported queries',
    (await api.edr(first_edr_collection_document!.name)).supported_queries
  );
})();
