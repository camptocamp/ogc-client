const EXAMPLES = [
  {
    description: 'Read a WMS layer extent',
    code: `import { WmsEndpoint } from '@camptocamp/ogc-client';

async function readExtent() {
  const endpoint = await new WmsEndpoint('https://my.server.org/ows').isReady()
  const layer = endpoint.getLayerByName();
  const extent = layer.boundingBoxes['EPSG:4326'];
  return extent;
}`,
  },
  {
    description: 'Compute a WFS GetFeature url',
    code: `import { WfsEndpoint } from '@camptocamp/ogc-client';

async function getFeatureUrl() {
  const endpoint = await new WfsEndpoint('https://my.server.org/ows').isReady()
  const url = endpoint.getFeatureUrl('my:featureType', {
    asJson: true,
    maxFeature: 1000
  });
  return url;
}`,
  },
  {
    description: 'Query the first 10 items of an OGC API Records collection',
    code: `import { OgcApiEndpoint } from '@camptocamp/ogc-client';

async function getFirstTenRecords() {
  const endpoint = await new OgcApiEndpoint('https://my.server.org/main')
  const firstCollection = (await endpoint.recordCollections)[0];
  return endpoint.getCollectionItems(firstCollection, 10, 0);
}`,
  },
];

export default EXAMPLES;
