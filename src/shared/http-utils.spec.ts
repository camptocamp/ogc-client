import { EndpointError } from './errors.js';
import {
  queryXmlDocument,
  setFetchOptions,
  setQueryParams,
  sharedFetch,
} from './http-utils.js';
import { fetchDocument } from '../ogc-api/link-utils.js';
import WfsEndpoint from '../wfs/endpoint.js';
// @ts-expect-error ts-migrate(7016)
import capabilities200 from '../../fixtures/wfs/capabilities-pigma-2-0-0.xml';

const global = window as any;

jest.useFakeTimers();

afterEach(() => {
  jest.clearAllMocks();
});

describe('HTTP utils', () => {
  describe('queryXmlDocument', () => {
    const sampleXml = '<sample-xml><node1></node1><node2></node2></sample-xml>';

    let fetchBehaviour:
      | 'ok'
      | 'httpError'
      | 'corsError'
      | 'networkError'
      | 'delay';

    let originalFetch;

    beforeAll(() => {
      fetchBehaviour = 'ok';
      originalFetch = global.fetch; // keep reference of native impl
      global.fetch = jest.fn().mockImplementation((xmlString, opts) => {
        const noCors = opts && opts.mode === 'no-cors';
        const headers = { get: () => null };
        switch (fetchBehaviour) {
          case 'ok':
            return Promise.resolve({
              arrayBuffer: () =>
                Promise.resolve(Buffer.from(xmlString, 'utf-8')),
              status: 200,
              ok: true,
              headers,
              clone: function () {
                return this;
              },
            });
          case 'httpError':
            return Promise.resolve({
              text: () => Promise.resolve('<error>Random error</error>'),
              status: 401,
              ok: false,
              clone: function () {
                return this;
              },
            });
          case 'corsError':
            if (noCors)
              return Promise.resolve({
                status: 200,
                ok: true,
                clone: function () {
                  return this;
                },
              });
            return Promise.reject(new Error('Cross origin headers missing'));
          case 'networkError':
            return Promise.reject(new Error('General network error'));
          case 'delay':
            return new Promise((resolve) => {
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    status: 200,
                    headers,
                    arrayBuffer: () =>
                      Promise.resolve(Buffer.from(sampleXml, 'utf-8')),
                    clone: function () {
                      return this;
                    },
                  }),
                10
              );
            });
        }
      });
    });

    afterAll(() => {
      global.fetch = originalFetch; // restore original impl
    });

    describe('HTTP request returns success', () => {
      beforeEach(() => {
        fetchBehaviour = 'ok';
      });
      it('resolves with the endpoint object', async () => {
        await expect(queryXmlDocument(sampleXml)).resolves.toMatchObject({
          children: [
            {
              children: expect.any(Array),
              name: 'sample-xml',
              isRootNode: true,
              type: 'element',
            },
          ],
          type: 'document',
        });
      });
    });
    describe('HTTP request returns error', () => {
      beforeEach(() => {
        fetchBehaviour = 'httpError';
      });
      it('rejects with an error', async () => {
        await expect(queryXmlDocument(sampleXml)).rejects.toEqual(
          new EndpointError(
            'Received an error with code 401: <error>Random error</error>',
            401,
            false
          )
        );
      });
    });
    describe('HTTP fails for CORS reasons', () => {
      beforeEach(() => {
        fetchBehaviour = 'corsError';
      });
      it('rejects with an error', async () => {
        await expect(queryXmlDocument(sampleXml)).rejects.toThrowError(
          new EndpointError(
            `The document could not be fetched due to CORS limitations`
          )
        );
      });
    });
    describe('HTTP fails for network reasons', () => {
      beforeEach(() => {
        fetchBehaviour = 'networkError';
      });
      it('rejects with an error', async () => {
        await expect(queryXmlDocument(sampleXml)).rejects.toEqual(
          new EndpointError(
            'Fetching the document failed either due to network errors or unreachable host, error is: General network error'
          )
        );
      });
    });
    describe('HTTP succeeds but XML is malformed', () => {
      beforeEach(() => {
        fetchBehaviour = 'ok';
      });
      it('rejects with an error related to XML parsing', async () => {
        await expect(
          queryXmlDocument('<broken-xml</broken-xml>')
        ).rejects.toThrowError('Unclosed start tag for element `broken-xml`');
      });
    });
    describe('multiple similar HTTP requests in parallel', () => {
      beforeEach(() => {
        fetchBehaviour = 'delay';
        queryXmlDocument('https://abcd.com');
        queryXmlDocument('https://abcd.com');
        queryXmlDocument('https://abcd.com');
      });
      it('only fetches the document once', async () => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('setQueryParams', () => {
    it('adds new parameters if not present', () => {
      expect(
        setQueryParams('https://my.host/service?arg1=123', {
          ARG2: '45',
          Arg3: 'hello',
        })
      ).toBe('https://my.host/service?arg1=123&ARG2=45&Arg3=hello');
    });
    it('replaces existing parameters regardless of case', () => {
      expect(
        setQueryParams('https://my.host/service?ARG1=123&Arg2=bla&arg3', {
          ARG2: '45',
          Arg3: 'hello',
        })
      ).toBe('https://my.host/service?ARG1=123&ARG2=45&Arg3=hello');
    });
    it('sets a parameter without value if true', () => {
      expect(
        setQueryParams('https://my.host/service', {
          ARG2: true,
        })
      ).toBe('https://my.host/service?ARG2=');
    });
    it('appends an encoded URL if found (HTTP)', () => {
      expect(
        setQueryParams('http://bad.proxy/?url=http%3A%2F%2Fmy.host%2Fservice', {
          ARG2: '45',
          Arg3: 'hello',
        })
      ).toBe(
        'http://bad.proxy/?url=http%3A%2F%2Fmy.host%2Fservice%3FARG2%3D45%26Arg3%3Dhello'
      );
    });
    it('appends an encoded URL if found (HTTPS)', () => {
      expect(
        setQueryParams(
          'http://bad.proxy/?url=https%3A%2F%2Fmy.host%2Fservice',
          {
            ARG2: '45',
            Arg3: 'hello',
          }
        )
      ).toBe(
        'http://bad.proxy/?url=https%3A%2F%2Fmy.host%2Fservice%3FARG2%3D45%26Arg3%3Dhello'
      );
    });
  });

  describe('sharedFetch', () => {
    let originalFetch;

    beforeAll(() => {
      originalFetch = global.fetch; // keep reference of native impl
      global.fetch = jest.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              // return a different result every time
              const text = `request result: ${Math.floor(
                Math.random() * 100000
              )}`;
              resolve({
                text,
                status: 200,
                ok: true,
                clone: jest.fn().mockImplementation(function () {
                  return this;
                }),
              });
            }, 10);
          })
      );
    });
    afterAll(() => {
      global.fetch = originalFetch; // restore original impl
    });

    describe('multiple GET and HEAD requests on same resource', () => {
      let getResults, headResults;
      beforeEach(async () => {
        getResults = [];
        headResults = [];

        // these requests will be shared
        sharedFetch('http://test.org/resource1').then(
          (r) => (getResults[0] = r)
        );
        sharedFetch('http://test.org/resource1', 'HEAD').then(
          (r) => (headResults[0] = r)
        );
        jest.advanceTimersByTime(2);
        sharedFetch('http://test.org/resource1').then(
          (r) => (getResults[1] = r)
        );
        sharedFetch('http://test.org/resource1', 'HEAD').then(
          (r) => (headResults[1] = r)
        );
        jest.advanceTimersByTime(3);
        sharedFetch('http://test.org/resource1').then(
          (r) => (getResults[2] = r)
        );
        sharedFetch('http://test.org/resource1', 'HEAD').then(
          (r) => (headResults[2] = r)
        );
        await jest.advanceTimersByTime(10);
        await jest.runOnlyPendingTimers();

        // first batch has resolved
        sharedFetch('http://test.org/resource1', 'HEAD').then(
          (r) => (headResults[3] = r)
        );
        sharedFetch('http://test.org/resource1').then(
          (r) => (getResults[3] = r)
        );
        await jest.advanceTimersByTime(10);
        await jest.runOnlyPendingTimers();
      });
      it('only triggers two GET requests and two HEAD requests', () => {
        expect(global.fetch).toHaveBeenCalledTimes(4);
        expect((global.fetch as jest.Mock).mock.calls).toEqual([
          [
            'http://test.org/resource1',
            expect.objectContaining({ method: 'GET' }),
          ],
          [
            'http://test.org/resource1',
            expect.objectContaining({ method: 'HEAD' }),
          ],
          [
            'http://test.org/resource1',
            expect.objectContaining({ method: 'HEAD' }),
          ],
          [
            'http://test.org/resource1',
            expect.objectContaining({ method: 'GET' }),
          ],
        ]);
      });
      it('calls clone() on each response', () => {
        expect(getResults[0].clone).toHaveBeenCalled();
        expect(headResults[0].clone).toHaveBeenCalled();
      });
      it('shares result for simultaneous GET requests and not subsequent ones', () => {
        const sharedResult = getResults[0].text;
        const getResultsText = getResults.map((r) => r.text);
        expect(getResultsText).toEqual([
          sharedResult,
          sharedResult,
          sharedResult,
          expect.not.stringContaining(sharedResult),
        ]);
      });
      it('shares result for simultaneous HEAD requests and not subsequent ones', () => {
        const sharedResult = headResults[0].text;
        const headResultsText = headResults.map((r) => r.text);
        expect(headResultsText).toEqual([
          sharedResult,
          sharedResult,
          sharedResult,
          expect.not.stringContaining(sharedResult),
        ]);
      });
    });
    describe('GET and HEAD requests on different resources', () => {
      let getResults, headResults;
      beforeEach(async () => {
        getResults = [];
        headResults = [];

        // these requests will be not shared
        sharedFetch('http://test.org/resource1').then(
          (r) => (getResults[0] = r)
        );
        sharedFetch('http://test.org/resource2', 'HEAD').then(
          (r) => (headResults[0] = r)
        );
        sharedFetch('http://test.org/resource3').then(
          (r) => (getResults[1] = r)
        );
        sharedFetch('http://test.org/resource4', 'HEAD').then(
          (r) => (headResults[1] = r)
        );
        await jest.advanceTimersByTime(40);
        await jest.runOnlyPendingTimers();
      });
      it('triggers two GET requests and two HEAD requests', () => {
        expect(global.fetch).toHaveBeenCalledTimes(4);
        expect((global.fetch as jest.Mock).mock.calls).toEqual([
          [
            'http://test.org/resource1',
            expect.objectContaining({ method: 'GET' }),
          ],
          [
            'http://test.org/resource2',
            expect.objectContaining({ method: 'HEAD' }),
          ],
          [
            'http://test.org/resource3',
            expect.objectContaining({ method: 'GET' }),
          ],
          [
            'http://test.org/resource4',
            expect.objectContaining({ method: 'HEAD' }),
          ],
        ]);
      });
      it('does not share GET results', () => {
        expect(getResults[0].text).not.toBe(getResults[1].text);
      });
      it('does not share HEAD results', () => {
        expect(headResults[0].text).not.toBe(headResults[1].text);
      });
    });
  });

  describe('fetch options', () => {
    const sampleOptions = {
      referrer: 'abcd',
      mode: 'cors',
      headers: { hello: 'world' },
      credentials: 'include',
      integrity: 'abcdefg',
      redirect: 'follow',
    } as const;

    describe('used in queryXmlDocument', () => {
      beforeEach(() => {
        setFetchOptions(sampleOptions);
        queryXmlDocument('./hello.xml');
      });
      it('is used in the fetch() call', () => {
        expect(global.fetch).toHaveBeenCalledWith('./hello.xml', {
          ...sampleOptions,
          method: 'GET',
        });
      });
    });
    describe('used in sharedFetch', () => {
      beforeEach(() => {
        setFetchOptions(sampleOptions);
        sharedFetch('./hello.xml', 'HEAD');
      });
      it('is used in the fetch() call', () => {
        expect(global.fetch).toHaveBeenCalledWith('./hello.xml', {
          ...sampleOptions,
          method: 'HEAD',
        });
      });
    });
    describe('used in ogc-api fetchDocument', () => {
      beforeEach(() => {
        setFetchOptions(sampleOptions);
        global.fetchResponseFactory = () => '{ "hello": "world" }';
        fetchDocument('./hello.json');
      });
      it('is used in the fetch() call', () => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost/hello.json?f=json',
          {
            ...sampleOptions,
            method: 'GET',
            headers: {
              ...sampleOptions.headers,
              Accept: 'application/json,application/schema+json',
            },
          }
        );
      });
    });
    describe('used in worker', () => {
      let endpoint;
      beforeEach(() => {
        global.fetchResponseFactory = () => capabilities200;
        setFetchOptions(sampleOptions);
        endpoint = new WfsEndpoint(
          'https://my.test.service/ogc/wfs?service=wfs&request=DescribeFeatureType'
        );
      });
      it('is used in the fetch() call', async () => {
        await endpoint.isReady();
        expect(global.fetch).toHaveBeenCalledWith(
          'https://my.test.service/ogc/wfs?SERVICE=WFS&REQUEST=GetCapabilities',
          {
            ...sampleOptions,
            method: 'GET',
          }
        );
      });
    });
  });
});
