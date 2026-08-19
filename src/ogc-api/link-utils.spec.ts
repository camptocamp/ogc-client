import { OgcApiDocument } from '../ogc-api/model.js';
import {
  fetchCollectionRoot,
  fetchDocument,
  fetchRoot,
  getLinks,
  hasLinks,
} from './link-utils.js';

describe('link-utils', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'location', {
      value: {
        toString: () => 'https://example.com/base/',
      },
      writable: true,
    });

    const items = { features: [] };
    const landingPage = {
      links: [
        { rel: 'service-desc', href: 'https://example.com/api?f=json' },
        { rel: 'conformance', href: 'https://example.com/conformance' },
      ],
    };
    const collection = {
      id: 'big',
      links: [
        { rel: 'items', href: 'https://example.com/collections/big/items' },
      ],
    };

    globalThis.fetchResponseFactory = (url: string) => {
      if (url.indexOf('items') > -1) {
        return JSON.stringify(items);
      } else if (url.indexOf('collections') > -1) {
        return JSON.stringify(collection);
      } else {
        return JSON.stringify(landingPage);
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchDocument', () => {
    it('fetches and parses JSON document', async () => {
      globalThis.fetchResponseFactory = () => '{"title": "Test Document" }';

      const result = await fetchDocument('https://example.com/api');
      expect(result).toEqual({ title: 'Test Document' });
      expect(globalThis.fetch).toHaveBeenCalled();
    });
  });

  describe('fetchRoot with an /items initial url', () => {
    it('forces limit=1 even if the url already has a larger limit', async () => {
      await fetchRoot('https://example.com/collections/big/items?limit=500');
      const firstFetchedUrl = new URL(
        (globalThis.fetch as jest.Mock).mock.calls[0][0],
      );
      expect(firstFetchedUrl.pathname).toBe('/collections/big/items');
      expect(firstFetchedUrl.searchParams.get('limit')).toBe('1');
    });
  });

  describe('fetchCollectionRoot with an /items initial url', () => {
    it('adds limit=1 to an /items url that has no limit', async () => {
      await fetchCollectionRoot('https://example.com/collections/big/items');
      const firstFetchedUrl = new URL(
        (globalThis.fetch as jest.Mock).mock.calls[0][0],
      );
      expect(firstFetchedUrl.pathname).toBe('/collections/big/items');
      expect(firstFetchedUrl.searchParams.get('limit')).toBe('1');
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

      const result = getLinks(mockDoc, 'data');
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

      expect(hasLinks(mockDoc, 'data')).toBe(true);
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

      expect(hasLinks(mockDoc, 'nonexistent')).toBe(false);
    });
  });
});
