// tests/tms/link-utils.test.ts
import { normalizeUrl, getParentPath, fetchXml } from './link-utils.js';
import { sharedFetch } from '../shared/http-utils.js';

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

  describe('getParentPath', () => {
    it('should return parent path for a versioned URL', () => {
      const url = 'https://example.com/1.0.0/some/path';
      const parent = getParentPath(url);
      expect(parent).toBe('https://example.com/1.0.0/');
    });

    it('should return null if no version pattern is found', () => {
      const url = 'https://example.com/path/without/version';
      const parent = getParentPath(url);
      expect(parent).toBeNull();
    });

    it('should return the original URL when version is at the end', () => {
      const url = 'https://example.com/1.0.0';
      const parent = getParentPath(url);
      expect(parent).toBe('https://example.com/1.0.0');
    });

    it('should handle URLs with trailing slashes', () => {
      const url = 'https://example.com/1.0.0/some/path/';
      const parent = getParentPath(url);
      expect(parent).toBe('https://example.com/1.0.0/');
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
      expect(result).toBe(
        '<?xml version="1.0" encoding="UTF-8"?><root><child>Test</child></root>'
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
        'The document at https://example.com/not-xml does not appear to be valid XML.'
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
      expect(result).toBe('<root>Valid XML without declaration</root>');
    });
  });
});
