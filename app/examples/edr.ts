// npx tsx examples/edr.ts

import { OgcApiEDREndpoint } from '../../src-node/index.js';

const baseUrl = 'https://api.wwdh.internetofwater.app?f=json';

(async () => {
  const edr = new OgcApiEDREndpoint(baseUrl);
  const collections = await edr.allCollections;
  console.log('Collections:', collections);

  const rise = await edr.getCollectionInfo('rise-edr');
  console.log('Rise crs:', rise.crs);

  const result = edr.getLocations(
    'rise-edr',
  );
  console.log('Rise locations:', await result);
})();
