// @ts-expect-error ts-migrate(7016)
import wmsCapabilities from '../../fixtures/wms/capabilities-brgm-1-3-0.xml';
// @ts-expect-error ts-migrate(7016)
import wfsCapabilities from '../../fixtures/wfs/capabilities-geo2france-2-0-0.xml';
import WmsEndpoint from '../wms/endpoint.js';
import WfsEndpoint from '../wfs/endpoint.js';
import { enableFallbackWithoutWorker } from '../worker/index.js';
import '../worker/worker.js';

jest.mock('../shared/cache', () => ({
  useCache: jest.fn((factory) => factory()),
}));

enableFallbackWithoutWorker();

const global = window as any;

describe('Worker fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WmsEndpoint', () => {
    let endpoint: WmsEndpoint;

    beforeEach(() => {
      global.fetchResponseFactory = () => wmsCapabilities;
      endpoint = new WmsEndpoint(
        'https://my.test.service/ogc/wms?service=wms&request=GetMap&aa=bb'
      );
    });

    describe('#getVersion', () => {
      it('returns the correct version', async () => {
        await endpoint.isReady();
        expect(endpoint.getVersion()).toBe('1.3.0');
      });
    });
  });

  describe('WfsEndpoint', () => {
    let endpoint: WfsEndpoint;

    beforeEach(() => {
      global.fetchResponseFactory = () => wfsCapabilities;
      endpoint = new WfsEndpoint(
        'https://my.test.service/ogc/wfs?service=wfs&request=DescribeFeatureType'
      );
    });

    describe('#getVersion', () => {
      it('returns the correct version', async () => {
        await endpoint.isReady();
        expect(endpoint.getVersion()).toBe('2.0.0');
      });
    });
  });
});
