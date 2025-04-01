import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as linkUtils from './link-utils.js';
import { OgcApiDocument } from './model.js';
import * as httpUtils from '../shared/http-utils.js';

describe('link-utils', () => {
  beforeEach(() => {
    jest.spyOn(httpUtils, 'sharedFetch');

    Object.defineProperty(window, 'location', {
      value: {
        toString: () => 'https://example.com/base/',
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchDocument', () => {
    it('fetches and parses JSON document', async () => {
      const mockResponse = {
        ok: true,
        clone: () => ({
          json: () => Promise.resolve({ title: 'Test Document' }),
        }),
      };

      (httpUtils.sharedFetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await linkUtils.fetchDocument('https://example.com/api');
      expect(result).toEqual({ title: 'Test Document' });
      expect(httpUtils.sharedFetch).toHaveBeenCalled();
    });
  });

  describe('getLinks', () => {
    it('returns links matching the provided rel type', () => {
      const mockDoc: OgcApiDocument = {
        links: [
          {
            rel: 'data',
            href: '/data',
            type: 'application/json',
            title: 'Data Link',
          },
        ],
      };

      const result = linkUtils.getLinks(mockDoc, 'data');
      expect(result).toHaveLength(1);
      expect(result[0].href).toBe('/data');
    });
  });

  describe('hasLinks', () => {
    it('returns true when link exists', () => {
      const mockDoc: OgcApiDocument = {
        links: [
          {
            rel: 'data',
            href: '/data',
            type: 'application/json',
            title: 'Data Link',
          },
        ],
      };

      expect(linkUtils.hasLinks(mockDoc, 'data')).toBe(true);
    });

    it('returns false when link does not exist', () => {
      const mockDoc: OgcApiDocument = {
        links: [
          {
            rel: 'self',
            href: '/self',
            type: 'application/json',
            title: 'Self Link',
          },
        ],
      };

      expect(linkUtils.hasLinks(mockDoc, 'nonexistent')).toBe(false);
    });
  });
});
