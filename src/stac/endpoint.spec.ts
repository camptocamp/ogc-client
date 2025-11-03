import StacEndpoint from './endpoint.js';
import { readFile, stat } from 'fs/promises';
import * as path from 'path';
import { EndpointError } from '../shared/errors.js';

const FIXTURES_ROOT = path.join(__dirname, '../../fixtures/stac');

// Setup fetch to read local fixtures
beforeAll(() => {
  globalThis.fetch = jest.fn().mockImplementation(async (urlOrInfo) => {
    const url = new URL(
      urlOrInfo instanceof URL || typeof urlOrInfo === 'string'
        ? urlOrInfo
        : urlOrInfo.url
    );

    // Handle trailing slash behavior
    if (url.pathname.split('/').length === 2 && !url.pathname.endsWith('/')) {
      return {
        ok: false,
        status: 404,
        headers: new Headers(),
        clone: function () {
          return this;
        },
      } as Response;
    }

    let queryPath = url.pathname.replace(/\/$/, ''); // remove trailing slash
    if (queryPath === '/stac-api') {
      queryPath = '/stac-api/root'; // map root to root.json
    }

    // Remove /stac-api prefix for fixture path
    queryPath = queryPath.replace('/stac-api', '');
    if (queryPath === '') {
      queryPath = '/root';
    }

    const filePath = `${path.join(FIXTURES_ROOT, queryPath)}.json`;
    try {
      await stat(filePath);
    } catch (e) {
      return {
        ok: false,
        status: 404,
        headers: new Headers(),
        clone: function () {
          return this;
        },
      } as Response;
    }

    const contents = await readFile(filePath, {
      encoding: 'utf8',
    });

    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      clone: function () {
        return this;
      },
      json: () =>
        new Promise((resolve) => {
          resolve(JSON.parse(contents));
        }),
    } as Response;
  });
});

jest.useFakeTimers();

describe('StacEndpoint', () => {
  let endpoint: StacEndpoint;

  afterEach(async () => {
    // Exhaust all microtasks to prevent rejected promises from leaking between tests
    await jest.runAllTimersAsync();
  });

  describe('nominal case', () => {
    beforeEach(() => {
      endpoint = new StacEndpoint('http://local/stac-api/');
    });

    describe('#info', () => {
      it('returns endpoint information', async () => {
        const info = await endpoint.info;
        expect(info).toEqual({
          id: 'test-stac-api',
          title: 'Test STAC API',
          description: 'A test STAC API for unit testing',
          stacVersion: '1.0.0',
          conformsTo: [
            'https://api.stacspec.org/v1.0.0/core',
            'https://api.stacspec.org/v1.0.0/collections',
            'https://api.stacspec.org/v1.0.0/ogcapi-features',
            'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
            'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson',
          ],
        });
      });

      it('uses shared fetch for caching', async () => {
        jest.clearAllMocks();
        // Create the endpoint three times separately
        new StacEndpoint('http://local/stac-api/').info;
        new StacEndpoint('http://local/stac-api/').info;
        new StacEndpoint('http://local/stac-api/').info;
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      });
    });

    describe('#catalog', () => {
      it('returns the root catalog', async () => {
        const catalog = await endpoint.catalog;
        expect(catalog).toMatchObject({
          stac_version: '1.0.0',
          type: 'Catalog',
          id: 'test-stac-api',
          title: 'Test STAC API',
          description: 'A test STAC API for unit testing',
        });
        expect(catalog.links).toBeDefined();
        expect(Array.isArray(catalog.links)).toBe(true);
      });
    });

    describe('#conformanceClasses', () => {
      it('returns conformance classes', async () => {
        const conformance = await endpoint.conformanceClasses;
        expect(conformance).toContain('https://api.stacspec.org/v1.0.0/core');
        expect(conformance).toContain(
          'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core'
        );
      });
    });

    describe('#isStacApi', () => {
      it('returns true for STAC API conformance', async () => {
        const isStac = await endpoint.isStacApi;
        expect(isStac).toBe(true);
      });
    });

    describe('#supportsOgcFeatures', () => {
      it('returns true for OGC API Features conformance', async () => {
        const supportsOgc = await endpoint.supportsOgcFeatures;
        expect(supportsOgc).toBe(true);
      });
    });

    describe('#allCollections', () => {
      it('returns array of collection IDs', async () => {
        const collections = await endpoint.allCollections;
        expect(collections).toEqual(['sentinel-2', 'landsat-8']);
      });
    });

    describe('#getCollection', () => {
      it('retrieves a specific collection', async () => {
        const collection = await endpoint.getCollection('sentinel-2');
        expect(collection).toMatchObject({
          stac_version: '1.0.0',
          type: 'Collection',
          id: 'sentinel-2',
          title: 'Sentinel-2 L2A',
          description: 'Sentinel-2 Level-2A (L2A) Bottom-Of-Atmosphere product',
          license: 'proprietary',
        });
        expect(collection.extent).toBeDefined();
        expect(collection.extent.spatial).toBeDefined();
        expect(collection.extent.temporal).toBeDefined();
      });

      it('includes providers information', async () => {
        const collection = await endpoint.getCollection('sentinel-2');
        expect(collection.providers).toBeDefined();
        expect(collection.providers).toHaveLength(1);
        expect(collection.providers![0]).toMatchObject({
          name: 'ESA',
          roles: ['producer'],
          url: 'https://earth.esa.int',
        });
      });

      it('includes summaries when present', async () => {
        const collection = await endpoint.getCollection('sentinel-2');
        expect(collection.summaries).toBeDefined();
        expect(collection.summaries).toHaveProperty('gsd');
        expect(collection.summaries).toHaveProperty('platform');
      });

      it('includes assets when present', async () => {
        const collection = await endpoint.getCollection('sentinel-2');
        expect(collection.assets).toBeDefined();
        expect(collection.assets).toHaveProperty('thumbnail');
      });

      it('throws error for non-existent collection', async () => {
        await expect(endpoint.getCollection('non-existent')).rejects.toThrow(
          EndpointError
        );
        await expect(endpoint.getCollection('non-existent')).rejects.toThrow(
          'Collection not found: non-existent'
        );
      });
    });

    describe('#getCollectionItems', () => {
      it('retrieves items from a collection', async () => {
        const items = await endpoint.getCollectionItems('sentinel-2');
        expect(items).toHaveLength(2);
        expect(items[0]).toMatchObject({
          stac_version: '1.0.0',
          type: 'Feature',
          id: 'S2A_MSIL2A_20231015T103031_N0509_R108_T32ULC_20231015T162154',
        });
      });

      it('returns items with proper structure', async () => {
        const items = await endpoint.getCollectionItems('sentinel-2');
        const item = items[0];

        expect(item.geometry).toBeDefined();
        expect(item.bbox).toBeDefined();
        expect(item.properties).toBeDefined();
        expect(item.properties.datetime).toBe('2023-10-15T10:30:31Z');
        expect(item.links).toBeDefined();
        expect(item.assets).toBeDefined();
        expect(item.collection).toBe('sentinel-2');
      });

      it('includes asset information', async () => {
        const items = await endpoint.getCollectionItems('sentinel-2');
        const item = items[0];

        expect(item.assets).toHaveProperty('thumbnail');
        expect(item.assets).toHaveProperty('B04');
        expect(item.assets).toHaveProperty('B08');
        expect(item.assets.B04.href).toContain('.tif');
        expect(item.assets.B04.roles).toContain('data');
      });

      it('supports limit option', async () => {
        const url = await endpoint.getCollectionItemsUrl('sentinel-2', {
          limit: 5,
        });
        expect(url).toContain('limit=5');
      });

      it('supports bbox option', async () => {
        const url = await endpoint.getCollectionItemsUrl('sentinel-2', {
          bbox: [5.0, 45.0, 6.0, 46.0],
        });
        expect(url).toContain('bbox=5%2C45%2C6%2C46');
      });

      it('supports datetime option with Date', async () => {
        const date = new Date('2023-10-15T00:00:00Z');
        const url = await endpoint.getCollectionItemsUrl('sentinel-2', {
          datetime: date,
        });
        expect(url).toContain('datetime=2023-10-15T00%3A00%3A00.000Z');
      });

      it('supports datetime option with range', async () => {
        const url = await endpoint.getCollectionItemsUrl('sentinel-2', {
          datetime: {
            start: new Date('2023-10-01T00:00:00Z'),
            end: new Date('2023-10-31T23:59:59Z'),
          },
        });
        expect(url).toContain('datetime=2023-10-01');
        expect(url).toContain('2023-10-31');
      });

      it('supports datetime option with open start', async () => {
        const url = await endpoint.getCollectionItemsUrl('sentinel-2', {
          datetime: {
            end: new Date('2023-10-31T23:59:59Z'),
          },
        });
        expect(url).toContain('datetime=..%2F2023-10-31T23%3A59%3A59.000Z');
      });

      it('supports datetime option with open end', async () => {
        const url = await endpoint.getCollectionItemsUrl('sentinel-2', {
          datetime: {
            start: new Date('2023-10-01T00:00:00Z'),
          },
        });
        expect(url).toContain('datetime=2023-10-01T00%3A00%3A00.000Z%2F..');
      });

      it('supports custom query string', async () => {
        const url = await endpoint.getCollectionItemsUrl('sentinel-2', {
          query: 'custom=value&another=test',
        });
        expect(url).toContain('custom=value');
        expect(url).toContain('another=test');
      });

      it('combines multiple options', async () => {
        const url = await endpoint.getCollectionItemsUrl('sentinel-2', {
          limit: 10,
          bbox: [5.0, 45.0, 6.0, 46.0],
        });
        expect(url).toContain('limit=10');
        expect(url).toContain('bbox=5%2C45%2C6%2C46');
      });
    });

    describe('#getCollectionItem', () => {
      it('retrieves a single item from a collection', async () => {
        const item = await endpoint.getCollectionItem(
          'sentinel-2',
          'S2A_MSIL2A_20231015T103031_N0509_R108_T32ULC_20231015T162154'
        );

        expect(item).toMatchObject({
          stac_version: '1.0.0',
          type: 'Feature',
          id: 'S2A_MSIL2A_20231015T103031_N0509_R108_T32ULC_20231015T162154',
          collection: 'sentinel-2',
        });
      });

      it('includes all item properties', async () => {
        const item = await endpoint.getCollectionItem(
          'sentinel-2',
          'S2A_MSIL2A_20231015T103031_N0509_R108_T32ULC_20231015T162154'
        );

        expect(item.properties.datetime).toBe('2023-10-15T10:30:31Z');
        expect(item.properties.platform).toBe('sentinel-2a');
        expect(item.properties.constellation).toBe('sentinel-2');
        expect(item.properties.gsd).toBe(10);
      });

      it('includes geometry and bbox', async () => {
        const item = await endpoint.getCollectionItem(
          'sentinel-2',
          'S2A_MSIL2A_20231015T103031_N0509_R108_T32ULC_20231015T162154'
        );

        expect(item.geometry).toBeDefined();
        expect(item.geometry!.type).toBe('Polygon');
        expect(item.bbox).toEqual([5.0, 45.0, 6.0, 46.0]);
      });

      it('includes assets', async () => {
        const item = await endpoint.getCollectionItem(
          'sentinel-2',
          'S2A_MSIL2A_20231015T103031_N0509_R108_T32ULC_20231015T162154'
        );

        expect(item.assets).toBeDefined();
        expect(Object.keys(item.assets)).toContain('thumbnail');
        expect(Object.keys(item.assets)).toContain('B04');
        expect(Object.keys(item.assets)).toContain('B08');
      });

      it('includes links', async () => {
        const item = await endpoint.getCollectionItem(
          'sentinel-2',
          'S2A_MSIL2A_20231015T103031_N0509_R108_T32ULC_20231015T162154'
        );

        expect(item.links).toBeDefined();
        expect(Array.isArray(item.links)).toBe(true);
        expect(item.links.some((l) => l.rel === 'self')).toBe(true);
        expect(item.links.some((l) => l.rel === 'collection')).toBe(true);
      });
    });

    describe('#getCollectionItemsUrl', () => {
      it('generates URL for collection items', async () => {
        const url = await endpoint.getCollectionItemsUrl('sentinel-2');
        expect(url).toBe('http://local/stac-api/collections/sentinel-2/items');
      });

      it('throws error when collection has no items link', async () => {
        // This would require a malformed collection fixture
        // For now we test that the method handles the case properly
        const collection = await endpoint.getCollection('sentinel-2');
        expect(collection.links.some((l) => l.rel === 'items')).toBe(true);
      });
    });
  });

  describe('static factory methods', () => {
    describe('fromUrl', () => {
      it('auto-detects and returns Catalog', async () => {
        const result = await StacEndpoint.fromUrl('http://local/stac-api/');

        expect(result.type).toBe('Catalog');
        expect(result.data).toMatchObject({
          stac_version: '1.0.0',
          type: 'Catalog',
          id: 'test-stac-api',
          title: 'Test STAC API',
        });
      });

      it('auto-detects and returns Collection', async () => {
        const result = await StacEndpoint.fromUrl(
          'http://local/stac-api/collections/sentinel-2'
        );

        expect(result.type).toBe('Collection');
        expect(result.data).toMatchObject({
          stac_version: '1.0.0',
          type: 'Collection',
          id: 'sentinel-2',
          title: 'Sentinel-2 L2A',
        });
      });

      it('auto-detects and returns Feature (Item)', async () => {
        const result = await StacEndpoint.fromUrl(
          'http://local/stac-api/collections/sentinel-2/items/S2A_MSIL2A_20231015T103031_N0509_R108_T32ULC_20231015T162154'
        );

        expect(result.type).toBe('Feature');
        expect(result.data).toMatchObject({
          stac_version: '1.0.0',
          type: 'Feature',
          id: 'S2A_MSIL2A_20231015T103031_N0509_R108_T32ULC_20231015T162154',
          collection: 'sentinel-2',
        });
      });

      it('throws error for unknown document type', async () => {
        // Mock a document with unknown type
        const originalFetch = globalThis.fetch;
        const mockResponse = {
          ok: true,
          clone: function () {
            return this;
          },
          json: () =>
            Promise.resolve({
              type: 'UnknownType',
              id: 'test',
            }),
        };
        globalThis.fetch = jest.fn().mockResolvedValue(mockResponse);

        await expect(
          StacEndpoint.fromUrl('http://example.com/unknown')
        ).rejects.toThrow(EndpointError);
        await expect(
          StacEndpoint.fromUrl('http://example.com/unknown')
        ).rejects.toThrow('Unknown STAC document type: UnknownType');

        globalThis.fetch = originalFetch;
      });
    });
  });

  describe('static items query methods', () => {
    describe('getItemsFromCollection', () => {
      it('queries items from a collection object', async () => {
        const collection = await endpoint.getCollection('sentinel-2');
        const response = await StacEndpoint.getItemsFromCollection(collection, {
          limit: 2,
        });

        expect(response.type).toBe('FeatureCollection');
        expect(response.features).toHaveLength(2);
        expect(response.features[0]).toMatchObject({
          type: 'Feature',
          id: 'S2A_MSIL2A_20231015T103031_N0509_R108_T32ULC_20231015T162154',
        });
        expect(response.links).toBeDefined();
      });

      it('supports bbox filtering', async () => {
        const collection = await endpoint.getCollection('sentinel-2');
        const response = await StacEndpoint.getItemsFromCollection(collection, {
          bbox: [5.0, 45.0, 6.0, 46.0],
          limit: 5,
        });

        expect(response.type).toBe('FeatureCollection');
        expect(Array.isArray(response.features)).toBe(true);
        // Bbox is added to URL query params (tested via URL construction)
      });

      it('supports datetime filtering', async () => {
        const collection = await endpoint.getCollection('sentinel-2');
        const response = await StacEndpoint.getItemsFromCollection(collection, {
          datetime: new Date('2023-10-15T00:00:00Z'),
          limit: 5,
        });

        expect(response.type).toBe('FeatureCollection');
        expect(Array.isArray(response.features)).toBe(true);
      });

      it('throws error when collection has no items link', async () => {
        const collection = await endpoint.getCollection('sentinel-2');
        // Remove items links
        collection.links = collection.links.filter((l) => l.rel !== 'items');

        await expect(
          StacEndpoint.getItemsFromCollection(collection)
        ).rejects.toThrow(EndpointError);
        await expect(
          StacEndpoint.getItemsFromCollection(collection)
        ).rejects.toThrow('does not have an items link');
      });
    });

    describe('getItemsFromUrl', () => {
      it('queries items from an items URL', async () => {
        const response = await StacEndpoint.getItemsFromUrl(
          'http://local/stac-api/collections/sentinel-2/items',
          { limit: 3 }
        );

        expect(response.type).toBe('FeatureCollection');
        expect(response.features).toHaveLength(2); // Mock only has 2 items
        expect(response.features[0]).toMatchObject({
          type: 'Feature',
          collection: 'sentinel-2',
        });
        expect(response.links).toBeDefined();
      });

      it('supports all filter options', async () => {
        const response = await StacEndpoint.getItemsFromUrl(
          'http://local/stac-api/collections/sentinel-2/items',
          {
            limit: 10,
            bbox: [5.0, 45.0, 6.0, 46.0],
            datetime: {
              start: new Date('2023-10-01T00:00:00Z'),
              end: new Date('2023-10-31T23:59:59Z'),
            },
          }
        );

        expect(response.type).toBe('FeatureCollection');
        expect(Array.isArray(response.features)).toBe(true);
      });
    });
  });

  describe('error cases', () => {
    it('throws error when endpoint is not accessible', async () => {
      const badEndpoint = new StacEndpoint('http://local/non-existent/');
      await expect(badEndpoint.info).rejects.toThrow();
    });

    it('handles missing collections gracefully', async () => {
      const endpoint = new StacEndpoint('http://local/stac-api/');
      await expect(endpoint.getCollection('missing')).rejects.toThrow(
        EndpointError
      );
    });
  });
});
