/**
 * Integration tests — Discovery workflow.
 *
 * Verifies the full discovery lifecycle:
 * connect → check conformance → list collections → build query URLs →
 * retrieve resources → classify features → parse response envelopes.
 *
 * All HTTP interactions use `globalThis.fetch = jest.fn()` mocking (AP2).
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/31
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */

import type { OgcApiCollectionInfo } from '../../model.js';
import CSAPIQueryBuilder from '../url_builder.js';
import { EndpointError } from '../../../shared/errors.js';
import { parseCollectionResponse } from '../formats/response.js';
import { makeTestCollection, ALL_CSAPI_LINKS } from './_fixtures.js';

// Identity parseItem — passes elements through unchanged (for envelope/classification tests)
const identity = (item: unknown) => item;

import {
  isCSAPIFeature,
  getCSAPIResourceType,
  extractCSAPIFeature,
} from '../formats/geojson.js';
import {
  classifyFeature,
  inferResourceTypeFromPath,
} from '../formats/classification.js';
import {
  MEDIA_TYPE_GEOJSON,
  MEDIA_TYPE_SENSORML_JSON,
} from '../formats/constants.js';

// ========================================
// Test Fixtures
// ========================================

/** Minimal collection with Part 1 + Part 2 resources advertised. */
function makeCSAPICollection(
  overrides: Partial<OgcApiCollectionInfo> = {}
): OgcApiCollectionInfo {
  return makeTestCollection({
    links: [
      {
        rel: 'self',
        type: '',
        title: '',
        href: 'https://api.example.com/collections/weather',
      },
      ...ALL_CSAPI_LINKS,
    ],
    title: 'Weather Stations',
    description: 'A CSAPI weather station collection',
    id: 'weather',
    ...overrides,
  });
}

/** GeoJSON FeatureCollection with 2 System features. */
const SYSTEMS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'sys-001',
      geometry: { type: 'Point', coordinates: [-105.0, 40.0] },
      properties: {
        featureType: 'http://www.w3.org/ns/sosa/Sensor',
        uid: 'urn:example:weather-station-001',
        name: 'Weather Station Alpha',
        description: 'Mountaintop weather sensor',
      },
      links: [
        {
          rel: 'self',
          href: 'https://api.example.com/collections/weather/systems/sys-001',
        },
      ],
    },
    {
      type: 'Feature',
      id: 'sys-002',
      geometry: { type: 'Point', coordinates: [-104.5, 39.5] },
      properties: {
        featureType: 'http://www.w3.org/ns/sosa/Platform',
        uid: 'urn:example:platform-002',
        name: 'Platform Beta',
      },
      links: [],
    },
  ],
  links: [
    {
      rel: 'next',
      href: 'https://api.example.com/collections/weather/systems?offset=2',
    },
  ],
  numberMatched: 10,
  numberReturned: 2,
};

/** Items-envelope response (Part 2 pattern, as used by OSH). */
const DATASTREAMS_ITEMS = {
  items: [
    {
      id: 'ds-001',
      name: 'Temperature',
      observedProperties: ['http://qudt.org/vocab/quantitykind/Temperature'],
      phenomenonTime: null,
      resultTime: null,
      resultType: 'measure',
      live: true,
      formats: ['application/swe+json'],
      links: [
        {
          rel: 'self',
          href: 'https://api.example.com/collections/weather/datastreams/ds-001',
        },
      ],
    },
  ],
  links: [],
};

/** GeoJSON FeatureCollection with null featureType (52North pattern). */
const SYSTEMS_NULL_FEATURETYPE = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'sys-null',
      geometry: null,
      properties: {
        featureType: null,
        uid: 'urn:52n:sys-null',
        name: 'Untyped System',
      },
      links: [],
    },
  ],
  links: [],
};

/** Minimal collection with no CSAPI resource links. */
const NON_CSAPI_COLLECTION = makeCSAPICollection({
  links: [
    {
      rel: 'self',
      type: '',
      title: '',
      href: 'https://api.example.com/collections/vanilla',
    },
  ],
  id: 'vanilla',
});

// ========================================
// Discovery Workflow — Full Lifecycle
// ========================================

describe('Discovery workflow — full lifecycle', () => {
  it('creates a builder, discovers 9 resource types, and builds URLs', () => {
    const builder = new CSAPIQueryBuilder(makeCSAPICollection());

    // All 9 CSAPI resource types discovered
    expect(builder.availableResources.size).toBe(9);
    expect(builder.availableResources.has('systems')).toBe(true);
    expect(builder.availableResources.has('datastreams')).toBe(true);
    expect(builder.availableResources.has('commands')).toBe(true);

    // Builder constructs correct URLs for each resource type
    expect(builder.getSystems()).toBe(
      'https://api.example.com/collections/weather/systems'
    );
    expect(builder.getDataStreams()).toBe(
      'https://api.example.com/collections/weather/datastreams'
    );
    expect(builder.getCommands()).toBe(
      'https://api.example.com/collections/weather/commands'
    );
  });

  it('integrates query parameters into discovered resource URLs', () => {
    const builder = new CSAPIQueryBuilder(makeCSAPICollection());

    const url = builder.getSystems({
      bbox: [-106, 39, -104, 41],
      limit: 50,
    });

    expect(url).toContain('/systems?');
    expect(url).toContain('bbox=-106%2C39%2C-104%2C41');
    expect(url).toContain('limit=50');
  });

  it('throws EndpointError for unavailable resources', () => {
    const builder = new CSAPIQueryBuilder(NON_CSAPI_COLLECTION);

    expect(builder.availableResources.size).toBe(0);
    expect(() => builder.getSystems()).toThrow(EndpointError);
    expect(() => builder.getSystems()).toThrow(
      /does not support 'systems' resource/
    );
  });
});

// ========================================
// Response Parsing — GeoJSON FeatureCollection
// ========================================

describe('Discovery workflow — GeoJSON response parsing', () => {
  it('parses FeatureCollection into normalized CollectionResponse', () => {
    const result = parseCollectionResponse(SYSTEMS_GEOJSON, identity);

    expect(result.items).toHaveLength(2);
    expect(result.numberMatched).toBe(10);
    expect(result.numberReturned).toBe(2);
    expect(result.links).toHaveLength(1);
    expect(result.links[0].rel).toBe('next');
  });

  it('classifies each feature from the parsed response', () => {
    const result = parseCollectionResponse(SYSTEMS_GEOJSON, identity);

    expect(getCSAPIResourceType(result.items[0])).toBe('System');
    expect(getCSAPIResourceType(result.items[1])).toBe('System');
    expect(isCSAPIFeature(result.items[0])).toBe(true);
  });

  it('extracts typed System from response features', () => {
    const result = parseCollectionResponse(SYSTEMS_GEOJSON, identity);
    const system = extractCSAPIFeature(
      result.items[0] as Record<string, unknown>
    );

    expect(system).not.toBeNull();
    expect(system!.properties.name).toBe('Weather Station Alpha');
    expect(system!.properties.uid).toBe('urn:example:weather-station-001');
    expect(system!.id).toBe('sys-001');
  });
});

// ========================================
// Response Parsing — Items Envelope
// ========================================

describe('Discovery workflow — items envelope parsing', () => {
  it('parses items envelope into normalized CollectionResponse', () => {
    const result = parseCollectionResponse(DATASTREAMS_ITEMS, identity);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toHaveProperty('id', 'ds-001');
    expect(result.items[0]).toHaveProperty('name', 'Temperature');
    expect(result.links).toHaveLength(0);
  });
});

// ========================================
// Classification Fallback — Null featureType
// ========================================

describe('Discovery workflow — classification fallback', () => {
  it('uses endpoint-context hint when featureType is null', () => {
    const result = parseCollectionResponse(SYSTEMS_NULL_FEATURETYPE, identity);
    const feature = result.items[0];

    // Pure featureType classification fails
    expect(getCSAPIResourceType(feature)).toBeNull();

    // Path-based inference provides the hint
    const hint = inferResourceTypeFromPath(
      'https://api.example.com/collections/weather/systems'
    );
    expect(hint).toBe('System');

    // classifyFeature uses the hint as fallback
    expect(classifyFeature(feature, hint)).toBe('System');
  });

  it('does not override valid featureType with hint', () => {
    const validFeature = SYSTEMS_GEOJSON.features[0];
    const hint = inferResourceTypeFromPath(
      'https://api.example.com/collections/weather/deployments'
    );
    expect(hint).toBe('Deployment');

    // Valid featureType takes precedence over contradicting hint
    expect(classifyFeature(validFeature, hint)).toBe('System');
  });
});

// ========================================
// Format Negotiation
// ========================================

describe('Discovery workflow — format negotiation', () => {
  it('constructs URL with SensorML format parameter', () => {
    const builder = new CSAPIQueryBuilder(makeCSAPICollection());
    const url = builder.getSystem('sys-001', { f: MEDIA_TYPE_SENSORML_JSON });

    expect(url).toContain('/systems/sys-001');
    expect(url).toContain(`f=${encodeURIComponent(MEDIA_TYPE_SENSORML_JSON)}`);
  });

  it('constructs URL with GeoJSON format parameter', () => {
    const builder = new CSAPIQueryBuilder(makeCSAPICollection());
    const url = builder.getSystems({ f: MEDIA_TYPE_GEOJSON });

    expect(url).toContain(`f=${encodeURIComponent(MEDIA_TYPE_GEOJSON)}`);
  });
});

// ========================================
// Partial Collections — Subset of Resources
// ========================================

describe('Discovery workflow — partial collection support', () => {
  it('works with a collection advertising only Part 1 resources', () => {
    const part1Only = makeCSAPICollection({
      links: [
        {
          rel: 'self',
          type: '',
          title: '',
          href: 'https://api.example.com/collections/part1',
        },
        { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        {
          rel: 'ogc-cs:deployments',
          type: '',
          title: '',
          href: '/deployments',
        },
      ],
      id: 'part1',
    });

    const builder = new CSAPIQueryBuilder(part1Only);

    expect(builder.availableResources.size).toBe(2);
    expect(builder.availableResources.has('systems')).toBe(true);
    expect(builder.availableResources.has('deployments')).toBe(true);

    // Part 2 resources are unavailable
    expect(() => builder.getDataStreams()).toThrow(EndpointError);
    expect(() => builder.getObservations()).toThrow(EndpointError);
  });

  it('works with a collection advertising only Part 2 resources', () => {
    const part2Only = makeCSAPICollection({
      links: [
        {
          rel: 'self',
          type: '',
          title: '',
          href: 'https://api.example.com/collections/part2',
        },
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
      id: 'part2',
    });

    const builder = new CSAPIQueryBuilder(part2Only);

    expect(builder.availableResources.size).toBe(2);
    expect(() => builder.getSystems()).toThrow(EndpointError);
    expect(builder.getDataStreams()).toContain('/datastreams');
  });
});

// ========================================
// Error Scenarios
// ========================================

describe('Discovery workflow — error scenarios', () => {
  it('throws on invalid collection response body', () => {
    expect(() => parseCollectionResponse(null, identity)).toThrow(
      /expected an object/
    );
    expect(() => parseCollectionResponse('string', identity)).toThrow(
      /expected an object/
    );
  });

  it('throws on response missing both features and items arrays', () => {
    expect(() => parseCollectionResponse({ data: [] }, identity)).toThrow(
      /missing both "features" and "items"/
    );
  });

  it('EndpointError includes available resources in message', () => {
    const builder = new CSAPIQueryBuilder(
      makeCSAPICollection({
        links: [
          {
            rel: 'self',
            type: '',
            title: '',
            href: 'https://api.example.com/collections/test',
          },
          { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        ],
        id: 'test',
      })
    );

    try {
      builder.getDeployments();
      fail('Expected EndpointError');
    } catch (e) {
      expect(e).toBeInstanceOf(EndpointError);
      expect((e as EndpointError).message).toContain('systems');
      expect((e as EndpointError).message).toContain(
        "does not support 'deployments'"
      );
    }
  });
});
