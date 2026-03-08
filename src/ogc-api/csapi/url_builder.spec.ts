import type { OgcApiCollectionInfo } from '../model.js';
import { EndpointError } from '../../shared/errors.js';
import CSAPIQueryBuilder from './url_builder.js';
import { CSAPIResourceTypes } from './model.js';
import {
  CSAPI_CONTENT_TYPES,
  getContentTypeForResource,
} from './formats/constants.js';

/**
 * Builds a minimal OgcApiCollectionInfo suitable for CSAPIQueryBuilder tests.
 */
function makeCollection(
  overrides: Partial<OgcApiCollectionInfo> = {}
): OgcApiCollectionInfo {
  return {
    links: [],
    title: 'Test Collection',
    description: 'A test collection',
    id: 'test-collection',
    itemFormats: [],
    bulkDownloadLinks: {},
    jsonDownloadLink: '',
    crs: [],
    itemCount: 0,
    queryables: [],
    sortables: [],
    mapTileFormats: [],
    vectorTileFormats: [],
    supportedTileMatrixSets: [],
    ...overrides,
  };
}

// ========================================
// Constructor & Resource Discovery
// ========================================

describe('CSAPIQueryBuilder constructor', () => {
  it('constructs with a valid collection', () => {
    const builder = new CSAPIQueryBuilder(makeCollection());
    expect(builder).toBeInstanceOf(CSAPIQueryBuilder);
  });

  it('populates availableResources from ogc-cs: link relations', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
        ],
      })
    );
    expect(builder.availableResources).toEqual(
      new Set(['systems', 'datastreams', 'deployments'])
    );
  });

  it('returns empty availableResources when no CSAPI links exist', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'items', type: '', title: '', href: '/items' },
        ],
      })
    );
    expect(builder.availableResources.size).toBe(0);
  });

  it('handles collection with empty links array', () => {
    const builder = new CSAPIQueryBuilder(makeCollection({ links: [] }));
    expect(builder.availableResources.size).toBe(0);
  });

  it('discovers resources from plain rel matching known resource types', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          { rel: 'self', type: '', title: '', href: 'https://example.com/api' },
          { rel: 'systems', type: '', title: '', href: '/api/systems' },
          { rel: 'datastreams', type: '', title: '', href: '/api/datastreams' },
        ],
      })
    );
    expect(builder.availableResources).toEqual(
      new Set(['systems', 'datastreams'])
    );
  });

  it('discovers resources from rel:"items" when href ends with a known resource type', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'items',
            type: '',
            title: '',
            href: '/collections/iot/systems',
          },
          {
            rel: 'items',
            type: '',
            title: '',
            href: '/collections/iot/deployments',
          },
        ],
      })
    );
    expect(builder.availableResources).toEqual(
      new Set(['systems', 'deployments'])
    );
  });

  it('discovers resources from mixed conventions in same collection', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          { rel: 'self', type: '', title: '', href: 'https://example.com/api' },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
          { rel: 'datastreams', type: '', title: '', href: '/api/datastreams' },
          {
            rel: 'items',
            type: '',
            title: '',
            href: '/collections/iot/deployments',
          },
        ],
      })
    );
    expect(builder.availableResources).toEqual(
      new Set(['systems', 'datastreams', 'deployments'])
    );
  });

  it('ignores plain rel values that are not known resource types', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          { rel: 'self', type: '', title: '', href: 'https://example.com/api' },
          { rel: 'alternate', type: '', title: '', href: '/alt' },
          { rel: 'describedby', type: '', title: '', href: '/schema' },
          { rel: 'systems', type: '', title: '', href: '/api/systems' },
        ],
      })
    );
    expect(builder.availableResources).toEqual(new Set(['systems']));
  });

  it('ignores rel:"items" when href does not end with a known resource type', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'items', type: '', title: '', href: '/collections/iot/items' },
          {
            rel: 'items',
            type: '',
            title: '',
            href: '/collections/iot/unknown',
          },
        ],
      })
    );
    expect(builder.availableResources.size).toBe(0);
  });
});

// ========================================
// Resource Validation
// ========================================

describe('Resource validation', () => {
  it('throws EndpointError when resource type is unavailable', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'sensors',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/sensors',
          },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
        ],
      })
    );

    expect(() => builder.getSystems()).toThrow(EndpointError);
  });

  it('error message includes collection ID', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'sensors',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/sensors',
          },
        ],
      })
    );

    expect(() => builder.getSystems()).toThrow(
      "Collection 'sensors' does not support 'systems' resource"
    );
  });

  it('error message lists available resources', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'iot',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
        ],
      })
    );

    expect(() => builder.getSystems()).toThrow(
      'Available resources: deployments, datastreams'
    );
  });

  it('succeeds when resource type is available', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );

    expect(() => builder.getSystems()).not.toThrow();
  });
});

// ========================================
// Top-Level (Non-Collection-Scoped) Resource URLs
// ========================================

describe('Top-level resource URLs', () => {
  function makeTopLevelBuilder() {
    const resourceUrls = new Map<string, string>([
      ['systems', 'http://server/sensorhub/api/systems'],
      ['datastreams', 'http://server/sensorhub/api/datastreams'],
    ]);
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'http://server/sensorhub/api/collections/all',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
        ],
      }),
      resourceUrls
    );
  }

  it('collection-scoped builder still produces correct URLs (no regression)', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
    expect(builder.getSystems()).toBe(
      'https://example.com/collections/iot/systems'
    );
  });

  it('uses absolute resource URL when resourceUrls map is provided', () => {
    const url = makeTopLevelBuilder().getSystems();
    expect(url).toBe('http://server/sensorhub/api/systems');
  });

  it('appends resource ID correctly with top-level URL', () => {
    const url = makeTopLevelBuilder().getSystem('sys-001');
    expect(url).toBe('http://server/sensorhub/api/systems/sys-001');
  });

  it('appends sub-path correctly with top-level URL', () => {
    const url = makeTopLevelBuilder().getSystemSubsystems('sys-001');
    expect(url).toBe('http://server/sensorhub/api/systems/sys-001/subsystems');
  });

  it('appends query parameters correctly with top-level URL', () => {
    const url = makeTopLevelBuilder().getSystems({ limit: 5, q: 'weather' });
    expect(url).toBe('http://server/sensorhub/api/systems?limit=5&q=weather');
  });

  it('encodes special characters in ID with top-level URL', () => {
    const url = makeTopLevelBuilder().getSystem('sys/001');
    expect(url).toBe('http://server/sensorhub/api/systems/sys%2F001');
  });

  it('strips trailing slash from absolute resource URL', () => {
    const resourceUrls = new Map<string, string>([
      ['systems', 'http://server/api/systems/'],
    ]);
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          { rel: 'self', type: '', title: '', href: 'http://server/api' },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      }),
      resourceUrls
    );
    expect(builder.getSystems()).toBe('http://server/api/systems');
  });
});

// ========================================
// getSystems
// ========================================

describe('getSystems', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeIotBuilder().getSystems();
    expect(url).toBe('https://example.com/collections/iot/systems');
  });

  it('returns correct URL with limit', () => {
    const url = makeIotBuilder().getSystems({ limit: 10 });
    expect(url).toBe('https://example.com/collections/iot/systems?limit=10');
  });

  it('returns correct URL with bbox', () => {
    const url = makeIotBuilder().getSystems({ bbox: [-180, -90, 180, 90] });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?bbox=-180%2C-90%2C180%2C90'
    );
  });

  it('returns correct URL with q parameter', () => {
    const url = makeIotBuilder().getSystems({ q: 'temperature' });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?q=temperature'
    );
  });

  it('returns correct URL with multiple options', () => {
    const url = makeIotBuilder().getSystems({ limit: 5, q: 'sensor' });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?limit=5&q=sensor'
    );
  });

  it('skips undefined option values', () => {
    const url = makeIotBuilder().getSystems({ limit: 10, offset: undefined });
    expect(url).toBe('https://example.com/collections/iot/systems?limit=10');
  });

  it('returns correct URL with offset', () => {
    const url = makeIotBuilder().getSystems({ offset: 25 });
    expect(url).toBe('https://example.com/collections/iot/systems?offset=25');
  });

  it('returns correct URL with datetime parameter', () => {
    const url = makeIotBuilder().getSystems({
      datetime: new Date('2024-06-01T00:00:00Z'),
    });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?datetime=2024-06-01T00%3A00%3A00.000Z'
    );
  });

  it('handles array id parameter', () => {
    const url = makeIotBuilder().getSystems({ id: ['sys-001', 'sys-002'] });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?id=sys-001%2Csys-002'
    );
  });

  it('does not double-encode special characters in array values', () => {
    const url = makeIotBuilder().getSystems({ id: ['sys 001', 'sys:002'] });
    // Spaces and colons should be encoded exactly once by URLSearchParams
    // (not double-encoded as %2520 or %253A)
    expect(url).toBe(
      'https://example.com/collections/iot/systems?id=sys+001%2Csys%3A002'
    );
  });

  // sortBy / sortOrder query parameters
  it('returns correct URL with sortBy single string', () => {
    const url = makeIotBuilder().getSystems({ sortBy: 'name' });
    expect(url).toBe('https://example.com/collections/iot/systems?sortBy=name');
  });

  it('returns correct URL with sortBy array', () => {
    const url = makeIotBuilder().getSystems({
      sortBy: ['phenomenonTime', 'resultTime'],
    });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?sortBy=phenomenonTime%2CresultTime'
    );
  });

  it('returns correct URL with sortBy combined with limit', () => {
    const url = makeIotBuilder().getSystems({ limit: 10, sortBy: 'name' });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?limit=10&sortBy=name'
    );
  });

  it('returns correct URL with sortBy combined with datetime', () => {
    const url = makeIotBuilder().getSystems({
      datetime: new Date('2024-06-01T00:00:00Z'),
      sortBy: 'name',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?datetime=2024-06-01T00%3A00%3A00.000Z&sortBy=name'
    );
  });

  it('skips sortBy when undefined', () => {
    const url = makeIotBuilder().getSystems({
      limit: 10,
      sortBy: undefined,
    });
    expect(url).toBe('https://example.com/collections/iot/systems?limit=10');
  });

  it('returns correct URL with sortOrder asc', () => {
    const url = makeIotBuilder().getSystems({ sortOrder: 'asc' });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?sortOrder=asc'
    );
  });

  it('returns correct URL with sortOrder desc', () => {
    const url = makeIotBuilder().getSystems({ sortOrder: 'desc' });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?sortOrder=desc'
    );
  });

  it('serializes sortOrder without sortBy', () => {
    const url = makeIotBuilder().getSystems({ sortOrder: 'desc' });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?sortOrder=desc'
    );
  });

  it('skips sortOrder when undefined', () => {
    const url = makeIotBuilder().getSystems({
      limit: 10,
      sortOrder: undefined,
    });
    expect(url).toBe('https://example.com/collections/iot/systems?limit=10');
  });

  it('returns correct URL with sortBy and sortOrder together', () => {
    const url = makeIotBuilder().getSystems({
      sortBy: 'phenomenonTime',
      sortOrder: 'desc',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?sortBy=phenomenonTime&sortOrder=desc'
    );
  });

  it('returns correct URL with sortBy + sortOrder + limit + q', () => {
    const url = makeIotBuilder().getSystems({
      limit: 25,
      q: 'weather',
      sortBy: 'name',
      sortOrder: 'asc',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?limit=25&q=weather&sortBy=name&sortOrder=asc'
    );
  });

  it('returns correct URL with sortBy array and sortOrder', () => {
    const url = makeIotBuilder().getSystems({
      sortBy: ['phenomenonTime', 'resultTime'],
      sortOrder: 'desc',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?sortBy=phenomenonTime%2CresultTime&sortOrder=desc'
    );
  });

  // Systems-specific query parameters
  it('returns correct URL with parent parameter', () => {
    const url = makeIotBuilder().getSystems({ parent: 'urn:parent:1' });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?parent=urn%3Aparent%3A1'
    );
  });

  it('returns correct URL with procedureId parameter', () => {
    const url = makeIotBuilder().getSystems({ procedureId: 'proc-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?procedure=proc-001'
    );
  });

  it('returns correct URL with foiId parameter', () => {
    const url = makeIotBuilder().getSystems({ foiId: 'foi-001' });
    expect(url).toBe('https://example.com/collections/iot/systems?foi=foi-001');
  });

  it('returns correct URL with observedPropertyId parameter', () => {
    const url = makeIotBuilder().getSystems({
      observedPropertyId: 'temp-prop',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?observedProperty=temp-prop'
    );
  });

  it('returns correct URL with controlledPropertyId parameter', () => {
    const url = makeIotBuilder().getSystems({
      controlledPropertyId: 'ctrl-prop',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?controlledProperty=ctrl-prop'
    );
  });

  it('returns correct URL with recursive parameter', () => {
    const url = makeIotBuilder().getSystems({ recursive: true });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?recursive=true'
    );
  });

  it('returns correct URL with cursor parameter', () => {
    const url = makeIotBuilder().getSystems({ cursor: 'abc123token' });
    expect(url).toBe(
      'https://example.com/collections/iot/systems?cursor=abc123token'
    );
  });
});

// ========================================
// getSystem
// ========================================

describe('getSystem', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL with resource ID', () => {
    const url = makeIotBuilder().getSystem('abc123');
    expect(url).toBe('https://example.com/collections/iot/systems/abc123');
  });

  it('encodes special characters in ID', () => {
    const url = makeIotBuilder().getSystem('urn:example:sensor:001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/urn%3Aexample%3Asensor%3A001'
    );
  });
});

// ========================================
// CRUD Methods
// ========================================

describe('createSystem', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL for POST target', () => {
    const url = makeIotBuilder().createSystem();
    expect(url).toBe('https://example.com/collections/iot/systems');
  });

  it('throws EndpointError when systems is unavailable', () => {
    const builder = new CSAPIQueryBuilder(makeCollection({ id: 'empty' }));
    expect(() => builder.createSystem()).toThrow(EndpointError);
  });
});

describe('updateSystem', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL for PUT target', () => {
    const url = makeIotBuilder().updateSystem('sys-001');
    expect(url).toBe('https://example.com/collections/iot/systems/sys-001');
  });

  it('encodes special characters in ID', () => {
    const url = makeIotBuilder().updateSystem('urn:example:sys:1');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/urn%3Aexample%3Asys%3A1'
    );
  });
});

describe('deleteSystem', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL for DELETE target', () => {
    const url = makeIotBuilder().deleteSystem('sys-001');
    expect(url).toBe('https://example.com/collections/iot/systems/sys-001');
  });
});

// ========================================
// History
// ========================================

describe('getSystemHistory', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeIotBuilder().getSystemHistory('sys-001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/history'
    );
  });

  it('returns correct URL with limit', () => {
    const url = makeIotBuilder().getSystemHistory('sys-001', { limit: 5 });
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/history?limit=5'
    );
  });
});

// ========================================
// Subsystems
// ========================================

describe('getSystemSubsystems', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeIotBuilder().getSystemSubsystems('sys-001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/subsystems'
    );
  });

  it('returns correct URL with recursive=true', () => {
    const url = makeIotBuilder().getSystemSubsystems('sys-001', {
      recursive: true,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/subsystems?recursive=true'
    );
  });

  it('returns correct URL with pagination and filtering', () => {
    const url = makeIotBuilder().getSystemSubsystems('sys-001', {
      limit: 10,
      q: 'temperature',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/subsystems?limit=10&q=temperature'
    );
  });
});

// ========================================
// Cross-link Navigation
// ========================================

describe('getSystemDataStreams', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL', () => {
    const url = makeIotBuilder().getSystemDataStreams('sys-001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/datastreams'
    );
  });

  it('returns correct URL with options', () => {
    const url = makeIotBuilder().getSystemDataStreams('sys-001', { limit: 20 });
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/datastreams?limit=20'
    );
  });
});

describe('getSystemControlStreams', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL', () => {
    const url = makeIotBuilder().getSystemControlStreams('sys-001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/controlstreams'
    );
  });
});

// ========================================
// Association Links
// ========================================

describe('getSystemSamplingFeatures', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL', () => {
    const url = makeIotBuilder().getSystemSamplingFeatures('sys-001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/samplingFeatures'
    );
  });
});

// ========================================
// Nested Create Methods (F-1, F-2, F-83)
// ========================================

describe('createSubsystem', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL for subsystem creation', () => {
    const url = makeIotBuilder().createSubsystem('sys-parent');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-parent/subsystems'
    );
  });

  it('encodes special characters in parent ID', () => {
    const url = makeIotBuilder().createSubsystem('urn:example:sys:001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/urn%3Aexample%3Asys%3A001/subsystems'
    );
  });
});

describe('createDataStreamForSystem', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL for nested datastream creation', () => {
    const url = makeIotBuilder().createDataStreamForSystem('sys-001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/datastreams'
    );
  });

  it('encodes special characters in system ID', () => {
    const url = makeIotBuilder().createDataStreamForSystem(
      'urn:example:sys:001'
    );
    expect(url).toBe(
      'https://example.com/collections/iot/systems/urn%3Aexample%3Asys%3A001/datastreams'
    );
  });
});

describe('createControlStreamForSystem', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL for nested control stream creation', () => {
    const url = makeIotBuilder().createControlStreamForSystem('sys-001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/controlstreams'
    );
  });

  it('encodes special characters in system ID', () => {
    const url = makeIotBuilder().createControlStreamForSystem(
      'urn:example:sys:001'
    );
    expect(url).toBe(
      'https://example.com/collections/iot/systems/urn%3Aexample%3Asys%3A001/controlstreams'
    );
  });
});

describe('createSamplingFeatureForSystem', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL for nested sampling feature creation', () => {
    const url = makeIotBuilder().createSamplingFeatureForSystem('sys-001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/samplingFeatures'
    );
  });

  it('encodes special characters in system ID', () => {
    const url = makeIotBuilder().createSamplingFeatureForSystem(
      'urn:example:sys:001'
    );
    expect(url).toBe(
      'https://example.com/collections/iot/systems/urn%3Aexample%3Asys%3A001/samplingFeatures'
    );
  });
});

describe('createSubdeployment', () => {
  function makeDepBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
        ],
      })
    );
  }

  it('returns correct URL for subdeployment creation', () => {
    const url = makeDepBuilder().createSubdeployment('dep-parent');
    expect(url).toBe(
      'https://example.com/collections/iot/deployments/dep-parent/subdeployments'
    );
  });

  it('encodes special characters in parent ID', () => {
    const url = makeDepBuilder().createSubdeployment('urn:example:dep:001');
    expect(url).toBe(
      'https://example.com/collections/iot/deployments/urn%3Aexample%3Adep%3A001/subdeployments'
    );
  });
});

describe('getSystemDeployments', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL', () => {
    const url = makeIotBuilder().getSystemDeployments('sys-001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/deployments'
    );
  });

  it('returns correct URL with options', () => {
    const url = makeIotBuilder().getSystemDeployments('sys-001', { limit: 5 });
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/deployments?limit=5'
    );
  });
});

describe('getSystemProcedures', () => {
  function makeIotBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns correct URL', () => {
    const url = makeIotBuilder().getSystemProcedures('sys-001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sys-001/procedures'
    );
  });
});

// ========================================
// Deployments Methods
// ========================================

describe('getDeployments', () => {
  function makeDepBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeDepBuilder().getDeployments();
    expect(url).toBe('https://example.com/collections/iot/deployments');
  });

  it('returns correct URL with limit and bbox', () => {
    const url = makeDepBuilder().getDeployments({
      limit: 10,
      bbox: [-180, -90, 180, 90],
    });
    expect(url).toBe(
      'https://example.com/collections/iot/deployments?limit=10&bbox=-180%2C-90%2C180%2C90'
    );
  });

  it('returns correct URL with datetime parameter', () => {
    const url = makeDepBuilder().getDeployments({
      datetime: {
        start: new Date('2025-01-01T00:00:00Z'),
        end: new Date('2025-12-31T23:59:59Z'),
      },
    });
    expect(url).toBe(
      'https://example.com/collections/iot/deployments?datetime=2025-01-01T00%3A00%3A00.000Z%2F2025-12-31T23%3A59%3A59.000Z'
    );
  });

  it('returns correct URL with systemId filter', () => {
    const url = makeDepBuilder().getDeployments({ systemId: 'sys-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/deployments?system=sys-001'
    );
  });

  it('returns correct URL with parent parameter', () => {
    const url = makeDepBuilder().getDeployments({ parent: 'dep-parent-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/deployments?parent=dep-parent-001'
    );
  });

  it('returns correct URL with recursive parameter', () => {
    const url = makeDepBuilder().getDeployments({ recursive: true });
    expect(url).toBe(
      'https://example.com/collections/iot/deployments?recursive=true'
    );
  });

  it('returns correct URL with q parameter', () => {
    const url = makeDepBuilder().getDeployments({ q: 'field' });
    expect(url).toBe('https://example.com/collections/iot/deployments?q=field');
  });

  it('returns correct URL with offset', () => {
    const url = makeDepBuilder().getDeployments({ offset: 20 });
    expect(url).toBe(
      'https://example.com/collections/iot/deployments?offset=20'
    );
  });

  it('returns correct URL with f (format) parameter', () => {
    const url = makeDepBuilder().getDeployments({ f: 'application/json' });
    expect(url).toBe(
      'https://example.com/collections/iot/deployments?f=application%2Fjson'
    );
  });
});

describe('getDeployment', () => {
  function makeDepBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
        ],
      })
    );
  }

  it('returns correct URL with resource ID', () => {
    const url = makeDepBuilder().getDeployment('dep-001');
    expect(url).toBe('https://example.com/collections/iot/deployments/dep-001');
  });

  it('encodes special characters in ID', () => {
    const url = makeDepBuilder().getDeployment('dep/001');
    expect(url).toBe(
      'https://example.com/collections/iot/deployments/dep%2F001'
    );
  });
});

describe('Deployment CRUD operations', () => {
  function makeDepBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
        ],
      })
    );
  }

  it('createDeployment returns correct URL', () => {
    const url = makeDepBuilder().createDeployment();
    expect(url).toBe('https://example.com/collections/iot/deployments');
  });

  it('updateDeployment returns correct URL', () => {
    const url = makeDepBuilder().updateDeployment('dep-001');
    expect(url).toBe('https://example.com/collections/iot/deployments/dep-001');
  });

  it('deleteDeployment returns correct URL', () => {
    const url = makeDepBuilder().deleteDeployment('dep-001');
    expect(url).toBe('https://example.com/collections/iot/deployments/dep-001');
  });
});

describe('getDeploymentSubdeployments', () => {
  function makeDepBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeDepBuilder().getDeploymentSubdeployments('dep-001');
    expect(url).toBe(
      'https://example.com/collections/iot/deployments/dep-001/subdeployments'
    );
  });

  it('returns correct URL with recursive=true', () => {
    const url = makeDepBuilder().getDeploymentSubdeployments('dep-001', {
      recursive: true,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/deployments/dep-001/subdeployments?recursive=true'
    );
  });

  it('returns correct URL with pagination and filtering', () => {
    const url = makeDepBuilder().getDeploymentSubdeployments('dep-001', {
      limit: 5,
      offset: 10,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/deployments/dep-001/subdeployments?limit=5&offset=10'
    );
  });
});

describe('Deployment association and history', () => {
  function makeDepBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
        ],
      })
    );
  }

  it('getDeploymentSystems returns correct URL (deprecated)', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const url = makeDepBuilder().getDeploymentSystems('dep-001');
    expect(url).toBe(
      'https://example.com/collections/iot/deployments/dep-001/systems'
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('getDeploymentSystems() is deprecated')
    );
    warnSpy.mockRestore();
  });

  it('getDeploymentSystems returns correct URL with options (deprecated)', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const url = makeDepBuilder().getDeploymentSystems('dep-001', { limit: 5 });
    expect(url).toBe(
      'https://example.com/collections/iot/deployments/dep-001/systems?limit=5'
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('getDeploymentSystems() is deprecated')
    );
    warnSpy.mockRestore();
  });

  it('getDeploymentHistory returns correct URL', () => {
    const url = makeDepBuilder().getDeploymentHistory('dep-001');
    expect(url).toBe(
      'https://example.com/collections/iot/deployments/dep-001/history'
    );
  });

  it('getDeploymentHistory returns correct URL with limit', () => {
    const url = makeDepBuilder().getDeploymentHistory('dep-001', { limit: 10 });
    expect(url).toBe(
      'https://example.com/collections/iot/deployments/dep-001/history?limit=10'
    );
  });
});

describe('Deployment resource validation', () => {
  it('throws EndpointError when deployments is unavailable', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'sensors',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/sensors',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
    expect(() => builder.getDeployments()).toThrow(EndpointError);
    expect(() => builder.createDeployment()).toThrow(EndpointError);
  });
});

// ========================================
// Procedures Methods
// ========================================

describe('getProcedures', () => {
  function makeProcBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:procedures',
            type: '',
            title: '',
            href: '/procedures',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeProcBuilder().getProcedures();
    expect(url).toBe('https://example.com/collections/iot/procedures');
  });

  it('returns correct URL with limit', () => {
    const url = makeProcBuilder().getProcedures({ limit: 10 });
    expect(url).toBe('https://example.com/collections/iot/procedures?limit=10');
  });

  it('returns correct URL with offset', () => {
    const url = makeProcBuilder().getProcedures({ offset: 20 });
    expect(url).toBe(
      'https://example.com/collections/iot/procedures?offset=20'
    );
  });

  it('returns correct URL with q parameter', () => {
    const url = makeProcBuilder().getProcedures({ q: 'thermometer' });
    expect(url).toBe(
      'https://example.com/collections/iot/procedures?q=thermometer'
    );
  });

  it('returns correct URL with id filter', () => {
    const url = makeProcBuilder().getProcedures({ id: 'proc-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/procedures?id=proc-001'
    );
  });

  it('returns correct URL with array id filter', () => {
    const url = makeProcBuilder().getProcedures({
      id: ['proc-001', 'proc-002'],
    });
    expect(url).toBe(
      'https://example.com/collections/iot/procedures?id=proc-001%2Cproc-002'
    );
  });

  it('returns correct URL with f (format) parameter', () => {
    const url = makeProcBuilder().getProcedures({ f: 'application/json' });
    expect(url).toBe(
      'https://example.com/collections/iot/procedures?f=application%2Fjson'
    );
  });

  it('returns correct URL with multiple options', () => {
    const url = makeProcBuilder().getProcedures({
      limit: 5,
      offset: 10,
      q: 'sensor',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/procedures?limit=5&offset=10&q=sensor'
    );
  });
});

describe('getProcedure', () => {
  function makeProcBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:procedures',
            type: '',
            title: '',
            href: '/procedures',
          },
        ],
      })
    );
  }

  it('returns correct URL with resource ID', () => {
    const url = makeProcBuilder().getProcedure('proc-001');
    expect(url).toBe('https://example.com/collections/iot/procedures/proc-001');
  });

  it('encodes special characters in ID', () => {
    const url = makeProcBuilder().getProcedure('urn:example:proc:001');
    expect(url).toBe(
      'https://example.com/collections/iot/procedures/urn%3Aexample%3Aproc%3A001'
    );
  });
});

describe('Procedure CRUD operations', () => {
  function makeProcBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:procedures',
            type: '',
            title: '',
            href: '/procedures',
          },
        ],
      })
    );
  }

  it('createProcedure returns correct URL', () => {
    const url = makeProcBuilder().createProcedure();
    expect(url).toBe('https://example.com/collections/iot/procedures');
  });

  it('updateProcedure returns correct URL', () => {
    const url = makeProcBuilder().updateProcedure('proc-001');
    expect(url).toBe('https://example.com/collections/iot/procedures/proc-001');
  });

  it('deleteProcedure returns correct URL', () => {
    const url = makeProcBuilder().deleteProcedure('proc-001');
    expect(url).toBe('https://example.com/collections/iot/procedures/proc-001');
  });
});

describe('Procedure association methods', () => {
  function makeProcBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:procedures',
            type: '',
            title: '',
            href: '/procedures',
          },
        ],
      })
    );
  }

  it('getProcedureSystems returns correct URL', () => {
    const url = makeProcBuilder().getProcedureSystems('proc-001');
    expect(url).toBe(
      'https://example.com/collections/iot/procedures/proc-001/systems'
    );
  });

  it('getProcedureSystems returns correct URL with pagination', () => {
    const url = makeProcBuilder().getProcedureSystems('proc-001', {
      limit: 5,
      offset: 10,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/procedures/proc-001/systems?limit=5&offset=10'
    );
  });

  it('getProcedureDataStreams returns correct URL', () => {
    const url = makeProcBuilder().getProcedureDataStreams('proc-001');
    expect(url).toBe(
      'https://example.com/collections/iot/procedures/proc-001/datastreams'
    );
  });

  it('getProcedureDataStreams returns correct URL with options', () => {
    const url = makeProcBuilder().getProcedureDataStreams('proc-001', {
      limit: 10,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/procedures/proc-001/datastreams?limit=10'
    );
  });
});

describe('getProcedureHistory', () => {
  function makeProcBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:procedures',
            type: '',
            title: '',
            href: '/procedures',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeProcBuilder().getProcedureHistory('proc-001');
    expect(url).toBe(
      'https://example.com/collections/iot/procedures/proc-001/history'
    );
  });

  it('returns correct URL with limit', () => {
    const url = makeProcBuilder().getProcedureHistory('proc-001', { limit: 5 });
    expect(url).toBe(
      'https://example.com/collections/iot/procedures/proc-001/history?limit=5'
    );
  });
});

describe('Procedure resource validation', () => {
  it('throws EndpointError when procedures is unavailable', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'sensors',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/sensors',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
    expect(() => builder.getProcedures()).toThrow(EndpointError);
    expect(() => builder.createProcedure()).toThrow(EndpointError);
  });
});

// ========================================
// Sampling Features Methods
// ========================================

describe('getSamplingFeatures', () => {
  function makeSfBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:samplingFeatures',
            type: '',
            title: '',
            href: '/samplingFeatures',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeSfBuilder().getSamplingFeatures();
    expect(url).toBe('https://example.com/collections/iot/samplingFeatures');
  });

  it('returns correct URL with limit', () => {
    const url = makeSfBuilder().getSamplingFeatures({ limit: 20 });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures?limit=20'
    );
  });

  it('returns correct URL with offset', () => {
    const url = makeSfBuilder().getSamplingFeatures({ offset: 10 });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures?offset=10'
    );
  });

  it('returns correct URL with q parameter', () => {
    const url = makeSfBuilder().getSamplingFeatures({ q: 'borehole' });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures?q=borehole'
    );
  });

  it('returns correct URL with id filter', () => {
    const url = makeSfBuilder().getSamplingFeatures({ id: 'sf-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures?id=sf-001'
    );
  });

  it('returns correct URL with array id filter', () => {
    const url = makeSfBuilder().getSamplingFeatures({
      id: ['sf-001', 'sf-002'],
    });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures?id=sf-001%2Csf-002'
    );
  });

  it('returns correct URL with bbox parameter', () => {
    const url = makeSfBuilder().getSamplingFeatures({
      bbox: [-120, 35, -110, 45],
    });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures?bbox=-120%2C35%2C-110%2C45'
    );
  });

  it('returns correct URL with datetime parameter', () => {
    const url = makeSfBuilder().getSamplingFeatures({
      datetime: {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-12-31T23:59:59Z'),
      },
    });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures?datetime=2024-01-01T00%3A00%3A00.000Z%2F2024-12-31T23%3A59%3A59.000Z'
    );
  });

  it('returns correct URL with f (format) parameter', () => {
    const url = makeSfBuilder().getSamplingFeatures({
      f: 'application/geo+json',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures?f=application%2Fgeo%2Bjson'
    );
  });

  it('returns correct URL with multiple options', () => {
    const url = makeSfBuilder().getSamplingFeatures({
      limit: 10,
      offset: 5,
      q: 'well',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures?limit=10&offset=5&q=well'
    );
  });
});

describe('getSamplingFeature', () => {
  function makeSfBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:samplingFeatures',
            type: '',
            title: '',
            href: '/samplingFeatures',
          },
        ],
      })
    );
  }

  it('returns correct URL with resource ID', () => {
    const url = makeSfBuilder().getSamplingFeature('sf-001');
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures/sf-001'
    );
  });

  it('encodes special characters in ID', () => {
    const url = makeSfBuilder().getSamplingFeature('urn:example:sf:001');
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures/urn%3Aexample%3Asf%3A001'
    );
  });
});

describe('SamplingFeature CRUD operations', () => {
  function makeSfBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:samplingFeatures',
            type: '',
            title: '',
            href: '/samplingFeatures',
          },
        ],
      })
    );
  }

  it('createSamplingFeature returns correct URL', () => {
    const url = makeSfBuilder().createSamplingFeature();
    expect(url).toBe('https://example.com/collections/iot/samplingFeatures');
  });

  it('updateSamplingFeature returns correct URL', () => {
    const url = makeSfBuilder().updateSamplingFeature('sf-001');
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures/sf-001'
    );
  });

  it('deleteSamplingFeature returns correct URL', () => {
    const url = makeSfBuilder().deleteSamplingFeature('sf-001');
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures/sf-001'
    );
  });
});

describe('SamplingFeature association methods', () => {
  function makeSfBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:samplingFeatures',
            type: '',
            title: '',
            href: '/samplingFeatures',
          },
        ],
      })
    );
  }

  it('getSamplingFeatureSystems returns correct URL', () => {
    const url = makeSfBuilder().getSamplingFeatureSystems('sf-001');
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures/sf-001/systems'
    );
  });

  it('getSamplingFeatureSystems returns correct URL with pagination', () => {
    const url = makeSfBuilder().getSamplingFeatureSystems('sf-001', {
      limit: 5,
      offset: 10,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures/sf-001/systems?limit=5&offset=10'
    );
  });

  it('getSamplingFeatureObservations returns correct URL', () => {
    const url = makeSfBuilder().getSamplingFeatureObservations('sf-001');
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures/sf-001/observations'
    );
  });

  it('getSamplingFeatureObservations returns correct URL with options', () => {
    const url = makeSfBuilder().getSamplingFeatureObservations('sf-001', {
      limit: 10,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures/sf-001/observations?limit=10'
    );
  });
});

describe('getSamplingFeatureHistory', () => {
  function makeSfBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:samplingFeatures',
            type: '',
            title: '',
            href: '/samplingFeatures',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeSfBuilder().getSamplingFeatureHistory('sf-001');
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures/sf-001/history'
    );
  });

  it('returns correct URL with limit', () => {
    const url = makeSfBuilder().getSamplingFeatureHistory('sf-001', {
      limit: 5,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/samplingFeatures/sf-001/history?limit=5'
    );
  });
});

describe('SamplingFeature resource validation', () => {
  it('throws EndpointError when samplingFeatures is unavailable', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'sensors',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/sensors',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
    expect(() => builder.getSamplingFeatures()).toThrow(EndpointError);
    expect(() => builder.createSamplingFeature()).toThrow(EndpointError);
  });
});

// ========================================
// Properties Methods
// ========================================

describe('getProperties', () => {
  function makePropBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:properties',
            type: '',
            title: '',
            href: '/properties',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makePropBuilder().getProperties();
    expect(url).toBe('https://example.com/collections/iot/properties');
  });

  it('returns correct URL with limit', () => {
    const url = makePropBuilder().getProperties({ limit: 20 });
    expect(url).toBe('https://example.com/collections/iot/properties?limit=20');
  });

  it('returns correct URL with q parameter', () => {
    const url = makePropBuilder().getProperties({ q: 'temperature' });
    expect(url).toBe(
      'https://example.com/collections/iot/properties?q=temperature'
    );
  });

  it('returns correct URL with id filter', () => {
    const url = makePropBuilder().getProperties({ id: 'temp-01' });
    expect(url).toBe(
      'https://example.com/collections/iot/properties?id=temp-01'
    );
  });

  it('returns correct URL with multiple options', () => {
    const url = makePropBuilder().getProperties({
      limit: 10,
      offset: 5,
      q: 'pressure',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/properties?limit=10&offset=5&q=pressure'
    );
  });

  it('returns correct URL with offset', () => {
    const url = makePropBuilder().getProperties({ offset: 20 });
    expect(url).toBe(
      'https://example.com/collections/iot/properties?offset=20'
    );
  });

  it('returns correct URL with f (format) parameter', () => {
    const url = makePropBuilder().getProperties({ f: 'application/json' });
    expect(url).toBe(
      'https://example.com/collections/iot/properties?f=application%2Fjson'
    );
  });

  it('handles array id parameter', () => {
    const url = makePropBuilder().getProperties({
      id: ['temp-01', 'pressure-02'],
    });
    expect(url).toBe(
      'https://example.com/collections/iot/properties?id=temp-01%2Cpressure-02'
    );
  });

  it('returns correct URL with system filter', () => {
    const url = makePropBuilder().getProperties({ system: 'sys-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/properties?system=sys-001'
    );
  });

  it('returns correct URL with baseProperty filter', () => {
    const url = makePropBuilder().getProperties({
      baseProperty: 'urn:qudt:Temperature',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/properties?baseProperty=urn%3Aqudt%3ATemperature'
    );
  });
});

describe('getProperty', () => {
  function makePropBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:properties',
            type: '',
            title: '',
            href: '/properties',
          },
        ],
      })
    );
  }

  it('returns correct URL with resource ID', () => {
    const url = makePropBuilder().getProperty('temperature-01');
    expect(url).toBe(
      'https://example.com/collections/iot/properties/temperature-01'
    );
  });

  it('encodes special characters in ID', () => {
    const url = makePropBuilder().getProperty('urn:qudt:Temperature');
    expect(url).toBe(
      'https://example.com/collections/iot/properties/urn%3Aqudt%3ATemperature'
    );
  });
});

describe('Property association methods', () => {
  function makePropBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:properties',
            type: '',
            title: '',
            href: '/properties',
          },
        ],
      })
    );
  }

  it('getPropertySystems returns correct URL', () => {
    const url = makePropBuilder().getPropertySystems('temperature-01');
    expect(url).toBe(
      'https://example.com/collections/iot/properties/temperature-01/systems'
    );
  });

  it('getPropertySystems returns correct URL with pagination', () => {
    const url = makePropBuilder().getPropertySystems('temperature-01', {
      limit: 5,
      offset: 10,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/properties/temperature-01/systems?limit=5&offset=10'
    );
  });

  it('getPropertyDataStreams returns correct URL', () => {
    const url = makePropBuilder().getPropertyDataStreams('temperature-01');
    expect(url).toBe(
      'https://example.com/collections/iot/properties/temperature-01/datastreams'
    );
  });

  it('getPropertyDataStreams returns correct URL with options', () => {
    const url = makePropBuilder().getPropertyDataStreams('temperature-01', {
      limit: 10,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/properties/temperature-01/datastreams?limit=10'
    );
  });

  it('getPropertyControlStreams returns correct URL', () => {
    const url =
      makePropBuilder().getPropertyControlStreams('valve-position-01');
    expect(url).toBe(
      'https://example.com/collections/iot/properties/valve-position-01/controlstreams'
    );
  });

  it('getPropertyControlStreams returns correct URL with options', () => {
    const url = makePropBuilder().getPropertyControlStreams(
      'valve-position-01',
      { limit: 10 }
    );
    expect(url).toBe(
      'https://example.com/collections/iot/properties/valve-position-01/controlstreams?limit=10'
    );
  });
});

describe('getPropertyHistory', () => {
  function makePropBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:properties',
            type: '',
            title: '',
            href: '/properties',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makePropBuilder().getPropertyHistory('temperature-01');
    expect(url).toBe(
      'https://example.com/collections/iot/properties/temperature-01/history'
    );
  });

  it('returns correct URL with limit', () => {
    const url = makePropBuilder().getPropertyHistory('temperature-01', {
      limit: 5,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/properties/temperature-01/history?limit=5'
    );
  });
});

describe('Property resource validation', () => {
  it('throws EndpointError when properties is unavailable', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'sensors',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/sensors',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
    expect(() => builder.getProperties()).toThrow(EndpointError);
  });
});

// ========================================
// DataStreams Methods
// ========================================

describe('getDataStreams', () => {
  function makeDsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeDsBuilder().getDataStreams();
    expect(url).toBe('https://example.com/collections/iot/datastreams');
  });

  it('returns correct URL with limit', () => {
    const url = makeDsBuilder().getDataStreams({ limit: 20 });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?limit=20'
    );
  });

  it('returns correct URL with systemId filter', () => {
    const url = makeDsBuilder().getDataStreams({ systemId: 'sys-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?system=sys-001'
    );
  });

  it('returns correct URL with observedPropertyId filter', () => {
    const url = makeDsBuilder().getDataStreams({
      observedPropertyId: 'temperature',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?observedProperty=temperature'
    );
  });

  it('returns correct URL with phenomenonTime temporal filter', () => {
    const url = makeDsBuilder().getDataStreams({
      phenomenonTime: {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-12-31T23:59:59Z'),
      },
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?phenomenonTime=2024-01-01T00%3A00%3A00.000Z%2F2024-12-31T23%3A59%3A59.000Z'
    );
  });

  it('returns correct URL with resultTime temporal filter', () => {
    const url = makeDsBuilder().getDataStreams({
      resultTime: new Date('2024-06-01T00:00:00Z'),
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?resultTime=2024-06-01T00%3A00%3A00.000Z'
    );
  });

  it('returns correct URL with resultTime latest keyword', () => {
    const url = makeDsBuilder().getDataStreams({ resultTime: 'latest' });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?resultTime=latest'
    );
  });

  it('returns correct URL with multiple options', () => {
    const url = makeDsBuilder().getDataStreams({
      limit: 10,
      offset: 5,
      systemId: 'sys-001',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?limit=10&offset=5&system=sys-001'
    );
  });

  it('returns correct URL with q parameter', () => {
    const url = makeDsBuilder().getDataStreams({ q: 'weather' });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?q=weather'
    );
  });

  it('returns correct URL with offset', () => {
    const url = makeDsBuilder().getDataStreams({ offset: 20 });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?offset=20'
    );
  });

  it('returns correct URL with id filter', () => {
    const url = makeDsBuilder().getDataStreams({ id: 'ds-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?id=ds-001'
    );
  });

  it('handles array id parameter', () => {
    const url = makeDsBuilder().getDataStreams({ id: ['ds-001', 'ds-002'] });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?id=ds-001%2Cds-002'
    );
  });

  it('returns correct URL with f (format) parameter', () => {
    const url = makeDsBuilder().getDataStreams({ f: 'application/json' });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?f=application%2Fjson'
    );
  });

  it('returns correct URL with foiId filter', () => {
    const url = makeDsBuilder().getDataStreams({ foiId: 'foi-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams?foi=foi-001'
    );
  });
});

describe('getDataStream', () => {
  function makeDsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
        ],
      })
    );
  }

  it('returns correct URL with resource ID', () => {
    const url = makeDsBuilder().getDataStream('ds-001');
    expect(url).toBe('https://example.com/collections/iot/datastreams/ds-001');
  });

  it('encodes special characters in ID', () => {
    const url = makeDsBuilder().getDataStream('urn:example:ds:001');
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/urn%3Aexample%3Ads%3A001'
    );
  });
});

describe('DataStream CRUD operations', () => {
  function makeDsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
        ],
      })
    );
  }

  it('createDataStream returns correct URL', () => {
    const url = makeDsBuilder().createDataStream();
    expect(url).toBe('https://example.com/collections/iot/datastreams');
  });

  it('updateDataStream returns correct URL', () => {
    const url = makeDsBuilder().updateDataStream('ds-001');
    expect(url).toBe('https://example.com/collections/iot/datastreams/ds-001');
  });

  it('deleteDataStream returns correct URL', () => {
    const url = makeDsBuilder().deleteDataStream('ds-001');
    expect(url).toBe('https://example.com/collections/iot/datastreams/ds-001');
  });
});

describe('getDataStreamSchema', () => {
  function makeDsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
        ],
      })
    );
  }

  it('returns correct URL with f query parameter', () => {
    const url = makeDsBuilder().getDataStreamSchema('ds-001', {
      f: 'application/swe+json',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/schema?f=application%2Fswe%2Bjson'
    );
  });

  it('returns correct URL without options', () => {
    const url = makeDsBuilder().getDataStreamSchema('ds-001');
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/schema'
    );
  });
});

describe('getDataStreamObservations', () => {
  function makeDsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeDsBuilder().getDataStreamObservations('ds-001');
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations'
    );
  });

  it('returns correct URL with resultTime instant', () => {
    const url = makeDsBuilder().getDataStreamObservations('ds-001', {
      resultTime: new Date('2024-06-01T00:00:00Z'),
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations?resultTime=2024-06-01T00%3A00%3A00.000Z'
    );
  });

  it('returns correct URL with resultTime latest keyword', () => {
    const url = makeDsBuilder().getDataStreamObservations('ds-001', {
      resultTime: 'latest',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations?resultTime=latest'
    );
  });

  it('returns correct URL with phenomenonTime filter', () => {
    const url = makeDsBuilder().getDataStreamObservations('ds-001', {
      phenomenonTime: {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-06-01T00:00:00Z'),
      },
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations?phenomenonTime=2024-01-01T00%3A00%3A00.000Z%2F2024-06-01T00%3A00%3A00.000Z'
    );
  });

  it('returns correct URL with cursor-based pagination', () => {
    const url = makeDsBuilder().getDataStreamObservations('ds-001', {
      cursor: 'abc123',
      limit: 50,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations?cursor=abc123&limit=50'
    );
  });

  it('returns correct URL with limit', () => {
    const url = makeDsBuilder().getDataStreamObservations('ds-001', {
      limit: 100,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations?limit=100'
    );
  });
});

describe('createObservation', () => {
  function makeDsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
        ],
      })
    );
  }

  it('returns correct URL for observation creation', () => {
    const url = makeDsBuilder().createObservation('ds-001');
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations'
    );
  });

  it('encodes special characters in datastream ID', () => {
    const url = makeDsBuilder().createObservation('urn:example:ds:001');
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/urn%3Aexample%3Ads%3A001/observations'
    );
  });
});

describe('DataStream association methods', () => {
  function makeDsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
        ],
      })
    );
  }

  it('getDataStreamSystems returns correct URL', () => {
    const url = makeDsBuilder().getDataStreamSystems('ds-001');
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/systems'
    );
  });

  it('getDataStreamSystems returns correct URL with pagination', () => {
    const url = makeDsBuilder().getDataStreamSystems('ds-001', {
      limit: 5,
      offset: 10,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/systems?limit=5&offset=10'
    );
  });

  it('getDataStreamProcedures returns correct URL', () => {
    const url = makeDsBuilder().getDataStreamProcedures('ds-001');
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/procedures'
    );
  });

  it('getDataStreamProcedures returns correct URL with options', () => {
    const url = makeDsBuilder().getDataStreamProcedures('ds-001', {
      limit: 10,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/procedures?limit=10'
    );
  });
});

describe('getDataStreamHistory', () => {
  function makeDsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeDsBuilder().getDataStreamHistory('ds-001');
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/history'
    );
  });

  it('returns correct URL with limit', () => {
    const url = makeDsBuilder().getDataStreamHistory('ds-001', { limit: 5 });
    expect(url).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/history?limit=5'
    );
  });
});

describe('DataStream resource validation', () => {
  it('throws EndpointError when datastreams is unavailable', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'sensors',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/sensors',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
    expect(() => builder.getDataStreams()).toThrow(EndpointError);
    expect(() => builder.createDataStream()).toThrow(EndpointError);
  });
});

// ── OBSERVATIONS ──

describe('getObservations', () => {
  function makeObsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:observations',
            type: '',
            title: '',
            href: '/observations',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeObsBuilder().getObservations();
    expect(url).toBe('https://example.com/collections/iot/observations');
  });

  it('returns correct URL with phenomenonTime interval', () => {
    const url = makeObsBuilder().getObservations({
      phenomenonTime: {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-06-01T00:00:00Z'),
      },
    });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?phenomenonTime=2024-01-01T00%3A00%3A00.000Z%2F2024-06-01T00%3A00%3A00.000Z'
    );
  });

  it('returns correct URL with resultTime latest', () => {
    const url = makeObsBuilder().getObservations({ resultTime: 'latest' });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?resultTime=latest'
    );
  });

  it('returns correct URL with cursor-based pagination', () => {
    const url = makeObsBuilder().getObservations({
      cursor: 'abc123',
      limit: 50,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?cursor=abc123&limit=50'
    );
  });

  it('returns correct URL with obsFormat parameter', () => {
    const url = makeObsBuilder().getObservations({ f: 'application/swe+json' });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?f=application%2Fswe%2Bjson'
    );
  });

  it('returns correct URL with offset', () => {
    const url = makeObsBuilder().getObservations({ offset: 20 });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?offset=20'
    );
  });

  it('returns correct URL with q parameter', () => {
    const url = makeObsBuilder().getObservations({ q: 'temperature' });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?q=temperature'
    );
  });

  it('returns correct URL with id filter', () => {
    const url = makeObsBuilder().getObservations({ id: 'obs-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?id=obs-001'
    );
  });

  it('handles array id parameter', () => {
    const url = makeObsBuilder().getObservations({
      id: ['obs-001', 'obs-002'],
    });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?id=obs-001%2Cobs-002'
    );
  });

  it('returns correct URL with multiple options', () => {
    const url = makeObsBuilder().getObservations({
      limit: 10,
      offset: 5,
      q: 'temperature',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?limit=10&offset=5&q=temperature'
    );
  });

  it('returns correct URL with foiId filter', () => {
    const url = makeObsBuilder().getObservations({ foiId: 'foi-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?foi=foi-001'
    );
  });

  // Cross-resource sort parameter verification
  it('returns correct URL with sortBy on observations', () => {
    const url = makeObsBuilder().getObservations({
      sortBy: 'phenomenonTime',
      sortOrder: 'desc',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?sortBy=phenomenonTime&sortOrder=desc'
    );
  });

  it('returns correct URL with sortBy array on observations', () => {
    const url = makeObsBuilder().getObservations({
      limit: 100,
      sortBy: ['phenomenonTime', 'resultTime'],
    });
    expect(url).toBe(
      'https://example.com/collections/iot/observations?limit=100&sortBy=phenomenonTime%2CresultTime'
    );
  });
});

describe('getObservation', () => {
  function makeObsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:observations',
            type: '',
            title: '',
            href: '/observations',
          },
        ],
      })
    );
  }

  it('returns correct URL for single observation', () => {
    const url = makeObsBuilder().getObservation('obs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/observations/obs-001'
    );
  });

  it('returns correct URL with format option', () => {
    const url = makeObsBuilder().getObservation('obs-001', {
      f: 'application/json',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/observations/obs-001?f=application%2Fjson'
    );
  });
});

describe('Observation CRUD methods', () => {
  function makeObsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:observations',
            type: '',
            title: '',
            href: '/observations',
          },
        ],
      })
    );
  }

  it('updateObservation returns correct URL', () => {
    const url = makeObsBuilder().updateObservation('obs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/observations/obs-001'
    );
  });

  it('deleteObservation returns correct URL', () => {
    const url = makeObsBuilder().deleteObservation('obs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/observations/obs-001'
    );
  });
});

describe('Observation association methods', () => {
  function makeObsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:observations',
            type: '',
            title: '',
            href: '/observations',
          },
        ],
      })
    );
  }

  it('getObservationDatastream returns correct URL', () => {
    const url = makeObsBuilder().getObservationDatastream('obs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/observations/obs-001/datastream'
    );
  });

  it('getObservationSamplingFeature returns correct URL', () => {
    const url = makeObsBuilder().getObservationSamplingFeature('obs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/observations/obs-001/samplingFeature'
    );
  });

  it('getObservationSamplingFeature returns correct URL with options', () => {
    const url = makeObsBuilder().getObservationSamplingFeature('obs-001', {
      f: 'application/json',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/observations/obs-001/samplingFeature?f=application%2Fjson'
    );
  });

  it('getObservationSystem returns correct URL', () => {
    const url = makeObsBuilder().getObservationSystem('obs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/observations/obs-001/system'
    );
  });

  it('getObservationSystem returns correct URL with options', () => {
    const url = makeObsBuilder().getObservationSystem('obs-001', { limit: 1 });
    expect(url).toBe(
      'https://example.com/collections/iot/observations/obs-001/system?limit=1'
    );
  });
});

describe('getObservationHistory', () => {
  function makeObsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:observations',
            type: '',
            title: '',
            href: '/observations',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeObsBuilder().getObservationHistory('obs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/observations/obs-001/history'
    );
  });

  it('returns correct URL with limit', () => {
    const url = makeObsBuilder().getObservationHistory('obs-001', { limit: 5 });
    expect(url).toBe(
      'https://example.com/collections/iot/observations/obs-001/history?limit=5'
    );
  });
});

describe('Observation resource validation', () => {
  it('throws EndpointError when observations is unavailable', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'sensors',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/sensors',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
    expect(() => builder.getObservations()).toThrow(EndpointError);
  });
});

describe('Observation nested path support (datastreamId)', () => {
  function makeNestedObsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
        ],
      })
    );
  }

  it('getObservation builds nested path when datastreamId is provided', () => {
    const builder = makeNestedObsBuilder();
    expect(builder.getObservation('obs-001', undefined, 'ds-001')).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations/obs-001'
    );
  });

  it('updateObservation builds nested path when datastreamId is provided', () => {
    const builder = makeNestedObsBuilder();
    expect(builder.updateObservation('obs-001', 'ds-001')).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations/obs-001'
    );
  });

  it('deleteObservation builds nested path when datastreamId is provided', () => {
    const builder = makeNestedObsBuilder();
    expect(builder.deleteObservation('obs-001', 'ds-001')).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations/obs-001'
    );
  });

  it('getObservationDatastream builds nested path when datastreamId is provided', () => {
    const builder = makeNestedObsBuilder();
    expect(builder.getObservationDatastream('obs-001', 'ds-001')).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations/obs-001/datastream'
    );
  });

  it('getObservationSamplingFeature builds nested path when datastreamId is provided', () => {
    const builder = makeNestedObsBuilder();
    expect(
      builder.getObservationSamplingFeature('obs-001', undefined, 'ds-001')
    ).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations/obs-001/samplingFeature'
    );
  });

  it('getObservationSystem builds nested path when datastreamId is provided', () => {
    const builder = makeNestedObsBuilder();
    expect(builder.getObservationSystem('obs-001', undefined, 'ds-001')).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations/obs-001/system'
    );
  });

  it('getObservationHistory builds nested path when datastreamId is provided', () => {
    const builder = makeNestedObsBuilder();
    expect(
      builder.getObservationHistory('obs-001', { limit: 5 }, 'ds-001')
    ).toBe(
      'https://example.com/collections/iot/datastreams/ds-001/observations/obs-001/history?limit=5'
    );
  });

  it('falls back to top-level path when datastreamId is omitted', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:observations',
            type: '',
            title: '',
            href: '/observations',
          },
        ],
      })
    );
    expect(builder.getObservation('obs-001')).toBe(
      'https://example.com/collections/iot/observations/obs-001'
    );
  });
});

// ── CONTROL STREAMS ──

describe('getControlStreams', () => {
  function makeCsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:controlStreams',
            type: '',
            title: '',
            href: '/controlstreams',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeCsBuilder().getControlStreams();
    expect(url).toBe('https://example.com/collections/iot/controlstreams');
  });

  it('returns correct URL with systemId filter', () => {
    const url = makeCsBuilder().getControlStreams({ systemId: 'sys-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams?system=sys-001'
    );
  });

  it('returns correct URL with controlledPropertyId filter', () => {
    const url = makeCsBuilder().getControlStreams({
      controlledPropertyId: 'prop-001',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams?controlledProperty=prop-001'
    );
  });

  it('returns correct URL with pagination', () => {
    const url = makeCsBuilder().getControlStreams({ limit: 10, offset: 20 });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams?limit=10&offset=20'
    );
  });

  it('returns correct URL with standalone offset', () => {
    const url = makeCsBuilder().getControlStreams({ offset: 20 });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams?offset=20'
    );
  });

  it('returns correct URL with q parameter', () => {
    const url = makeCsBuilder().getControlStreams({ q: 'valve' });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams?q=valve'
    );
  });

  it('returns correct URL with single id', () => {
    const url = makeCsBuilder().getControlStreams({ id: 'cs-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams?id=cs-001'
    );
  });

  it('returns correct URL with array of ids', () => {
    const url = makeCsBuilder().getControlStreams({ id: ['cs-001', 'cs-002'] });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams?id=cs-001%2Ccs-002'
    );
  });

  it('returns correct URL with multiple shared options', () => {
    const url = makeCsBuilder().getControlStreams({
      limit: 10,
      offset: 5,
      q: 'valve',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams?limit=10&offset=5&q=valve'
    );
  });

  it('returns correct URL with issueTime temporal filter', () => {
    const url = makeCsBuilder().getControlStreams({
      issueTime: {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-12-31T23:59:59Z'),
      },
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams?issueTime=2024-01-01T00%3A00%3A00.000Z%2F2024-12-31T23%3A59%3A59.000Z'
    );
  });

  it('returns correct URL with executionTime temporal filter', () => {
    const url = makeCsBuilder().getControlStreams({
      executionTime: new Date('2024-06-01T00:00:00Z'),
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams?executionTime=2024-06-01T00%3A00%3A00.000Z'
    );
  });

  it('returns correct URL with foiId filter', () => {
    const url = makeCsBuilder().getControlStreams({ foiId: 'foi-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams?foi=foi-001'
    );
  });
});

describe('getControlStream', () => {
  function makeCsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:controlStreams',
            type: '',
            title: '',
            href: '/controlstreams',
          },
        ],
      })
    );
  }

  it('returns correct URL for single control stream', () => {
    const url = makeCsBuilder().getControlStream('cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001'
    );
  });

  it('returns correct URL with format option', () => {
    const url = makeCsBuilder().getControlStream('cs-001', {
      f: 'application/json',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001?f=application%2Fjson'
    );
  });
});

describe('ControlStream CRUD methods', () => {
  function makeCsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:controlStreams',
            type: '',
            title: '',
            href: '/controlstreams',
          },
        ],
      })
    );
  }

  it('createControlStream returns correct URL', () => {
    const url = makeCsBuilder().createControlStream();
    expect(url).toBe('https://example.com/collections/iot/controlstreams');
  });

  it('updateControlStream returns correct URL', () => {
    const url = makeCsBuilder().updateControlStream('cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001'
    );
  });

  it('deleteControlStream returns correct URL', () => {
    const url = makeCsBuilder().deleteControlStream('cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001'
    );
  });
});

describe('getControlStreamSchema', () => {
  function makeCsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:controlStreams',
            type: '',
            title: '',
            href: '/controlstreams',
          },
        ],
      })
    );
  }

  it('returns correct URL with f query parameter', () => {
    const url = makeCsBuilder().getControlStreamSchema('cs-001', {
      f: 'application/swe+json',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/schema?f=application%2Fswe%2Bjson'
    );
  });

  it('returns correct URL with no options', () => {
    const url = makeCsBuilder().getControlStreamSchema('cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/schema'
    );
  });
});

describe('getControlStreamCommands', () => {
  function makeCsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:controlStreams',
            type: '',
            title: '',
            href: '/controlstreams',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeCsBuilder().getControlStreamCommands('cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands'
    );
  });

  it('returns correct URL with pagination', () => {
    const url = makeCsBuilder().getControlStreamCommands('cs-001', {
      limit: 50,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands?limit=50'
    );
  });

  it('returns correct URL with issueTime filter', () => {
    const url = makeCsBuilder().getControlStreamCommands('cs-001', {
      issueTime: { start: new Date('2024-01-01T00:00:00Z') },
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands?issueTime=2024-01-01T00%3A00%3A00.000Z%2F..'
    );
  });

  it('returns correct URL with executionTime filter', () => {
    const url = makeCsBuilder().getControlStreamCommands('cs-001', {
      executionTime: {
        start: new Date('2024-06-01T00:00:00Z'),
        end: new Date('2024-12-01T00:00:00Z'),
      },
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands?executionTime=2024-06-01T00%3A00%3A00.000Z%2F2024-12-01T00%3A00%3A00.000Z'
    );
  });
});

describe('checkCommandFeasibility', () => {
  function makeCsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:controlStreams',
            type: '',
            title: '',
            href: '/controlstreams',
          },
        ],
      })
    );
  }

  it('returns correct URL for feasibility checking', () => {
    const url = makeCsBuilder().checkCommandFeasibility('cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/feasibility'
    );
  });

  it('encodes special characters in control stream ID', () => {
    const url = makeCsBuilder().checkCommandFeasibility('urn:example:cs:001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/urn%3Aexample%3Acs%3A001/feasibility'
    );
  });
});

describe('getControlStreamSystems', () => {
  function makeCsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:controlStreams',
            type: '',
            title: '',
            href: '/controlstreams',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeCsBuilder().getControlStreamSystems('cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/systems'
    );
  });

  it('returns correct URL with pagination', () => {
    const url = makeCsBuilder().getControlStreamSystems('cs-001', {
      limit: 5,
      offset: 10,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/systems?limit=5&offset=10'
    );
  });
});

describe('getControlStreamProcedures', () => {
  function makeCsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:controlStreams',
            type: '',
            title: '',
            href: '/controlstreams',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeCsBuilder().getControlStreamProcedures('cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/procedures'
    );
  });

  it('returns correct URL with options', () => {
    const url = makeCsBuilder().getControlStreamProcedures('cs-001', {
      limit: 10,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/procedures?limit=10'
    );
  });
});

describe('getControlStreamHistory', () => {
  function makeCsBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:controlStreams',
            type: '',
            title: '',
            href: '/controlstreams',
          },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeCsBuilder().getControlStreamHistory('cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/history'
    );
  });

  it('returns correct URL with limit', () => {
    const url = makeCsBuilder().getControlStreamHistory('cs-001', { limit: 5 });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/history?limit=5'
    );
  });
});

describe('ControlStream resource validation', () => {
  it('throws EndpointError when controlStreams is unavailable', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'sensors',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/sensors',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
    expect(() => builder.getControlStreams()).toThrow(EndpointError);
    expect(() => builder.createControlStream()).toThrow(EndpointError);
  });
});

// ── COMMANDS ──

describe('getCommands', () => {
  function makeCmdBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:commands', type: '', title: '', href: '/commands' },
        ],
      })
    );
  }

  it('returns correct URL with no options', () => {
    const url = makeCmdBuilder().getCommands();
    expect(url).toBe('https://example.com/collections/iot/commands');
  });

  it('returns correct URL with issueTime interval', () => {
    const url = makeCmdBuilder().getCommands({
      issueTime: {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-06-01T00:00:00Z'),
      },
    });
    expect(url).toBe(
      'https://example.com/collections/iot/commands?issueTime=2024-01-01T00%3A00%3A00.000Z%2F2024-06-01T00%3A00%3A00.000Z'
    );
  });

  it('returns correct URL with executionTime open-end interval', () => {
    const url = makeCmdBuilder().getCommands({
      executionTime: { start: new Date('2024-03-01T00:00:00Z') },
    });
    expect(url).toBe(
      'https://example.com/collections/iot/commands?executionTime=2024-03-01T00%3A00%3A00.000Z%2F..'
    );
  });

  it('returns correct URL with cursor-based pagination', () => {
    const url = makeCmdBuilder().getCommands({
      cursor: 'next-page-token',
      limit: 50,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/commands?cursor=next-page-token&limit=50'
    );
  });

  it('returns correct URL with currentStatus filter', () => {
    const url = makeCmdBuilder().getCommands({ currentStatus: 'EXECUTING' });
    expect(url).toBe(
      'https://example.com/collections/iot/commands?statusCode=EXECUTING'
    );
  });

  it('returns correct URL with f parameter', () => {
    const url = makeCmdBuilder().getCommands({ f: 'application/swe+json' });
    expect(url).toBe(
      'https://example.com/collections/iot/commands?f=application%2Fswe%2Bjson'
    );
  });

  it('returns correct URL with id filter', () => {
    const url = makeCmdBuilder().getCommands({ id: 'cmd-001' });
    expect(url).toBe('https://example.com/collections/iot/commands?id=cmd-001');
  });

  it('handles array id parameter', () => {
    const url = makeCmdBuilder().getCommands({ id: ['cmd-001', 'cmd-002'] });
    expect(url).toBe(
      'https://example.com/collections/iot/commands?id=cmd-001%2Ccmd-002'
    );
  });

  it('returns correct URL with offset', () => {
    const url = makeCmdBuilder().getCommands({ offset: 20 });
    expect(url).toBe('https://example.com/collections/iot/commands?offset=20');
  });

  it('returns correct URL with multiple options', () => {
    const url = makeCmdBuilder().getCommands({
      limit: 10,
      currentStatus: 'PENDING',
      cursor: 'abc',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/commands?limit=10&statusCode=PENDING&cursor=abc'
    );
  });

  it('returns correct URL with multiple options including offset', () => {
    const url = makeCmdBuilder().getCommands({
      limit: 10,
      offset: 5,
      currentStatus: 'PENDING',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/commands?limit=10&offset=5&statusCode=PENDING'
    );
  });

  it('returns correct URL with sender filter', () => {
    const url = makeCmdBuilder().getCommands({ sender: 'user-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/commands?sender=user-001'
    );
  });

  it('returns correct URL with foiId filter', () => {
    const url = makeCmdBuilder().getCommands({ foiId: 'foi-001' });
    expect(url).toBe(
      'https://example.com/collections/iot/commands?foi=foi-001'
    );
  });
});

describe('getCommand', () => {
  function makeCmdBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:commands', type: '', title: '', href: '/commands' },
        ],
      })
    );
  }

  it('returns correct URL for single command', () => {
    const url = makeCmdBuilder().getCommand('cmd-001');
    expect(url).toBe('https://example.com/collections/iot/commands/cmd-001');
  });

  it('returns correct URL with format option', () => {
    const url = makeCmdBuilder().getCommand('cmd-001', {
      f: 'application/json',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/commands/cmd-001?f=application%2Fjson'
    );
  });
});

describe('Command CRUD methods', () => {
  function makeCmdBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:commands', type: '', title: '', href: '/commands' },
          {
            rel: 'ogc-cs:controlStreams',
            type: '',
            title: '',
            href: '/controlstreams',
          },
        ],
      })
    );
  }

  it('createCommand returns correct URL via control stream', () => {
    const url = makeCmdBuilder().createCommand('cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands'
    );
  });

  it('createCommands returns correct URL for bulk creation', () => {
    const url = makeCmdBuilder().createCommands('cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands'
    );
  });

  it('updateCommand returns correct URL', () => {
    const url = makeCmdBuilder().updateCommand('cmd-001');
    expect(url).toBe('https://example.com/collections/iot/commands/cmd-001');
  });

  it('deleteCommand returns correct URL', () => {
    const url = makeCmdBuilder().deleteCommand('cmd-001');
    expect(url).toBe('https://example.com/collections/iot/commands/cmd-001');
  });
});

describe('Command status and result methods', () => {
  function makeCmdBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:commands', type: '', title: '', href: '/commands' },
        ],
      })
    );
  }

  it('getCommandStatus returns correct URL', () => {
    const url = makeCmdBuilder().getCommandStatus('cmd-001');
    expect(url).toBe(
      'https://example.com/collections/iot/commands/cmd-001/status'
    );
  });

  it('getCommandStatus returns correct URL with statusCode filter', () => {
    const url = makeCmdBuilder().getCommandStatus('cmd-001', {
      statusCode: 'EXECUTING',
    });
    expect(url).toBe(
      'https://example.com/collections/iot/commands/cmd-001/status?statusCode=EXECUTING'
    );
  });

  it('getCommandStatus returns correct URL with limit option', () => {
    const url = makeCmdBuilder().getCommandStatus('cmd-001', { limit: 10 });
    expect(url).toBe(
      'https://example.com/collections/iot/commands/cmd-001/status?limit=10'
    );
  });

  it('getCommandStatus returns correct URL with statusCode + limit options', () => {
    const url = makeCmdBuilder().getCommandStatus('cmd-001', {
      statusCode: 'EXECUTING',
      limit: 5,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/commands/cmd-001/status?statusCode=EXECUTING&limit=5'
    );
  });

  it('updateCommandStatus returns correct URL', () => {
    const url = makeCmdBuilder().updateCommandStatus('cmd-001');
    expect(url).toBe(
      'https://example.com/collections/iot/commands/cmd-001/status'
    );
  });

  it('getCommandResult returns correct URL', () => {
    const url = makeCmdBuilder().getCommandResult('cmd-001');
    expect(url).toBe(
      'https://example.com/collections/iot/commands/cmd-001/result'
    );
  });
});

describe('cancelCommand', () => {
  function makeCmdBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:commands', type: '', title: '', href: '/commands' },
        ],
      })
    );
  }

  it('returns correct URL for command cancellation', () => {
    const url = makeCmdBuilder().cancelCommand('cmd-001');
    expect(url).toBe(
      'https://example.com/collections/iot/commands/cmd-001/cancel'
    );
  });

  it('encodes special characters in command ID', () => {
    const url = makeCmdBuilder().cancelCommand('urn:example:cmd:001');
    expect(url).toBe(
      'https://example.com/collections/iot/commands/urn%3Aexample%3Acmd%3A001/cancel'
    );
  });
});

describe('Command resource validation', () => {
  it('throws EndpointError when commands is unavailable', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'sensors',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/sensors',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
    expect(() => builder.getCommands()).toThrow(EndpointError);
  });
});

describe('Command nested path support (controlStreamId)', () => {
  function makeNestedCmdBuilder() {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:controlStreams',
            type: '',
            title: '',
            href: '/controlstreams',
          },
        ],
      })
    );
  }

  it('getCommand builds nested path when controlStreamId is provided', () => {
    const builder = makeNestedCmdBuilder();
    expect(builder.getCommand('cmd-001', undefined, 'cs-001')).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001'
    );
  });

  it('updateCommand builds nested path when controlStreamId is provided', () => {
    const builder = makeNestedCmdBuilder();
    expect(builder.updateCommand('cmd-001', 'cs-001')).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001'
    );
  });

  it('deleteCommand builds nested path when controlStreamId is provided', () => {
    const builder = makeNestedCmdBuilder();
    expect(builder.deleteCommand('cmd-001', 'cs-001')).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001'
    );
  });

  it('getCommandStatus builds nested path when controlStreamId is provided', () => {
    const builder = makeNestedCmdBuilder();
    expect(builder.getCommandStatus('cmd-001', undefined, 'cs-001')).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001/status'
    );
  });

  it('getCommandStatus with options builds nested path with query string', () => {
    const builder = makeNestedCmdBuilder();
    expect(
      builder.getCommandStatus(
        'cmd-001',
        { statusCode: 'EXECUTING' } as any,
        'cs-001'
      )
    ).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001/status?statusCode=EXECUTING'
    );
  });

  it('updateCommandStatus builds nested path when controlStreamId is provided', () => {
    const builder = makeNestedCmdBuilder();
    expect(builder.updateCommandStatus('cmd-001', 'cs-001')).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001/status'
    );
  });

  it('getCommandResult builds nested path when controlStreamId is provided', () => {
    const builder = makeNestedCmdBuilder();
    expect(builder.getCommandResult('cmd-001', 'cs-001')).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001/result'
    );
  });

  it('cancelCommand builds nested path when controlStreamId is provided', () => {
    const builder = makeNestedCmdBuilder();
    expect(builder.cancelCommand('cmd-001', 'cs-001')).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001/cancel'
    );
  });

  it('falls back to top-level path when controlStreamId is omitted', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          {
            rel: 'ogc-cs:commands',
            type: '',
            title: '',
            href: '/commands',
          },
        ],
      })
    );
    expect(builder.getCommand('cmd-001')).toBe(
      'https://example.com/collections/iot/commands/cmd-001'
    );
  });
});

// ========================================
// Edge Case Tests — Issue #33
// ========================================

// ----------------------------------------
// extractBaseUrl edge cases
// ----------------------------------------

describe('extractBaseUrl edge cases', () => {
  it('falls back to first link href when no self link exists', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'ogc-cs:systems',
            type: '',
            title: '',
            href: 'https://fallback.example.com/systems',
          },
        ],
      })
    );
    // baseUrl should be derived from the first link's href
    const url = builder.getSystems();
    expect(url).toContain('fallback.example.com');
  });

  it('returns empty baseUrl when collection has no links', () => {
    const builder = new CSAPIQueryBuilder(makeCollection({ links: [] }));
    // With no links, availableResources is empty, so resource calls throw
    expect(builder.availableResources.size).toBe(0);
  });

  it('strips trailing slash from self link href', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot/',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
    const url = builder.getSystems();
    expect(url).toBe('https://example.com/collections/iot/systems');
  });

  it('strips trailing slash from fallback link href', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'ogc-cs:systems',
            type: '',
            title: '',
            href: 'https://example.com/api/',
          },
        ],
      })
    );
    // baseUrl should use first href, trailing slash stripped
    const url = builder.getSystems();
    expect(url).toContain('example.com/api');
    expect(url).not.toContain('api//');
  });
});

// ----------------------------------------
// buildQueryString edge cases
// ----------------------------------------

describe('buildQueryString edge cases', () => {
  function makeBuilder(): CSAPIQueryBuilder {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('returns URL without query string when options is undefined', () => {
    const url = makeBuilder().getSystems();
    expect(url).toBe('https://example.com/collections/iot/systems');
  });

  it('returns URL without query string when options is empty object', () => {
    const url = makeBuilder().getSystems({});
    expect(url).toBe('https://example.com/collections/iot/systems');
  });

  it('skips null values in options', () => {
    const url = makeBuilder().getSystems({
      limit: 10,
      q: null as unknown as string,
    });
    expect(url).toBe('https://example.com/collections/iot/systems?limit=10');
  });

  it('skips undefined values in options', () => {
    const url = makeBuilder().getSystems({ limit: 10, offset: undefined });
    expect(url).toBe('https://example.com/collections/iot/systems?limit=10');
  });

  it('serializes boolean values as strings', () => {
    const url = makeBuilder().getSystems({ recursive: true } as any);
    expect(url).toBe(
      'https://example.com/collections/iot/systems?recursive=true'
    );
  });

  it('serializes numeric values as strings', () => {
    const url = makeBuilder().getSystems({ offset: 0 } as any);
    expect(url).toBe('https://example.com/collections/iot/systems?offset=0');
  });

  it('serializes array values as comma-separated', () => {
    const url = makeBuilder().getSystems({ id: ['a', 'b', 'c'] } as any);
    expect(url).toBe(
      'https://example.com/collections/iot/systems?id=a%2Cb%2Cc'
    );
  });

  it('serializes format (f) parameter correctly', () => {
    const url = makeBuilder().getSystems({ f: 'application/json' } as any);
    expect(url).toBe(
      'https://example.com/collections/iot/systems?f=application%2Fjson'
    );
  });
});

// ----------------------------------------
// Limit validation through builder
// ----------------------------------------

describe('Limit validation through builder', () => {
  function makeBuilder(): CSAPIQueryBuilder {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('accepts limit of 1', () => {
    expect(() => makeBuilder().getSystems({ limit: 1 })).not.toThrow();
  });

  it('rejects limit of 0', () => {
    expect(() => makeBuilder().getSystems({ limit: 0 })).toThrow(
      'positive integer'
    );
  });

  it('rejects negative limit', () => {
    expect(() => makeBuilder().getSystems({ limit: -1 })).toThrow(
      'positive integer'
    );
  });

  it('rejects fractional limit', () => {
    expect(() => makeBuilder().getSystems({ limit: 1.5 })).toThrow(
      'positive integer'
    );
  });

  it('rejects NaN limit', () => {
    expect(() => makeBuilder().getSystems({ limit: NaN })).toThrow(
      'positive integer'
    );
  });

  it('rejects Infinity limit', () => {
    expect(() => makeBuilder().getSystems({ limit: Infinity })).toThrow(
      'positive integer'
    );
  });
});

// ----------------------------------------
// Bbox validation through builder
// ----------------------------------------

describe('Bbox validation through builder', () => {
  function makeBuilder(): CSAPIQueryBuilder {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('accepts valid 4-element bbox', () => {
    expect(() =>
      makeBuilder().getSystems({ bbox: [-10, -10, 10, 10] })
    ).not.toThrow();
  });

  it('rejects 3-element bbox', () => {
    expect(() => makeBuilder().getSystems({ bbox: [0, 0, 10] as any })).toThrow(
      '4 coordinates'
    );
  });

  it('rejects 5-element bbox', () => {
    expect(() =>
      makeBuilder().getSystems({ bbox: [0, 0, 10, 10, 0] as any })
    ).toThrow('4 coordinates');
  });

  it('rejects bbox with Infinity', () => {
    expect(() =>
      makeBuilder().getSystems({ bbox: [0, 0, Infinity, 10] as any })
    ).toThrow('finite numbers');
  });

  it('rejects bbox with NaN', () => {
    expect(() =>
      makeBuilder().getSystems({ bbox: [NaN, 0, 10, 10] as any })
    ).toThrow('finite numbers');
  });

  it('rejects inverted minx > maxx', () => {
    expect(() => makeBuilder().getSystems({ bbox: [20, 0, 10, 10] })).toThrow(
      'minx'
    );
  });

  it('rejects inverted miny > maxy', () => {
    expect(() => makeBuilder().getSystems({ bbox: [0, 20, 10, 10] })).toThrow(
      'miny'
    );
  });
});

// ----------------------------------------
// Temporal parameter edge cases through builder
// ----------------------------------------

describe('Temporal parameter edge cases through builder', () => {
  function makeBuilder(): CSAPIQueryBuilder {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
          {
            rel: 'ogc-cs:datastreams',
            type: '',
            title: '',
            href: '/datastreams',
          },
          {
            rel: 'ogc-cs:observations',
            type: '',
            title: '',
            href: '/observations',
          },
        ],
      })
    );
  }

  it('serializes end-only datetime interval', () => {
    const url = makeBuilder().getSystems({
      datetime: { end: new Date('2025-06-01T00:00:00Z') },
    });
    expect(url).toContain('datetime=..%2F2025-06-01T00%3A00%3A00.000Z');
  });

  it('serializes start-only datetime interval', () => {
    const url = makeBuilder().getSystems({
      datetime: { start: new Date('2024-01-01T00:00:00Z') },
    });
    expect(url).toContain('datetime=2024-01-01T00%3A00%3A00.000Z%2F..');
  });

  it('serializes phenomenonTime temporal parameter', () => {
    const url = makeBuilder().getObservations({
      phenomenonTime: new Date('2024-03-15T12:00:00Z'),
    } as any);
    expect(url).toContain('phenomenonTime=2024-03-15T12%3A00%3A00.000Z');
  });

  it('serializes resultTime temporal parameter', () => {
    const url = makeBuilder().getObservations({
      resultTime: new Date('2024-03-15T12:00:00Z'),
    } as any);
    expect(url).toContain('resultTime=2024-03-15T12%3A00%3A00.000Z');
  });

  it('handles latest keyword for resultTime', () => {
    const url = makeBuilder().getObservations({
      resultTime: 'latest',
    } as any);
    expect(url).toContain('resultTime=latest');
  });

  it('serializes epoch date correctly', () => {
    const url = makeBuilder().getSystems({
      datetime: new Date('1970-01-01T00:00:00Z'),
    });
    expect(url).toContain('datetime=1970-01-01T00%3A00%3A00.000Z');
  });

  it('serializes combined datetime interval', () => {
    const url = makeBuilder().getSystems({
      datetime: {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-12-31T23:59:59Z'),
      },
    });
    expect(url).toContain(
      'datetime=2024-01-01T00%3A00%3A00.000Z%2F2024-12-31T23%3A59%3A59.000Z'
    );
  });
});

// ----------------------------------------
// Pagination edge cases
// ----------------------------------------

describe('Pagination edge cases', () => {
  function makeBuilder(): CSAPIQueryBuilder {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
        ],
      })
    );
  }

  it('serializes offset of 0', () => {
    const url = makeBuilder().getSystems({ offset: 0 } as any);
    expect(url).toBe('https://example.com/collections/iot/systems?offset=0');
  });

  it('serializes combined limit and offset', () => {
    const url = makeBuilder().getSystems({ limit: 50, offset: 100 } as any);
    expect(url).toBe(
      'https://example.com/collections/iot/systems?limit=50&offset=100'
    );
  });

  it('serializes large limit value', () => {
    const url = makeBuilder().getSystems({ limit: 10000 });
    expect(url).toBe('https://example.com/collections/iot/systems?limit=10000');
  });

  it('serializes large offset value', () => {
    const url = makeBuilder().getSystems({ offset: 999999 } as any);
    expect(url).toBe(
      'https://example.com/collections/iot/systems?offset=999999'
    );
  });
});

// ----------------------------------------
// Combined query parameter scenarios
// ----------------------------------------

describe('Combined query parameter scenarios', () => {
  function makeBuilder(): CSAPIQueryBuilder {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
        ],
      })
    );
  }

  it('serializes limit + bbox + datetime together', () => {
    const url = makeBuilder().getSystems({
      limit: 25,
      bbox: [-10, -10, 10, 10],
      datetime: new Date('2025-01-01T00:00:00Z'),
    });
    expect(url).toContain('limit=25');
    expect(url).toContain('bbox=-10%2C-10%2C10%2C10');
    expect(url).toContain('datetime=2025-01-01T00%3A00%3A00.000Z');
  });

  it('serializes limit + offset + q together', () => {
    const url = makeBuilder().getSystems({
      limit: 10,
      offset: 20,
      q: 'weather',
    } as any);
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=20');
    expect(url).toContain('q=weather');
  });

  it('serializes limit + bbox + datetime on deployments', () => {
    const url = makeBuilder().getDeployments({
      limit: 5,
      bbox: [-180, -90, 180, 90],
      datetime: {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2025-01-01T00:00:00Z'),
      },
    });
    expect(url).toContain('limit=5');
    expect(url).toContain('bbox=-180%2C-90%2C180%2C90');
    expect(url).toContain(
      'datetime=2024-01-01T00%3A00%3A00.000Z%2F2025-01-01T00%3A00%3A00.000Z'
    );
  });
});

// ----------------------------------------
// ID encoding edge cases
// ----------------------------------------

describe('ID encoding edge cases', () => {
  function makeBuilder(): CSAPIQueryBuilder {
    return new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      })
    );
  }

  it('encodes URN-style IDs', () => {
    const url = makeBuilder().getSystem('urn:ogc:object:sensor:001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/urn%3Aogc%3Aobject%3Asensor%3A001'
    );
  });

  it('encodes IDs with spaces', () => {
    const url = makeBuilder().getSystem('sensor 001');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sensor%20001'
    );
  });

  it('encodes IDs with slashes', () => {
    const url = makeBuilder().getSystem('path/to/resource');
    expect(url).toBe(
      'https://example.com/collections/iot/systems/path%2Fto%2Fresource'
    );
  });

  it('encodes unicode characters in IDs', () => {
    const url = makeBuilder().getSystem('sensor-ñ-日本');
    expect(url).toContain('systems/');
    expect(url).toBe(
      `https://example.com/collections/iot/systems/${encodeURIComponent(
        'sensor-ñ-日本'
      )}`
    );
  });

  it('handles already-encoded IDs (double-encodes)', () => {
    const url = makeBuilder().getSystem('sensor%20001');
    // encodeURIComponent will encode the % sign
    expect(url).toBe(
      'https://example.com/collections/iot/systems/sensor%2520001'
    );
  });
});

// ----------------------------------------
// assertResourceAvailable error message format
// ----------------------------------------

describe('assertResourceAvailable error messages', () => {
  it('includes collection ID in error message', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'my-sensors',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/my-sensors',
          },
        ],
      })
    );
    expect(() => builder.getSystems()).toThrow("'my-sensors'");
  });

  it('includes requested resource type in error message', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'test',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/test',
          },
        ],
      })
    );
    expect(() => builder.getSystems()).toThrow("'systems'");
  });

  it('lists available resources in error message', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'partial',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/partial',
          },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
          {
            rel: 'ogc-cs:procedures',
            type: '',
            title: '',
            href: '/procedures',
          },
        ],
      })
    );
    expect(() => builder.getSystems()).toThrow('deployments');
    expect(() => builder.getSystems()).toThrow('procedures');
  });

  it('throws EndpointError instance', () => {
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        id: 'empty',
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/empty',
          },
        ],
      })
    );
    expect(() => builder.getSystems()).toThrow(EndpointError);
  });
});

// ----------------------------------------
// Top-level resource URL override
// ----------------------------------------

describe('Top-level resource URL override', () => {
  it('uses resourceUrls map when provided', () => {
    const resourceUrls = new Map([
      ['systems', 'https://api.example.com/sensorhub/api/systems'],
    ]);
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      }),
      resourceUrls
    );
    const url = builder.getSystems();
    expect(url).toBe('https://api.example.com/sensorhub/api/systems');
  });

  it('falls back to collection-scoped URL when resource not in map', () => {
    const resourceUrls = new Map([
      ['systems', 'https://api.example.com/sensorhub/api/systems'],
    ]);
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
          {
            rel: 'ogc-cs:deployments',
            type: '',
            title: '',
            href: '/deployments',
          },
        ],
      }),
      resourceUrls
    );
    const url = builder.getDeployments();
    expect(url).toBe('https://example.com/collections/iot/deployments');
  });

  it('strips trailing slash from top-level resource URL', () => {
    const resourceUrls = new Map([
      ['systems', 'https://api.example.com/sensorhub/api/systems/'],
    ]);
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      }),
      resourceUrls
    );
    const url = builder.getSystem('sys-001');
    expect(url).toBe('https://api.example.com/sensorhub/api/systems/sys-001');
  });

  it('appends query string to top-level resource URL', () => {
    const resourceUrls = new Map([
      ['systems', 'https://api.example.com/sensorhub/api/systems'],
    ]);
    const builder = new CSAPIQueryBuilder(
      makeCollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://example.com/collections/iot',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
      }),
      resourceUrls
    );
    const url = builder.getSystems({ limit: 10 });
    expect(url).toBe('https://api.example.com/sensorhub/api/systems?limit=10');
  });
});

// ========================================
// Content-Type Map (F-10)
// ========================================

describe('CSAPI_CONTENT_TYPES', () => {
  it('maps all 5 Part 1 resources to application/geo+json', () => {
    const part1Types = [
      'systems',
      'deployments',
      'procedures',
      'samplingFeatures',
      'properties',
    ] as const;
    for (const type of part1Types) {
      expect(CSAPI_CONTENT_TYPES[type]).toBe('application/geo+json');
    }
  });

  it('maps all 4 Part 2 resources to application/json', () => {
    const part2Types = [
      'datastreams',
      'observations',
      'controlStreams',
      'commands',
    ] as const;
    for (const type of part2Types) {
      expect(CSAPI_CONTENT_TYPES[type]).toBe('application/json');
    }
  });

  it('has an entry for every CSAPIResourceType', () => {
    for (const type of CSAPIResourceTypes) {
      expect(CSAPI_CONTENT_TYPES).toHaveProperty(type);
    }
    expect(Object.keys(CSAPI_CONTENT_TYPES)).toHaveLength(
      CSAPIResourceTypes.length
    );
  });
});

describe('getContentTypeForResource', () => {
  it('returns application/geo+json for a known Part 1 type', () => {
    expect(getContentTypeForResource('systems')).toBe('application/geo+json');
  });

  it('returns application/json for a known Part 2 type', () => {
    expect(getContentTypeForResource('datastreams')).toBe('application/json');
  });

  it('returns application/json fallback for an unrecognized type', () => {
    expect(getContentTypeForResource('unknownType')).toBe('application/json');
  });
});
