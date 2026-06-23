import * as linkUtils from './link-utils.js';
import { OgcApiDocument } from '../ogc-api/model.js';
import * as httpUtils from '../shared/http-utils.js';

describe('link-utils', () => {
  beforeEach(() => {
    jest.spyOn(httpUtils, 'sharedFetch');

    Object.defineProperty(globalThis, 'location', {
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

  const itemsResponse = {
    ok: true,
    clone: () => ({ json: () => Promise.resolve({ features: [] }) }),
  };
  const firstFetchedUrl = () =>
    new URL((httpUtils.sharedFetch as jest.Mock).mock.calls[0][0]);

  describe('fetchRoot with an /items initial url', () => {
    it('forces limit=1 even if the url already has a larger limit', async () => {
      const landingPage = {
        links: [
          { rel: 'service-desc', href: 'https://example.com/api?f=json' },
          { rel: 'conformance', href: 'https://example.com/conformance' },
        ],
      };
      (httpUtils.sharedFetch as jest.Mock)
        .mockResolvedValueOnce(itemsResponse)
        .mockResolvedValue({
          ok: true,
          clone: () => ({ json: () => Promise.resolve(landingPage) }),
        });

      await linkUtils.fetchRoot(
        'https://example.com/collections/big/items?limit=500'
      );

      expect(firstFetchedUrl().pathname).toBe('/collections/big/items');
      expect(firstFetchedUrl().searchParams.get('limit')).toBe('1');
    });
  });

  describe('fetchCollectionRoot with an /items initial url', () => {
    it('adds limit=1 to an /items url that has no limit', async () => {
      const collection = {
        id: 'big',
        links: [
          { rel: 'items', href: 'https://example.com/collections/big/items' },
        ],
      };
      (httpUtils.sharedFetch as jest.Mock)
        .mockResolvedValueOnce(itemsResponse)
        .mockResolvedValue({
          ok: true,
          clone: () => ({ json: () => Promise.resolve(collection) }),
        });

      await linkUtils.fetchCollectionRoot(
        'https://example.com/collections/big/items'
      );

      expect(firstFetchedUrl().pathname).toBe('/collections/big/items');
      expect(firstFetchedUrl().searchParams.get('limit')).toBe('1');
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
