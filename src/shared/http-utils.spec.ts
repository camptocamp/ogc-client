import { EndpointError } from './errors';
import { queryXmlDocument, setQueryParams } from './http-utils';

const global = window as any;

describe('HTTP utils', () => {
  describe('queryXmlDocument', () => {
    const sampleXml = '<sample-xml><node1></node1><node2></node2></sample-xml>';

    let fetchBehaviour:
      | 'ok'
      | 'httpError'
      | 'corsError'
      | 'networkError'
      | 'delay';

    beforeAll(() => {
      fetchBehaviour = 'ok';
      global.fetch_ = global.fetch; // keep reference of native impl
      global.fetch = jest.fn((xmlString, opts) => {
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
            });
          case 'httpError':
            return Promise.resolve({
              text: () => Promise.resolve('<error>Random error</error>'),
              status: 401,
              ok: false,
            });
          case 'corsError':
            if (noCors)
              return Promise.resolve({
                status: 200,
                ok: true,
              });
            return Promise.reject(new Error('Cross origin headers missing'));
          case 'networkError':
            return Promise.reject(new Error('General network error'));
          case 'delay':
            return new Promise((resolve) => {
              setTimeout(() => resolve(xmlString), 10);
            });
        }
      });
    });

    afterAll(() => {
      global.fetch = global.fetch_; // restore original impl
    });

    beforeEach(() => {
      jest.clearAllMocks();
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
        await expect(queryXmlDocument(sampleXml)).rejects.toEqual(
          new EndpointError(expect.stringContaining('due to CORS'), 0, true)
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
            expect.stringContaining(
              'due to network errors or unreachable host'
            ),
            0,
            false
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
});
