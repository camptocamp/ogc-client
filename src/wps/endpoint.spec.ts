// @ts-expect-error ts-migrate(7016)
import capabilities from '../../fixtures/wps/capabilities-geoserver.xml';
// @ts-expect-error ts-migrate(7016)
import describeBuffer from '../../fixtures/wps/describeprocess-buffer.xml';
// @ts-expect-error ts-migrate(7016)
import executeSucceededInline from '../../fixtures/wps/execute-succeeded-inline.xml';
// @ts-expect-error ts-migrate(7016)
import executeAccepted from '../../fixtures/wps/execute-accepted.xml';
import WpsEndpoint from './endpoint.js';
import { useCache } from '../shared/cache.js';

jest.mock('../shared/cache', () => ({
  useCache: jest.fn((factory) => factory()),
}));

describe('WpsEndpoint', () => {
  let endpoint: WpsEndpoint;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetchPreHandler = () => {};
    globalThis.fetchResponseFactory = (url, options) => {
      if (options?.method === 'POST') return executeSucceededInline;
      if (/DescribeProcess/i.test(url)) return describeBuffer;
      return capabilities;
    };
    endpoint = new WpsEndpoint(
      'https://my.test.service/ogc/wps?service=wps&request=GetMap&aa=bb'
    );
  });

  it('makes a getcapabilities request', async () => {
    await endpoint.isReady();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://my.test.service/ogc/wps?aa=bb&SERVICE=WPS&REQUEST=GetCapabilities',
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
  });

  describe('#isReady', () => {
    it('resolves with the endpoint object', async () => {
      await expect(endpoint.isReady()).resolves.toEqual(endpoint);
    });
  });

  describe('#getServiceInfo', () => {
    it('returns the service info', async () => {
      await endpoint.isReady();
      expect(endpoint.getServiceInfo()).toMatchObject({
        title: 'Demo WPS',
        name: 'WPS',
      });
    });
  });

  describe('#getVersion', () => {
    it('returns the version', async () => {
      await endpoint.isReady();
      expect(endpoint.getVersion()).toBe('1.0.0');
    });
  });

  describe('#getProcesses', () => {
    it('returns the process summaries', async () => {
      await endpoint.isReady();
      expect(endpoint.getProcesses()).toEqual([
        {
          identifier: 'JTS:buffer',
          title: 'Buffer a geometry',
          abstract: 'Returns the buffer of a geometry by a given distance',
          processVersion: '1.0.0',
        },
        {
          identifier: 'ras:Contour',
          title: 'Contour',
          abstract: 'Extracts contours from a raster',
          processVersion: '2.0.0',
        },
      ]);
    });
  });

  describe('#getProcessSummary', () => {
    it('returns a single process summary', async () => {
      await endpoint.isReady();
      expect(endpoint.getProcessSummary('ras:Contour')).toMatchObject({
        identifier: 'ras:Contour',
        title: 'Contour',
      });
    });
    it('returns null when unknown', async () => {
      await endpoint.isReady();
      expect(endpoint.getProcessSummary('nope')).toBeNull();
    });
  });

  describe('#getOperationUrl', () => {
    it('returns the Execute POST url', async () => {
      await endpoint.isReady();
      expect(endpoint.getOperationUrl('Execute', 'Post')).toBe(
        'https://my.wps.server/geoserver/wps'
      );
    });
  });

  describe('#describeProcess', () => {
    it('performs a DescribeProcess request and maps the description', async () => {
      await endpoint.isReady();
      const process = await endpoint.describeProcess('JTS:buffer');
      expect(process).toMatchObject({
        identifier: 'JTS:buffer',
        statusSupported: true,
        inputs: expect.any(Array),
        outputs: expect.any(Array),
      });
      expect(process.inputs).toHaveLength(4);
    });
  });

  describe('#execute', () => {
    it('POSTs an Execute request and parses the response', async () => {
      await endpoint.isReady();
      const result = await endpoint.execute('JTS:buffer', {
        inputs: [{ identifier: 'distance', literalValue: '10' }],
        outputs: [{ identifier: 'result' }],
      });
      expect(result.status).toBe('succeeded');
      // the POST goes to the dedicated Execute POST url
      const postCall = (globalThis.fetch as jest.Mock).mock.calls.find(
        ([, options]) => options?.method === 'POST'
      );
      expect(postCall[0]).toBe('https://my.wps.server/geoserver/wps');
      expect(postCall[1].headers['Content-Type']).toBe('application/xml');
      expect(postCall[1].body).toContain('<ows:Identifier>JTS:buffer');
    });
  });

  describe('#getStatus', () => {
    it('polls a status location and parses the response', async () => {
      globalThis.fetchResponseFactory = () => executeAccepted;
      await endpoint.isReady();
      const result = await endpoint.getStatus(
        'https://my.wps.server/geoserver/ows?SERVICE=WPS&REQUEST=GetExecutionStatus&EXECUTIONID=abc123'
      );
      expect(result).toMatchObject({
        status: 'started',
        percentCompleted: 35,
      });
    });
  });
});
