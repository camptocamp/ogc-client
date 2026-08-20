/**
 * Integration tests — Cross-resource navigation.
 *
 * Verifies multi-hop navigation chains that traverse the CSAPI resource
 * graph through the CSAPIQueryBuilder, and confirms format round-tripping
 * through the parsing layer:
 *
 *   System → datastreams → observations
 *   System → controlStreams → commands
 *   System → subsystems (recursive)
 *   System → deployments, procedures, samplingFeatures
 *   GeoJSON parse → classify → extract → validate
 *   SWE Common parse → validate field types
 *
 * All HTTP interactions use `globalThis.fetch = jest.fn()` mocking (AP2).
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/31
 * @see https://docs.ogc.org/is/23-001/23-001.html
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */

import type { OgcApiCollectionInfo } from '../../model.js';
import CSAPIQueryBuilder from '../url_builder.js';
import { parseCollectionResponse } from '../formats/response.js';
import { makeTestCollection, ALL_CSAPI_LINKS } from './_fixtures.js';

// Identity parseItem — passes elements through unchanged (for envelope/pagination tests)
const identity = (item: unknown) => item;

import {
  isCSAPIFeature,
  getCSAPIResourceType,
  extractCSAPIFeature,
} from '../formats/geojson.js';
import {
  inferResourceTypeFromPath,
  classifyFeature,
} from '../formats/classification.js';
import {
  CSAPI_MEDIA_TYPES,
  MEDIA_TYPE_SWE_JSON,
  MEDIA_TYPE_GEOJSON,
  MEDIA_TYPE_SENSORML_JSON,
} from '../formats/constants.js';
import { parseSWEComponent } from '../formats/swecommon/parser.js';
import { EndpointError } from '../../../shared/errors.js';

// ========================================
// Shared Fixtures
// ========================================

/** Full-featured collection that advertises all CSAPI resources. */
function makeFullCollection(
  overrides: Partial<OgcApiCollectionInfo> = {}
): OgcApiCollectionInfo {
  return makeTestCollection({
    links: [
      {
        rel: 'self',
        type: '',
        title: '',
        href: 'https://api.example.com/collections/iot',
      },
      ...ALL_CSAPI_LINKS.filter((l) => l.rel !== 'ogc-cs:properties'),
    ],
    title: 'IoT Full Collection',
    description: 'Collection with all CSAPI resources',
    id: 'iot',
    ...overrides,
  });
}

/** GeoJSON Feature for a System resource (SOSA Sensor). */
const SYSTEM_FEATURE = {
  type: 'Feature',
  id: 'sys-001',
  geometry: { type: 'Point', coordinates: [-118.24, 34.05] },
  properties: {
    featureType: 'http://www.w3.org/ns/sosa/Sensor',
    name: 'Weather Station Alpha',
    description: 'Primary weather monitoring station',
    validTime: { start: '2024-01-01T00:00:00Z' },
    systemType: 'sensor',
  },
};

/** GeoJSON Feature for a Deployment resource (SOSA Deployment). */
const DEPLOYMENT_FEATURE = {
  type: 'Feature',
  id: 'dep-001',
  geometry: { type: 'Point', coordinates: [-118.24, 34.05] },
  properties: {
    featureType: 'http://www.w3.org/ns/sosa/Deployment',
    name: 'Field Deployment Alpha',
    validTime: { start: '2024-03-01T00:00:00Z' },
    'deployedSystems@link': [
      {
        href: 'https://example.com/api/systems/sys-001',
        uid: 'urn:example:system:sys-001',
        title: 'Weather Station Alpha',
      },
    ],
  },
};

/** SWE Common DataRecord for a datastream schema. */
const SWE_DATA_RECORD = {
  type: 'DataRecord',
  fields: [
    {
      name: 'timestamp',
      type: 'Time',
      definition: 'http://www.opengis.net/def/property/OGC/0/SamplingTime',
      referenceFrame: 'http://www.opengis.net/def/trs/BIPM/0/UTC',
      uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' },
    },
    {
      name: 'temperature',
      type: 'Quantity',
      definition: 'http://vocab.nerc.ac.uk/collection/P07/current/CFSN0023/',
      label: 'Air Temperature',
      uom: { code: 'Cel' },
    },
    {
      name: 'windSpeed',
      type: 'Quantity',
      definition: 'http://vocab.nerc.ac.uk/collection/P07/current/CFSN0038/',
      label: 'Wind Speed',
      uom: { code: 'm/s' },
    },
  ],
};

// ========================================
// System → Nested Resource Navigation
// ========================================

describe('Navigation — system → nested resources', () => {
  const builder = new CSAPIQueryBuilder(makeFullCollection());

  it('navigates system → datastreams', () => {
    const url = builder.getSystemDatastreams('sys-001');
    expect(url).toBe(
      'https://api.example.com/collections/iot/systems/sys-001/datastreams'
    );
  });

  it('navigates system → controlStreams', () => {
    const url = builder.getSystemControlStreams('sys-001');
    expect(url).toBe(
      'https://api.example.com/collections/iot/systems/sys-001/controlstreams'
    );
  });

  it('navigates system → samplingFeatures', () => {
    const url = builder.getSystemSamplingFeatures('sys-001');
    expect(url).toBe(
      'https://api.example.com/collections/iot/systems/sys-001/samplingFeatures'
    );
  });

  it('navigates system → deployments', () => {
    const url = builder.getSystemDeployments('sys-001');
    expect(url).toBe(
      'https://api.example.com/collections/iot/systems/sys-001/deployments'
    );
  });

  it('navigates system → procedures', () => {
    const url = builder.getSystemProcedures('sys-001');
    expect(url).toBe(
      'https://api.example.com/collections/iot/systems/sys-001/procedures'
    );
  });

  it('navigates system → subsystems (flat)', () => {
    const url = builder.getSystemSubsystems('sys-001');
    expect(url).toBe(
      'https://api.example.com/collections/iot/systems/sys-001/subsystems'
    );
  });

  it('navigates system → subsystems (recursive)', () => {
    const url = builder.getSystemSubsystems('sys-001', { recursive: true });
    expect(url).toContain('/systems/sys-001/subsystems');
    expect(url).toContain('recursive=true');
  });
});

// ========================================
// Top-Level → Nested Navigation Chain
// ========================================

describe('Navigation — multi-hop top-level → nested chain', () => {
  const builder = new CSAPIQueryBuilder(makeFullCollection());

  it('builds full observation chain: system → datastream → observations', () => {
    // 1. Discover system
    const systemUrl = builder.getSystem('sys-001');
    expect(systemUrl).toContain('/systems/sys-001');

    // 2. Navigate to system's datastreams
    const dstreamsUrl = builder.getSystemDatastreams('sys-001');
    expect(dstreamsUrl).toContain('/systems/sys-001/datastreams');

    // 3. Get datastream schema
    const schemaUrl = builder.getDatastreamSchema('ds-temp');
    expect(schemaUrl).toContain('/datastreams/ds-temp/schema');

    // 4. Observations from that datastream
    const obsUrl = builder.getDatastreamObservations('ds-temp');
    expect(obsUrl).toContain('/datastreams/ds-temp/observations');
  });

  it('builds full command chain: system → controlStream → commands → status', () => {
    // 1. Discover system
    const systemUrl = builder.getSystem('sys-001');
    expect(systemUrl).toContain('/systems/sys-001');

    // 2. Navigate to system's control streams
    const csUrl = builder.getSystemControlStreams('sys-001');
    expect(csUrl).toContain('/systems/sys-001/controlstreams');

    // 3. Submit a command to a control stream
    const cmdUrl = builder.createCommand('cs-valve');
    expect(cmdUrl).toContain('/controlstreams/cs-valve/commands');

    // 4. Check command status
    const statusUrl = builder.getCommandStatus('cmd-001');
    expect(statusUrl).toContain('/commands/cmd-001/status');
  });
});

// ========================================
// GeoJSON Classification Round-Trip
// ========================================

describe('Navigation — GeoJSON feature classification round-trip', () => {
  it('classifies system feature → extracts → validates structure', () => {
    // Classify
    const classified = classifyFeature(SYSTEM_FEATURE);
    expect(classified).not.toBeNull();

    // isCSAPIFeature check
    expect(isCSAPIFeature(SYSTEM_FEATURE)).toBe(true);

    // Get resource type
    const resourceType = getCSAPIResourceType(SYSTEM_FEATURE);
    expect(resourceType).toBe('System');

    // Extract
    const extracted = extractCSAPIFeature(SYSTEM_FEATURE) as unknown as Record<
      string,
      unknown
    >;
    expect(extracted).not.toBeNull();
    expect(extracted.id).toBe('sys-001');
  });

  it('classifies deployment feature', () => {
    expect(isCSAPIFeature(DEPLOYMENT_FEATURE)).toBe(true);
    const resourceType = getCSAPIResourceType(DEPLOYMENT_FEATURE);
    expect(resourceType).toBe('Deployment');
  });

  it('rejects non-CSAPI features', () => {
    const plainFeature = {
      type: 'Feature',
      id: 'plain-001',
      geometry: null,
      properties: { name: 'Not a CSAPI resource' },
    };
    expect(isCSAPIFeature(plainFeature)).toBe(false);
    expect(getCSAPIResourceType(plainFeature)).toBeNull();
  });
});

// ========================================
// Path-Based Classification
// ========================================

describe('Navigation — path-based resource classification', () => {
  it.each([
    ['/collections/iot/systems', 'System'],
    ['/collections/iot/deployments/dep-001', 'Deployment'],
    ['/collections/iot/procedures', 'Procedure'],
    ['/collections/iot/samplingFeatures', 'SamplingFeature'],
  ] as const)(
    'infers resource type from path: %s → %s',
    (path, expectedType) => {
      const inferred = inferResourceTypeFromPath(path);
      expect(inferred).toBe(expectedType);
    }
  );

  it('returns null for unknown paths', () => {
    expect(inferResourceTypeFromPath('/collections/iot/foobar')).toBeNull();
  });

  it('returns null for Part 2 resource paths (not in PATH_SEGMENT_TO_TYPE)', () => {
    // observations, commands, properties are Part 2, not in path classifier
    expect(
      inferResourceTypeFromPath('/collections/iot/observations')
    ).toBeNull();
    expect(inferResourceTypeFromPath('/collections/iot/commands')).toBeNull();
    expect(inferResourceTypeFromPath('/collections/iot/properties')).toBeNull();
  });
});

// ========================================
// Format Negotiation — Media Types
// ========================================

describe('Navigation — CSAPI media type constants', () => {
  it('exports standard CSAPI media types as individual constants', () => {
    expect(MEDIA_TYPE_SWE_JSON).toBe('application/swe+json');
    expect(MEDIA_TYPE_GEOJSON).toBe('application/geo+json');
    expect(MEDIA_TYPE_SENSORML_JSON).toBe('application/sml+json');
  });

  it('CSAPI_MEDIA_TYPES array includes all key media types', () => {
    expect(CSAPI_MEDIA_TYPES).toBeDefined();
    expect(CSAPI_MEDIA_TYPES).toContain('application/swe+json');
    expect(CSAPI_MEDIA_TYPES).toContain('application/geo+json');
    expect(CSAPI_MEDIA_TYPES).toContain('application/sml+json');
  });
});

// ========================================
// SWE Common Round-Trip
// ========================================

describe('Navigation — SWE Common schema round-trip', () => {
  it('parses a DataRecord with Time and Quantity fields', () => {
    const result = parseSWEComponent(SWE_DATA_RECORD) as {
      type: string;
      fields: Array<{
        name: string;
        component?: { type: string; uom?: { code?: string } };
      }>;
    };
    expect(result).not.toBeNull();
    expect(result.type).toBe('DataRecord');
    expect(result.fields).toHaveLength(3);

    const [ts, temp, wind] = result.fields;
    expect(ts.name).toBe('timestamp');
    expect(ts.component?.type).toBe('Time');
    expect(temp.name).toBe('temperature');
    expect(temp.component?.type).toBe('Quantity');
    expect(wind.name).toBe('windSpeed');
    expect(wind.component?.uom?.code).toBe('m/s');
  });
});

// ========================================
// Items Envelope Pagination Navigation
// ========================================

describe('Navigation — paginated navigation with items envelope', () => {
  const PAGE_1 = {
    items: [{ id: 'obs-001' }, { id: 'obs-002' }],
    links: [{ rel: 'next', href: '/observations?offset=2&limit=2' }],
    numberMatched: 5,
    numberReturned: 2,
  };

  const PAGE_2 = {
    items: [{ id: 'obs-003' }, { id: 'obs-004' }],
    links: [{ rel: 'next', href: '/observations?offset=4&limit=2' }],
    numberMatched: 5,
    numberReturned: 2,
  };

  const PAGE_3 = {
    items: [{ id: 'obs-005' }],
    links: [],
    numberMatched: 5,
    numberReturned: 1,
  };

  it('accumulates items across three pages', () => {
    const p1 = parseCollectionResponse(PAGE_1, identity);
    const p2 = parseCollectionResponse(PAGE_2, identity);
    const p3 = parseCollectionResponse(PAGE_3, identity);

    const allItems = [...p1.items, ...p2.items, ...p3.items];
    expect(allItems).toHaveLength(5);
  });

  it('detects end of pagination when no next link', () => {
    const p3 = parseCollectionResponse(PAGE_3, identity);
    const nextLink = p3.links.find((l) => l.rel === 'next');
    expect(nextLink).toBeUndefined();
  });

  it('preserves numberMatched across pages', () => {
    const p1 = parseCollectionResponse(PAGE_1, identity);
    expect(p1.numberMatched).toBe(5);
  });
});

// ========================================
// Partial Collection Navigation
// ========================================

describe('Navigation — partial collection support', () => {
  it('handles Part 1 only collection (no datastreams, observations)', () => {
    const part1Only = makeFullCollection({
      links: [
        {
          rel: 'self',
          type: '',
          title: '',
          href: 'https://api.example.com/collections/cat',
        },
        { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
        {
          rel: 'ogc-cs:deployments',
          type: '',
          title: '',
          href: '/deployments',
        },
        { rel: 'ogc-cs:procedures', type: '', title: '', href: '/procedures' },
      ],
      id: 'cat',
    });
    const builder = new CSAPIQueryBuilder(part1Only);

    // Part 1 resources work
    expect(builder.getSystems()).toContain('/systems');
    expect(builder.getDeployments()).toContain('/deployments');

    // Part 2 resources throw
    expect(() => builder.getDatastreams()).toThrow(EndpointError);
    expect(() => builder.getObservations()).toThrow(EndpointError);
    expect(() => builder.getControlStreams()).toThrow(EndpointError);
    expect(() => builder.getCommands()).toThrow(EndpointError);
  });

  it('handles Part 2 only collection (no systems, deployments)', () => {
    const part2Only = makeFullCollection({
      links: [
        {
          rel: 'self',
          type: '',
          title: '',
          href: 'https://api.example.com/collections/data',
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
        {
          rel: 'ogc-cs:controlStreams',
          type: '',
          title: '',
          href: '/controlStreams',
        },
        { rel: 'ogc-cs:commands', type: '', title: '', href: '/commands' },
      ],
      id: 'data',
    });
    const builder = new CSAPIQueryBuilder(part2Only);

    // Part 2 resources work
    expect(builder.getDatastreams()).toContain('/datastreams');
    expect(builder.getObservations()).toContain('/observations');

    // Part 1 resources throw
    expect(() => builder.getSystems()).toThrow(EndpointError);
    expect(() => builder.getDeployments()).toThrow(EndpointError);
  });
});

// ========================================
// Error Scenarios Across Workflows
// ========================================

describe('Navigation — error handling across workflows', () => {
  it('parseCollectionResponse rejects non-object input', () => {
    expect(() => parseCollectionResponse(null, identity)).toThrow(
      /Invalid collection response/
    );
    expect(() => parseCollectionResponse('string', identity)).toThrow(
      /Invalid collection response/
    );
    expect(() => parseCollectionResponse(42, identity)).toThrow(
      /Invalid collection response/
    );
  });

  it('parseCollectionResponse rejects object with neither features nor items', () => {
    expect(() =>
      parseCollectionResponse({ links: [], other: 'data' }, identity)
    ).toThrow();
  });

  it('EndpointError contains meaningful message about missing resource', () => {
    const collection = makeFullCollection({
      links: [
        {
          rel: 'self',
          type: '',
          title: '',
          href: 'https://api.example.com/collections/empty',
        },
      ],
      id: 'empty',
    });
    const builder = new CSAPIQueryBuilder(collection);

    try {
      builder.getSystems();
      fail('Expected EndpointError');
    } catch (e) {
      expect(e).toBeInstanceOf(EndpointError);
      expect((e as Error).message).toMatch(/systems/i);
    }
  });
});
