import layerDetailsFixture from '../../fixtures/ncwms/layer-details.json';
import minMaxFixture from '../../fixtures/ncwms/min-max.json';
import { NcwmsEndpoint } from './endpoint.js';
import { useCache } from '../shared/cache.js';

jest.mock('../shared/cache', () => ({
  useCache: jest.fn((factory) => factory()),
}));

const LAYER_DETAILS_JSON = JSON.stringify(layerDetailsFixture);
const MIN_MAX_JSON = JSON.stringify(minMaxFixture);

describe('NcwmsEndpoint', () => {
  let endpoint: NcwmsEndpoint;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetchPreHandler = () => {};
    globalThis.fetchResponseFactory = () => LAYER_DETAILS_JSON;
    endpoint = new NcwmsEndpoint(
      'https://my.test.service/thredds/wms?SERVICE=WMS&REQUEST=GetCapabilities'
    );
  });

  describe('constructor URL normalization', () => {
    it('strips WMS-specific query params from the base URL', async () => {
      await endpoint.getLayerDetails('tos');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://my.test.service/thredds/wms?'),
        expect.anything()
      );
      const calledUrl: string = (globalThis.fetch as jest.Mock).mock
        .calls[0][0];
      expect(calledUrl).not.toContain('REQUEST=GetCapabilities');
      expect(calledUrl).not.toContain('SERVICE=WMS&REQUEST=GetCapabilities');
    });

    it('adds GetMetadata params', async () => {
      await endpoint.getLayerDetails('tos');
      const calledUrl: string = (globalThis.fetch as jest.Mock).mock
        .calls[0][0];
      expect(calledUrl).toContain('REQUEST=GetMetadata');
      expect(calledUrl).toContain('item=layerDetails');
      expect(calledUrl).toContain('layerName=tos');
    });
  });

  describe('#getLayerDetails', () => {
    it('uses cache', async () => {
      await endpoint.getLayerDetails('tos');
      expect(useCache).toHaveBeenCalledTimes(1);
    });

    it('returns parsed layer details', async () => {
      const details = await endpoint.getLayerDetails('tos');
      expect(details).toEqual({
        scaleRange: [-2.0, 35.0],
        palettes: [
          'rainbow',
          'occam',
          'occam_sea',
          'redblue',
          'greyscale',
          'alg',
          'alg2',
        ],
        defaultPalette: 'occam',
        supportedStyles: ['boxfill', 'contour'],
        units: '°C',
        bbox: [-180.0, -90.0, 180.0, 90.0],
      });
    });

    describe('when the server returns numeric values as strings (e.g. ERDDAP/CMEMS)', () => {
      beforeEach(() => {
        globalThis.fetchResponseFactory = () =>
          JSON.stringify({
            ...layerDetailsFixture,
            scaleRange: ['-3.0', '32.0'],
            bbox: ['-180.0', '-77.0104751586914', '179.5', '89.8962631225586'],
          });
      });
      it('coerces string numbers and returns parsed layer details', async () => {
        const details = await endpoint.getLayerDetails('tos');
        expect(details).not.toBeNull();
        expect(details!.scaleRange).toEqual([-3.0, 32.0]);
        expect(details!.bbox).toEqual([
          -180.0, -77.0104751586914, 179.5, 89.8962631225586,
        ]);
      });
    });

    describe('when the server returns a non-NcWMS JSON response', () => {
      beforeEach(() => {
        globalThis.fetchResponseFactory = () =>
          JSON.stringify({ error: 'unknown layer' });
      });
      it('returns null', async () => {
        const details = await endpoint.getLayerDetails('tos');
        expect(details).toBeNull();
      });
    });

    describe('when the server returns an HTTP error', () => {
      beforeEach(() => {
        globalThis.fetchPreHandler = () => ({
          ok: false,
          status: 404,
          json: () => Promise.reject(new Error('not json')),
          clone: function () {
            return this;
          },
          headers: { get: () => null },
        });
      });
      it('returns null', async () => {
        const details = await endpoint.getLayerDetails('tos');
        expect(details).toBeNull();
      });
    });

    describe('when the network request fails', () => {
      beforeEach(() => {
        globalThis.fetchPreHandler = () => {
          throw new TypeError('network error');
        };
      });
      it('returns null', async () => {
        const details = await endpoint.getLayerDetails('tos');
        expect(details).toBeNull();
      });
    });
  });

  describe('#getMinMax', () => {
    beforeEach(() => {
      globalThis.fetchResponseFactory = () => MIN_MAX_JSON;
    });

    it('fetches min/max with the correct parameters', async () => {
      await endpoint.getMinMax('tos', [-10, 30, 10, 50]);
      const calledUrl: string = (globalThis.fetch as jest.Mock).mock
        .calls[0][0];
      expect(calledUrl).toContain('REQUEST=GetMetadata');
      expect(calledUrl).toContain('item=minmax');
      expect(calledUrl).toContain('LAYERS=tos');
      expect(calledUrl).toContain('bbox=-10%2C30%2C10%2C50');
      expect(calledUrl).toContain('SRS=CRS%3A84');
    });

    it('includes TIME and ELEVATION when provided', async () => {
      await endpoint.getMinMax('tos', [-10, 30, 10, 50], {
        time: '2023-01-01T00:00:00Z',
        elevation: '-10',
      });
      const calledUrl: string = (globalThis.fetch as jest.Mock).mock
        .calls[0][0];
      expect(calledUrl).toContain('time=2023-01-01T00%3A00%3A00Z');
      expect(calledUrl).toContain('elevation=-10');
    });

    it('returns parsed min/max values', async () => {
      const result = await endpoint.getMinMax('tos', [-10, 30, 10, 50]);
      expect(result).toEqual({ min: 5.234, max: 28.751 });
    });

    describe('when the server returns an HTTP error', () => {
      beforeEach(() => {
        globalThis.fetchPreHandler = () => ({
          ok: false,
          status: 500,
          clone: function () {
            return this;
          },
          headers: { get: () => null },
        });
      });
      it('throws', async () => {
        await expect(
          endpoint.getMinMax('tos', [-10, 30, 10, 50])
        ).rejects.toThrow('NcWMS GetMinMax failed with status 500');
      });
    });
  });

  describe('#getLegendUrl', () => {
    it('returns a URL without making a network request', () => {
      const url = endpoint.getLegendUrl('tos');
      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(url).toContain('REQUEST=GetLegendGraphic');
      expect(url).toContain('LAYER=tos');
    });

    it('includes style when provided', () => {
      const url = endpoint.getLegendUrl('tos', { style: 'boxfill/rainbow' });
      expect(url).toContain('STYLES=boxfill%2Frainbow');
    });

    it('includes COLORSCALERANGE when provided', () => {
      const url = endpoint.getLegendUrl('tos', { colorScaleRange: [-2, 35] });
      expect(url).toContain('COLORSCALERANGE=-2%2C35');
    });

    it('includes LOGSCALE when provided', () => {
      const url = endpoint.getLegendUrl('tos', { logScale: true });
      expect(url).toContain('LOGSCALE=true');
    });

    it('includes default WIDTH, HEIGHT and VERTICAL params', () => {
      const url = endpoint.getLegendUrl('tos');
      expect(url).toContain('WIDTH=150');
      expect(url).toContain('HEIGHT=30');
      expect(url).toContain('VERTICAL=false');
    });
  });
});
