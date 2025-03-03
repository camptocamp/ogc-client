import TmsEndpoint from './endpoint.js';
// @ts-expect-error ts-migrate(7016)
import capabilities from '../../fixtures/tms/capabilities-geopf.xml';
// @ts-expect-error ts-migrate(7016)
import tileMapSample from '../../fixtures/tms/tilemap-sample.xml';
import { useCache } from '../shared/cache.js';
import { queryXmlDocument } from '../shared/http-utils.js';
import { parseXmlString } from '../shared/xml-utils.js';

jest.mock('../shared/cache', () => ({
  useCache: jest.fn((factory) => factory()),
}));

jest.mock('../shared/http-utils', () => ({
  queryXmlDocument: jest.fn(),
  setFetchOptionsUpdateCallback: jest.fn(), // Add this mock function
}));

describe('TmsEndpoint', () => {
  let endpoint: TmsEndpoint;
  let parsedTileMapSample;

  beforeEach(() => {
      jest.clearAllMocks();
      global.fetchPreHandler = () => {};
      global.fetchResponseFactory = () => capabilities;
      
      // Parse the XML string fixture into an actual XML document object
      parsedTileMapSample = parseXmlString(tileMapSample);
      
      endpoint = new TmsEndpoint(
        'https://my.test.service/tms/1.0.0'
      );
    });

    it('makes a getcapabilities request', async () => {
        await endpoint.isReady();
        expect(global.fetch).toHaveBeenCalledWith(
          'https://my.test.service/tms/1.0.0',
          { method: 'GET' }
        );
      });


    describe('caching', () => {
        beforeEach(async () => {
          await endpoint.isReady();
        });
        it('uses cache once', () => {
          expect(useCache).toHaveBeenCalledTimes(1);
        });
        it('stores the parsed capabilities in cache', async () => {
          await expect(
            (useCache as any).mock.results[0].value
          ).resolves.toMatchObject({
            info: {
              title: 'WMS/WMTS/TMS server',
              abstract: 'This server provide WMS, WMTS and TMS raster and vector data broadcast',
            },
          });
        });
      });

    describe('getLayerByHref', () => {
        beforeEach(async () => {
          await endpoint.isReady();
        });
        it('returns a layer by href', async () => {
          const layer = endpoint.getLayerByHref('https://data.geopf.fr/tms/1.0.0/ADMINEXPRESS-COG-CARTO.LATEST');
          expect(layer).toBeDefined();
          expect(layer.title).toBe('ADMINEXPRESS COG CARTO');
        });
        it('returns null for a non-existent layer', async () => {
          const layer = endpoint.getLayerByHref('https://data.geopf.fr/tms/1.0.0/NON_EXISTENT_LAYER');
          expect(layer).toBeUndefined();
        });
    });

    describe('getLayerDetails', () => {
        beforeEach(async () => {
          await endpoint.isReady();
          // Set up mock for the TileMap XML to return a proper XML document
          (queryXmlDocument as jest.Mock).mockResolvedValue(parsedTileMapSample);
        });

        it('fetches detailed layer information including metadata', async () => {
          const layerHref = 'https://data.geopf.fr/tms/1.0.0/PLAN.IGN';
          const layerDetails = await endpoint.getLayerDetails(layerHref);

          expect(queryXmlDocument).toHaveBeenCalledWith(layerHref);
          expect(layerDetails).toBeDefined();
          expect(layerDetails.metadata).toBeDefined();
          expect(layerDetails.metadata.length).toBeGreaterThan(0);
        });

        it('returns base layer information if XML fetching fails', async () => {
          // Setup mock to simulate an error
          (queryXmlDocument as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

          const layerHref = 'https://data.geopf.fr/tms/1.0.0/PLAN.IGN';
          const baseLayer = endpoint.getLayerByHref(layerHref);
          const layerDetails = await endpoint.getLayerDetails(layerHref);

          expect(queryXmlDocument).toHaveBeenCalledWith(layerHref);
          expect(layerDetails).toEqual(baseLayer);
        });

        it('returns null for a non-existent layer', async () => {
          const layerDetails = await endpoint.getLayerDetails('https://data.geopf.fr/tms/1.0.0/NON_EXISTENT_LAYER');
          expect(layerDetails).toBeNull();
        });
    });
});
