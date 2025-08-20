// npx tsx app/examples/edr.ts

import { OgcApiEndpoint } from '../../src-node/index.js';

const baseUrl = 'https://api.wwdh.internetofwater.app/?f=json';

(async () => {
  const api = new OgcApiEndpoint(baseUrl);
  const edr_collection_names = await api.edrCollections;

  const output = {};

  for (const collection of edr_collection_names) {
    const edr_builder = await api.edr(collection);
    const sourceLink = edr_builder.links.find(
      (link) => link.title === 'data source'
    );

    const sourceUrl = sourceLink ? sourceLink.href : null;

    output[collection] = {
      source_url: sourceUrl,
      name: collection,
      params: edr_builder.supported_parameters,
    };
  }
  console.log(JSON.stringify(output, null, 2));
})();
