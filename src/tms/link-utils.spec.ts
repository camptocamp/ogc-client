import { fetchXml, normalizeUrl } from './link-utils.js';
import { parseXmlString } from '../shared/xml-utils.js';

afterEach(() => {
  jest.clearAllMocks();
});

describe('TMS link utilities', () => {
  let originalFetch;

  beforeAll(() => {
    originalFetch = globalThis.fetch; // keep reference of native impl
    globalThis.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        text: async () => '<?xml version="1.0" encoding="UTF-8"?><root></root>',
        status: 200,
        ok: true,
        headers: new Headers(),
        clone: function () {
          return this;
        },
      });
    });
  });

  afterAll(() => {
    globalThis.fetch = originalFetch; // restore original impl
  });

  describe('normalizeUrl', () => {
    it('should lowercase hostname and add a trailing slash', () => {
      const input = 'HTTP://Example.com/path';
      const output = normalizeUrl(input);
      expect(output).toBe('http://example.com/path/');
    });

    it('should not add extra slash if trailing slash exists', () => {
      const input = 'http://example.com/path/';
      const output = normalizeUrl(input);
      expect(output).toBe('http://example.com/path/');
    });
  });

  describe('fetchXml', () => {
    it('successfully fetches XML content', async () => {
      // Simulate a valid XML response.
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () =>
          '<?xml version="1.0" encoding="UTF-8"?><root><child>Test</child></root>',
        clone: function () {
          return this;
        },
      });

      const result = await fetchXml('https://example.com/data.xml');
      expect(result).toEqual(
        parseXmlString(
          '<?xml version="1.0" encoding="UTF-8"?><root><child>Test</child></root>'
        )
      );
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://example.com/data.xml',
        {
          headers: { Accept: 'application/json,application/schema+json' },
          method: 'GET',
        }
      );
    });

    it('throws an error when the response is not OK', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        clone: function () {
          return this;
        },
      });
      await expect(fetchXml('https://example.com/bad-url')).rejects.toThrow(
        'The document at https://example.com/bad-url could not be fetched.'
      );
    });

    it('throws an error when content is not XML', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => 'This is not XML content',
        clone: function () {
          return this;
        },
      });
      await expect(fetchXml('https://example.com/not-xml')).rejects.toThrow(
        'Root element is missing or invalid (line 1, column 1)'
      );
    });

    it('accepts XML without declaration', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '<root>Valid XML without declaration</root>',
        clone: function () {
          return this;
        },
      });
      const result = await fetchXml('https://example.com/xml-tag');
      expect(result).toEqual(
        parseXmlString('<root>Valid XML without declaration</root>')
      );
    });
  });
});
