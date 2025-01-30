import TmsEndpoint from './endpoint.js';
// @ts-expect-error ts-migrate(7016)
import capabilities from '../../fixtures/tms/capabilities-geopf.xml';
import { useCache } from '../shared/cache.js';

jest.mock('../shared/cache', () => ({
  useCache: jest.fn((factory) => factory()),
}));

describe('TmsEndpoint', () => {
  let endpoint: TmsEndpoint;

  beforeEach(() => {
      jest.clearAllMocks();
      global.fetchPreHandler = () => {};
      global.fetchResponseFactory = () => capabilities;
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
});
