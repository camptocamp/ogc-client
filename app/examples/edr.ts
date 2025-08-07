// npx tsx examples/edr.ts

import { OgcApiEDREndpoint } from '../../src-node/index.js';

const baseUrl = 'https://api.wwdh.internetofwater.app?f=json';

(async () => {
  const edr = new OgcApiEDREndpoint(baseUrl);
  const collections = await edr.allCollections;
  console.log('Collections:', collections);

  const firstCollection = collections[0];

  const firstCollectionInfo = await edr.getCollectionInfo(firstCollection.name);

  console.log("Supported EDR data queries:", firstCollection.dataQueries); 

  console.log('Collection crs:', firstCollectionInfo.crs);

  const result = edr.getLocations(
    firstCollection.name,
  );
  console.log('Retrieved locations:', await result);
})();
