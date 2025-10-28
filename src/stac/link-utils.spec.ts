import * as linkUtils from './link-utils.js';
import { StacDocument } from './link-utils.js';
import * as httpUtils from '../shared/http-utils.js';
import { EndpointError } from '../shared/errors.js';

describe('stac/link-utils', () => {
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

  describe('fetchStacDocument', () => {
    it('fetches and parses JSON document successfully', async () => {
      const mockData = {
        stac_version: '1.0.0',
        id: 'test',
        links: [],
      };
      const mockResponse = {
        ok: true,
        status: 200,
        clone: () => ({
          json: () => Promise.resolve(mockData),
        }),
      };

      (httpUtils.sharedFetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await linkUtils.fetchStacDocument(
        'https://example.com/api'
      );
      expect(result).toEqual(mockData);
      expect(httpUtils.sharedFetch).toHaveBeenCalled();
    });

    it('throws Error when fetch fails', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        clone: () => ({
          json: () => Promise.resolve({}),
        }),
      };

      (httpUtils.sharedFetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        linkUtils.fetchStacDocument('https://example.com/not-found')
      ).rejects.toThrow(Error);
    });

    it('throws Error when JSON parsing fails', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        clone: () => ({
          json: () => Promise.reject(new Error('Invalid JSON')),
        }),
      };

      (httpUtils.sharedFetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        linkUtils.fetchStacDocument('https://example.com/bad-json')
      ).rejects.toThrow(Error);
    });
  });

  describe('hasLinks', () => {
    it('returns true when document has the specified link rel', () => {
      const doc: StacDocument = {
        links: [
          { rel: 'self', href: 'http://example.com/self' },
          { rel: 'root', href: 'http://example.com/' },
        ],
      };

      expect(linkUtils.hasLinks(doc, 'self')).toBe(true);
      expect(linkUtils.hasLinks(doc, 'root')).toBe(true);
    });

    it('returns true when document has all specified link rels', () => {
      const doc: StacDocument = {
        links: [
          { rel: 'self', href: 'http://example.com/self' },
          { rel: 'root', href: 'http://example.com/' },
          { rel: 'items', href: 'http://example.com/items' },
        ],
      };

      expect(linkUtils.hasLinks(doc, ['self', 'root'])).toBe(true);
      expect(linkUtils.hasLinks(doc, ['self', 'items'])).toBe(true);
    });

    it('returns false when document is missing a link rel', () => {
      const doc: StacDocument = {
        links: [{ rel: 'self', href: 'http://example.com/self' }],
      };

      expect(linkUtils.hasLinks(doc, 'nonexistent')).toBe(false);
      expect(linkUtils.hasLinks(doc, ['self', 'nonexistent'])).toBe(false);
    });

    it('returns false when document has no links array', () => {
      const doc: StacDocument = {};

      expect(linkUtils.hasLinks(doc, 'self')).toBe(false);
    });
  });

  describe('getLinks', () => {
    it('returns links matching a single rel type', () => {
      const doc: StacDocument = {
        links: [
          {
            rel: 'item',
            href: 'http://example.com/item1',
            type: 'application/json',
          },
          {
            rel: 'item',
            href: 'http://example.com/item2',
            type: 'application/json',
          },
          { rel: 'self', href: 'http://example.com/self' },
        ],
      };

      const result = linkUtils.getLinks(doc, 'item');
      expect(result).toHaveLength(2);
      expect(result[0].href).toBe('http://example.com/item1');
      expect(result[1].href).toBe('http://example.com/item2');
    });

    it('returns links matching multiple rel types', () => {
      const doc: StacDocument = {
        links: [
          { rel: 'self', href: 'http://example.com/self' },
          { rel: 'root', href: 'http://example.com/' },
          { rel: 'parent', href: 'http://example.com/parent' },
        ],
      };

      const result = linkUtils.getLinks(doc, ['self', 'root']);
      expect(result).toHaveLength(2);
      expect(result.map((l) => l.rel)).toEqual(['self', 'root']);
    });

    it('filters links by MIME type', () => {
      const doc: StacDocument = {
        links: [
          {
            rel: 'item',
            href: 'http://example.com/item.json',
            type: 'application/json',
          },
          {
            rel: 'item',
            href: 'http://example.com/item.html',
            type: 'text/html',
          },
        ],
      };

      const result = linkUtils.getLinks(doc, 'item', 'application/json');
      expect(result).toHaveLength(1);
      expect(result[0].href).toBe('http://example.com/item.json');
    });

    it('returns empty array when no links match', () => {
      const doc: StacDocument = {
        links: [{ rel: 'self', href: 'http://example.com/self' }],
      };

      expect(linkUtils.getLinks(doc, 'nonexistent')).toEqual([]);
    });

    it('returns empty array when document has no links', () => {
      const doc: StacDocument = {};

      expect(linkUtils.getLinks(doc, 'self')).toEqual([]);
    });
  });

  describe('getLinkUrl', () => {
    it('returns URL for absolute href', () => {
      const doc: StacDocument = {
        links: [{ rel: 'self', href: 'https://example.com/absolute' }],
      };

      const url = linkUtils.getLinkUrl(doc, 'self', 'https://example.com/');
      expect(url).toBe('https://example.com/absolute');
    });

    it('resolves relative href against base URL', () => {
      const doc: StacDocument = {
        links: [{ rel: 'items', href: 'items' }],
      };

      const url = linkUtils.getLinkUrl(
        doc,
        'items',
        'https://example.com/collections/test/'
      );
      expect(url).toBe('https://example.com/collections/test/items');
    });

    it('returns null when link is not found', () => {
      const doc: StacDocument = {
        links: [{ rel: 'self', href: 'http://example.com/self' }],
      };

      const url = linkUtils.getLinkUrl(
        doc,
        'nonexistent',
        'https://example.com/'
      );
      expect(url).toBeNull();
    });

    it('filters by MIME type', () => {
      const doc: StacDocument = {
        links: [
          {
            rel: 'alternate',
            href: 'http://example.com/data.json',
            type: 'application/json',
          },
          {
            rel: 'alternate',
            href: 'http://example.com/data.html',
            type: 'text/html',
          },
        ],
      };

      const url = linkUtils.getLinkUrl(
        doc,
        'alternate',
        'https://example.com/',
        'text/html'
      );
      expect(url).toBe('http://example.com/data.html');
    });
  });

  describe('fetchLink', () => {
    it('fetches document by following a link relation', async () => {
      const doc: StacDocument = {
        links: [{ rel: 'items', href: 'http://example.com/items' }],
      };

      const mockData = { type: 'FeatureCollection', features: [] };
      const mockResponse = {
        ok: true,
        status: 200,
        clone: () => ({
          json: () => Promise.resolve(mockData),
        }),
      };

      (httpUtils.sharedFetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await linkUtils.fetchLink(
        doc,
        'items',
        'https://example.com/'
      );
      expect(result).toEqual(mockData);
    });

    it('throws EndpointError when link is not found', async () => {
      const doc: StacDocument = {
        links: [{ rel: 'self', href: 'http://example.com/self' }],
      };

      await expect(
        linkUtils.fetchLink(doc, 'nonexistent', 'https://example.com/')
      ).rejects.toThrow(EndpointError);
      await expect(
        linkUtils.fetchLink(doc, 'nonexistent', 'https://example.com/')
      ).rejects.toThrow('No link found with rel type: nonexistent');
    });

    it('throws EndpointError when link with specific MIME type is not found', async () => {
      const doc: StacDocument = {
        links: [
          {
            rel: 'alternate',
            href: 'http://example.com/data.html',
            type: 'text/html',
          },
        ],
      };

      await expect(
        linkUtils.fetchLink(
          doc,
          'alternate',
          'https://example.com/',
          'application/json'
        )
      ).rejects.toThrow('mime type: application/json');
    });
  });

  describe('assertHasLinks', () => {
    it('does not throw when all required links are present', () => {
      const doc: StacDocument = {
        links: [
          { rel: 'self', href: 'http://example.com/self' },
          { rel: 'root', href: 'http://example.com/' },
        ],
      };

      expect(() => linkUtils.assertHasLinks(doc, 'self')).not.toThrow();
      expect(() =>
        linkUtils.assertHasLinks(doc, ['self', 'root'])
      ).not.toThrow();
    });

    it('throws EndpointError when required link is missing', () => {
      const doc: StacDocument = {
        links: [{ rel: 'self', href: 'http://example.com/self' }],
      };

      expect(() => linkUtils.assertHasLinks(doc, 'missing')).toThrow(
        EndpointError
      );
      expect(() => linkUtils.assertHasLinks(doc, 'missing')).toThrow(
        'missing required links with rel types: missing'
      );
    });

    it('throws EndpointError when some required links are missing', () => {
      const doc: StacDocument = {
        links: [{ rel: 'self', href: 'http://example.com/self' }],
      };

      expect(() =>
        linkUtils.assertHasLinks(doc, ['self', 'root', 'items'])
      ).toThrow(EndpointError);
      expect(() =>
        linkUtils.assertHasLinks(doc, ['self', 'root', 'items'])
      ).toThrow('missing required links with rel types: root, items');
    });
  });
});
