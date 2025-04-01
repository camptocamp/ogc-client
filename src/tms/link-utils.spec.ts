// tests/tms/link-utils.test.ts
import { normalizeUrl, fetchXml } from './link-utils.js';
import { sharedFetch } from '../shared/http-utils.js';
import { parseXmlString } from '../shared/xml-utils.js';

// Mock the sharedFetch function to simulate HTTP responses.
jest.mock('../../src/shared/http-utils', () => ({
  sharedFetch: jest.fn().mockImplementation(async () => ({
    ok: true,
    clone: () => ({
      text: async () => '<?xml version="1.0" encoding="UTF-8"?><root></root>',
    }),
  })),
}));

describe('Link Utilities', () => {
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
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('successfully fetches XML content', async () => {
      // Simulate a valid XML response.
      (sharedFetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        clone: () => ({
          text: async () =>
            '<?xml version="1.0" encoding="UTF-8"?><root><child>Test</child></root>',
        }),
      });

      const result = await fetchXml('https://example.com/data.xml');
      expect(result).toEqual(
        parseXmlString(
          '<?xml version="1.0" encoding="UTF-8"?><root><child>Test</child></root>'
        )
      );
      expect(sharedFetch).toHaveBeenCalledWith(
        'https://example.com/data.xml',
        'GET',
        true
      );
    });

    it('throws an error when the response is not OK', async () => {
      (sharedFetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });
      await expect(fetchXml('https://example.com/bad-url')).rejects.toThrow(
        'The document at https://example.com/bad-url could not be fetched.'
      );
    });

    it('throws an error when content is not XML', async () => {
      (sharedFetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        clone: () => ({
          text: async () => 'This is not XML content',
        }),
      });
      await expect(fetchXml('https://example.com/not-xml')).rejects.toThrow(
        'Root element is missing or invalid (line 1, column 1)'
      );
    });

    it('accepts XML without declaration', async () => {
      (sharedFetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        clone: () => ({
          text: async () => '<root>Valid XML without declaration</root>',
        }),
      });
      const result = await fetchXml('https://example.com/xml-tag');
      expect(result).toEqual(
        parseXmlString('<root>Valid XML without declaration</root>')
      );
    });
  });
});
