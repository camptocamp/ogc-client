import { EndpointError } from './errors';
import { queryXmlDocument } from './http-utils';

describe('HTTP utils', () => {
  describe('queryXmlDocument', () => {
    const sampleXml = '<sample-xml><node1></node1><node2></node2></sample-xml>';

    /** @type {'ok'|'httpError'|'corsError'|'networkError'|'delay'} */
    let fetchBehaviour;

    window.fetch_ = window.fetch; // keep reference of native impl
    window.fetch = jest.fn((xmlString, opts) => {
      const noCors = opts && opts.mode === 'no-cors';
      switch (fetchBehaviour) {
        case 'ok':
          return Promise.resolve({
            text: () => Promise.resolve(xmlString),
            status: 200,
            ok: true,
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
        expect(window.fetch).toHaveBeenCalledTimes(1);
      });
    });

    afterAll(() => {
      window.fetch = window.fetch_; // restore original impl
    });
  });
});
