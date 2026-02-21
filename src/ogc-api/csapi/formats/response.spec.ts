/**
 * Tests for CSAPI collection response envelope normalization.
 *
 * Verifies that {@link parseCollectionResponse} correctly handles both
 * the GeoJSON `FeatureCollection` envelope and the OpenSensorHub `items`
 * envelope, producing a consistent {@link CollectionResponse} output.
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/36
 */

import { parseCollectionResponse } from './response.js';

// ========================================
// Test Fixtures
// ========================================

/** Standard GeoJSON FeatureCollection response (OGC Part 1). */
const FEATURE_COLLECTION_RESPONSE = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'sys-001',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { uid: 'urn:example:sys-001', name: 'Sensor A', featureType: 'sosa:Sensor' },
    },
    {
      type: 'Feature',
      id: 'sys-002',
      geometry: null,
      properties: { uid: 'urn:example:sys-002', name: 'Sensor B', featureType: 'sosa:Sensor' },
    },
  ],
  links: [
    { href: 'https://example.com/systems?offset=2', rel: 'next', type: 'application/geo+json' },
  ],
  numberMatched: 5,
  numberReturned: 2,
  timeStamp: '2026-01-15T12:00:00Z',
};

/** OpenSensorHub-style items envelope (no type discriminator, no pagination). */
const ITEMS_ENVELOPE_RESPONSE = {
  items: [
    {
      type: 'Feature',
      id: 'sys-001',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { uid: 'urn:example:sys-001', name: 'Sensor A', featureType: 'sosa:Sensor' },
    },
    {
      type: 'Feature',
      id: 'sys-002',
      geometry: null,
      properties: { uid: 'urn:example:sys-002', name: 'Sensor B', featureType: 'sosa:Sensor' },
    },
  ],
  links: [
    { href: 'https://osh.example.com/systems', rel: 'self', type: 'application/json' },
  ],
};

/** Part 2 items envelope with pagination metadata. */
const ITEMS_WITH_PAGINATION = {
  items: [
    { id: 'obs-1', result: 23.5 },
    { id: 'obs-2', result: 24.1 },
  ],
  links: [],
  numberMatched: 100,
  numberReturned: 2,
  timeStamp: '2026-01-15T12:30:00Z',
};

// ========================================
// Tests — FeatureCollection Envelope
// ========================================

describe('parseCollectionResponse — FeatureCollection envelope', () => {
  it('extracts features as the items array', () => {
    const result = parseCollectionResponse(FEATURE_COLLECTION_RESPONSE);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual(FEATURE_COLLECTION_RESPONSE.features[0]);
    expect(result.items[1]).toEqual(FEATURE_COLLECTION_RESPONSE.features[1]);
  });

  it('extracts links', () => {
    const result = parseCollectionResponse(FEATURE_COLLECTION_RESPONSE);
    expect(result.links).toHaveLength(1);
    expect(result.links[0].rel).toBe('next');
  });

  it('extracts numberMatched and numberReturned', () => {
    const result = parseCollectionResponse(FEATURE_COLLECTION_RESPONSE);
    expect(result.numberMatched).toBe(5);
    expect(result.numberReturned).toBe(2);
  });

  it('extracts timeStamp', () => {
    const result = parseCollectionResponse(FEATURE_COLLECTION_RESPONSE);
    expect(result.timeStamp).toBe('2026-01-15T12:00:00Z');
  });
});

// ========================================
// Tests — Items Envelope
// ========================================

describe('parseCollectionResponse — items envelope', () => {
  it('extracts items from the items key', () => {
    const result = parseCollectionResponse(ITEMS_ENVELOPE_RESPONSE);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual(ITEMS_ENVELOPE_RESPONSE.items[0]);
  });

  it('extracts links', () => {
    const result = parseCollectionResponse(ITEMS_ENVELOPE_RESPONSE);
    expect(result.links).toHaveLength(1);
    expect(result.links[0].rel).toBe('self');
  });

  it('defaults numberMatched and numberReturned to undefined when absent', () => {
    const result = parseCollectionResponse(ITEMS_ENVELOPE_RESPONSE);
    expect(result.numberMatched).toBeUndefined();
    expect(result.numberReturned).toBeUndefined();
  });

  it('defaults timeStamp to undefined when absent', () => {
    const result = parseCollectionResponse(ITEMS_ENVELOPE_RESPONSE);
    expect(result.timeStamp).toBeUndefined();
  });

  it('extracts pagination metadata when present in items envelope', () => {
    const result = parseCollectionResponse(ITEMS_WITH_PAGINATION);
    expect(result.numberMatched).toBe(100);
    expect(result.numberReturned).toBe(2);
    expect(result.timeStamp).toBe('2026-01-15T12:30:00Z');
  });
});

// ========================================
// Tests — Format Equivalence
// ========================================

describe('parseCollectionResponse — format equivalence', () => {
  it('produces the same items from both envelope formats', () => {
    const fromFeatures = parseCollectionResponse(FEATURE_COLLECTION_RESPONSE);
    const fromItems = parseCollectionResponse(ITEMS_ENVELOPE_RESPONSE);

    // Same items in the same order
    expect(fromFeatures.items).toEqual(fromItems.items);
  });

  it('prefers features over items when both are present', () => {
    const body = {
      type: 'FeatureCollection',
      features: [{ id: 'from-features' }],
      items: [{ id: 'from-items' }],
      links: [],
    };
    const result = parseCollectionResponse(body);
    expect(result.items).toEqual([{ id: 'from-features' }]);
  });
});

// ========================================
// Tests — Edge Cases
// ========================================

describe('parseCollectionResponse — edge cases', () => {
  it('handles an empty features array', () => {
    const result = parseCollectionResponse({
      type: 'FeatureCollection',
      features: [],
      links: [],
      numberMatched: 0,
      numberReturned: 0,
    });
    expect(result.items).toEqual([]);
    expect(result.numberMatched).toBe(0);
    expect(result.numberReturned).toBe(0);
  });

  it('handles an empty items array', () => {
    const result = parseCollectionResponse({ items: [], links: [] });
    expect(result.items).toEqual([]);
  });

  it('defaults links to empty array when absent', () => {
    const result = parseCollectionResponse({ items: [{ id: '1' }] });
    expect(result.links).toEqual([]);
  });

  it('throws on null input', () => {
    expect(() => parseCollectionResponse(null)).toThrow(
      'Invalid collection response: expected an object'
    );
  });

  it('throws on non-object input', () => {
    expect(() => parseCollectionResponse('not an object')).toThrow(
      'Invalid collection response: expected an object'
    );
  });

  it('throws when neither features nor items is present', () => {
    expect(() => parseCollectionResponse({ links: [] })).toThrow(
      'missing both "features" and "items"'
    );
  });

  it('ignores non-number pagination values', () => {
    const result = parseCollectionResponse({
      items: [],
      numberMatched: 'many',
      numberReturned: null,
    });
    expect(result.numberMatched).toBeUndefined();
    expect(result.numberReturned).toBeUndefined();
  });
});
