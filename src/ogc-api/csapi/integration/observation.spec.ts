/**
 * Integration tests — Observation workflow.
 *
 * Verifies the observation data access lifecycle:
 * discover systems → find datastreams → query observations →
 * paginate results → parse response envelopes → validate schemas.
 *
 * All HTTP interactions use `globalThis.fetch = jest.fn()` mocking (AP2).
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/31
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */

import type { OgcApiCollectionInfo } from '../../model.js';
import CSAPIQueryBuilder from '../url_builder.js';
import { parseCollectionResponse } from '../formats/response.js';
import { makeTestCollection } from './_fixtures.js';

// Identity parseItem — passes elements through unchanged (for envelope/pagination tests)
const identity = (item: unknown) => item;

import { parseSWEComponent } from '../formats/swecommon/parser.js';
import { getCSAPIResourceType } from '../formats/geojson.js';

// ========================================
// Test Fixtures
// ========================================

function makeCollection(
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
      { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
      { rel: 'ogc-cs:datastreams', type: '', title: '', href: '/datastreams' },
      {
        rel: 'ogc-cs:observations',
        type: '',
        title: '',
        href: '/observations',
      },
    ],
    title: 'IoT Sensors',
    description: 'IoT sensor collection',
    id: 'iot',
    ...overrides,
  });
}

/** System list response — pick a system to drill down on. */
const SYSTEMS_RESPONSE = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'sys-001',
      geometry: { type: 'Point', coordinates: [-105.0, 40.0] },
      properties: {
        featureType: 'http://www.w3.org/ns/sosa/Sensor',
        uid: 'urn:example:weather-001',
        name: 'Weather Sensor',
      },
      links: [
        {
          rel: 'alternate',
          type: 'application/sml+json',
          href: '/systems/sys-001?f=sml',
        },
      ],
    },
  ],
  links: [],
  numberReturned: 1,
};

/** Datastream list nested under system. */
const DATASTREAMS_RESPONSE = {
  items: [
    {
      id: 'ds-temp',
      name: 'Temperature',
      observedProperties: ['http://qudt.org/vocab/quantitykind/Temperature'],
      phenomenonTime: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-12-31T23:59:59Z',
      },
      resultTime: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-12-31T23:59:59Z',
      },
      resultType: 'measure',
      live: true,
      formats: ['application/swe+json'],
      links: [{ rel: 'self', href: '/datastreams/ds-temp' }],
    },
    {
      id: 'ds-wind',
      name: 'Wind Speed',
      observedProperties: ['http://qudt.org/vocab/quantitykind/WindSpeed'],
      phenomenonTime: null,
      resultTime: null,
      resultType: 'record',
      live: false,
      formats: ['application/swe+json', 'application/swe+csv'],
      links: [],
    },
  ],
  links: [],
};

/** Observations page 1 — has next link. */
const OBSERVATIONS_PAGE_1 = {
  items: [
    {
      id: 'obs-001',
      phenomenonTime: '2024-06-15T12:00:00Z',
      resultTime: '2024-06-15T12:00:01Z',
      result: { temperature: 22.5 },
    },
    {
      id: 'obs-002',
      phenomenonTime: '2024-06-15T12:05:00Z',
      resultTime: '2024-06-15T12:05:01Z',
      result: { temperature: 22.7 },
    },
  ],
  links: [
    { rel: 'next', href: '/datastreams/ds-temp/observations?offset=2&limit=2' },
  ],
};

/** Observations page 2 — no next link (last page). */
const OBSERVATIONS_PAGE_2 = {
  items: [
    {
      id: 'obs-003',
      phenomenonTime: '2024-06-15T12:10:00Z',
      resultTime: '2024-06-15T12:10:01Z',
      result: { temperature: 23.1 },
    },
  ],
  links: [],
};

/** DataStream schema response (SWE Common DataRecord). */
const DATASTREAM_SCHEMA = {
  type: 'DataRecord',
  label: 'Temperature Observation',
  fields: [
    {
      name: 'time',
      type: 'Time',
      label: 'Sampling Time',
      definition: 'http://www.opengis.net/def/property/OGC/0/SamplingTime',
      referenceFrame: 'http://www.opengis.net/def/trs/BIPM/0/UTC',
      uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' },
    },
    {
      name: 'temperature',
      type: 'Quantity',
      label: 'Air Temperature',
      definition: 'http://qudt.org/vocab/quantitykind/Temperature',
      uom: { code: 'Cel' },
    },
  ],
};

// ========================================
// System → DataStream Discovery
// ========================================

describe('Observation workflow — system to datastream discovery', () => {
  const builder = new CSAPIQueryBuilder(makeCollection());

  it('builds system list URL and parses returned systems', () => {
    const url = builder.getSystems({ limit: 10 });
    expect(url).toContain('/systems?limit=10');

    const parsed = parseCollectionResponse(SYSTEMS_RESPONSE, identity);
    expect(parsed.items).toHaveLength(1);
    expect(getCSAPIResourceType(parsed.items[0])).toBe('System');
  });

  it('builds nested datastream URL for a discovered system', () => {
    const url = builder.getSystemDataStreams('sys-001');
    expect(url).toBe(
      'https://api.example.com/collections/iot/systems/sys-001/datastreams'
    );
  });

  it('parses datastream items envelope and accesses datastream metadata', () => {
    const parsed = parseCollectionResponse(DATASTREAMS_RESPONSE, identity);
    expect(parsed.items).toHaveLength(2);

    const tempDs = parsed.items[0] as Record<string, unknown>;
    expect(tempDs.id).toBe('ds-temp');
    expect(tempDs.name).toBe('Temperature');
    expect(tempDs.live).toBe(true);
  });
});

// ========================================
// Observation Querying — Temporal Filtering
// ========================================

describe('Observation workflow — temporal query parameters', () => {
  const builder = new CSAPIQueryBuilder(makeCollection());

  it('builds observation URL with phenomenonTime filter', () => {
    const url = builder.getDataStreamObservations('ds-temp', {
      phenomenonTime: {
        start: new Date('2024-06-15T00:00:00Z'),
        end: new Date('2024-06-15T23:59:59Z'),
      },
    });
    expect(url).toContain('/datastreams/ds-temp/observations');
    expect(url).toContain('phenomenonTime=');
    expect(url).toContain('2024-06-15');
  });

  it('builds observation URL with resultTime=latest', () => {
    const url = builder.getDataStreamObservations('ds-temp', {
      resultTime: 'latest',
    });
    expect(url).toContain('resultTime=latest');
  });

  it('builds observation URL with limit and offset pagination', () => {
    const url = builder.getDataStreamObservations('ds-temp', {
      limit: 100,
      offset: 200,
    });
    expect(url).toContain('limit=100');
    expect(url).toContain('offset=200');
  });
});

// ========================================
// Pagination — Offset-Based
// ========================================

describe('Observation workflow — pagination', () => {
  it('detects next link in first page', () => {
    const page1 = parseCollectionResponse(OBSERVATIONS_PAGE_1, identity);
    expect(page1.items).toHaveLength(2);

    const nextLink = page1.links.find(
      (l: { rel?: string }) => l.rel === 'next'
    );
    expect(nextLink).toBeDefined();
    expect(nextLink!.href).toContain('offset=2');
  });

  it('detects end of pagination on last page', () => {
    const page2 = parseCollectionResponse(OBSERVATIONS_PAGE_2, identity);
    expect(page2.items).toHaveLength(1);

    const nextLink = page2.links.find(
      (l: { rel?: string }) => l.rel === 'next'
    );
    expect(nextLink).toBeUndefined();
  });

  it('accumulates items across pages', () => {
    const page1 = parseCollectionResponse(OBSERVATIONS_PAGE_1, identity);
    const page2 = parseCollectionResponse(OBSERVATIONS_PAGE_2, identity);

    const allItems = [...page1.items, ...page2.items];
    expect(allItems).toHaveLength(3);

    const ids = allItems.map((obs: Record<string, unknown>) => obs.id);
    expect(ids).toEqual(['obs-001', 'obs-002', 'obs-003']);
  });
});

// ========================================
// Cursor-Based Pagination
// ========================================

describe('Observation workflow — cursor-based pagination', () => {
  const builder = new CSAPIQueryBuilder(makeCollection());

  it('builds URL with cursor token', () => {
    const url = builder.getDataStreamObservations('ds-temp', {
      cursor: 'abc123xyz',
      limit: 50,
    });
    expect(url).toContain('cursor=abc123xyz');
    expect(url).toContain('limit=50');
  });
});

// ========================================
// Schema Retrieval and Component Parsing
// ========================================

describe('Observation workflow — schema and SWE Common parsing', () => {
  const builder = new CSAPIQueryBuilder(makeCollection());

  it('builds datastream schema URL', () => {
    const url = builder.getDataStreamSchema('ds-temp', {
      f: 'application/swe+json',
    });
    expect(url).toContain('/datastreams/ds-temp/schema');
    expect(url).toContain('f=application%2Fswe%2Bjson');
  });

  it('parses DataRecord schema into typed SWE Common components', () => {
    const component = parseSWEComponent(DATASTREAM_SCHEMA);
    expect(component).toBeDefined();
    expect(component.type).toBe('DataRecord');

    const record = component as {
      type: string;
      fields: Array<{ name: string; component?: { type: string } }>;
    };
    expect(record.fields).toHaveLength(2);
    expect(record.fields[0].name).toBe('time');
    expect(record.fields[0].component?.type).toBe('Time');
    expect(record.fields[1].name).toBe('temperature');
    expect(record.fields[1].component?.type).toBe('Quantity');
  });
});

// ========================================
// Observation Creation URL
// ========================================

describe('Observation workflow — observation creation', () => {
  const builder = new CSAPIQueryBuilder(makeCollection());

  it('builds observation creation URL for a datastream', () => {
    const url = builder.createObservation('ds-temp');
    expect(url).toBe(
      'https://api.example.com/collections/iot/datastreams/ds-temp/observations'
    );
  });
});

// ========================================
// Error Handling
// ========================================

describe('Observation workflow — error handling', () => {
  it('handles empty observation collection gracefully', () => {
    const emptyResponse = { items: [], links: [] };
    const parsed = parseCollectionResponse(emptyResponse, identity);
    expect(parsed.items).toHaveLength(0);
    expect(parsed.links).toHaveLength(0);
  });

  it('throws on malformed observation response (not an object)', () => {
    expect(() => parseCollectionResponse(42, identity)).toThrow(
      /expected an object/
    );
  });

  it('propagates EndpointError when datastreams not available', () => {
    const noDs = makeCollection({
      links: [
        {
          rel: 'self',
          type: '',
          title: '',
          href: 'https://api.example.com/collections/bare',
        },
        { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
      ],
      id: 'bare',
    });
    const builder = new CSAPIQueryBuilder(noDs);

    expect(() => builder.getDataStreams()).toThrow(
      /does not support 'datastreams'/
    );
    // Per-ID methods skip assertResourceAvailable (Phase 7 #156/#157)
    expect(builder.getDataStreamObservations('ds-001')).toEqual(
      expect.any(String)
    );
  });
});
