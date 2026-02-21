import {
  isCSAPIFeature,
  getCSAPIResourceType,
  parseValidTime,
  isValidUri,
  extractCSAPIFeature,
  SOSA_NS,
  SENSORML_NS,
  SSN_NS,
} from './geojson.js';

// ========================================
// Test Fixtures
// ========================================

/** Builds a minimal GeoJSON Feature for testing. */
function makeFeature(
  featureType: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const {
    uid = 'urn:x-test:feature:1',
    name = 'Test Feature',
    id = 'abc123',
    geometry,
    links = [],
    ...extraProps
  } = overrides;
  return {
    type: 'Feature',
    id,
    geometry: geometry !== undefined ? geometry : null,
    properties: {
      featureType,
      uid,
      name,
      ...extraProps,
    },
    links,
  };
}

// ========================================
// isCSAPIFeature
// ========================================

describe('isCSAPIFeature', () => {
  it('returns true for System subtypes (compact CURIE)', () => {
    for (const name of ['System', 'Sensor', 'Actuator', 'Platform', 'Sampler']) {
      expect(isCSAPIFeature(makeFeature(`sosa:${name}`))).toBe(true);
    }
  });

  it('returns true for System subtypes (full URI)', () => {
    for (const name of ['System', 'Sensor', 'Actuator', 'Platform', 'Sampler']) {
      expect(isCSAPIFeature(makeFeature(`${SOSA_NS}${name}`))).toBe(true);
    }
  });

  it('returns true for Deployment', () => {
    expect(isCSAPIFeature(makeFeature('sosa:Deployment'))).toBe(true);
    expect(isCSAPIFeature(makeFeature(`${SOSA_NS}Deployment`))).toBe(true);
  });

  it('returns true for Procedure subtypes', () => {
    for (const name of [
      'Procedure',
      'ObservingProcedure',
      'SamplingProcedure',
      'ActuatingProcedure',
    ]) {
      expect(isCSAPIFeature(makeFeature(`sosa:${name}`))).toBe(true);
      expect(isCSAPIFeature(makeFeature(`${SOSA_NS}${name}`))).toBe(true);
    }
  });

  it('returns true for SamplingFeature', () => {
    expect(isCSAPIFeature(makeFeature('sosa:SamplingFeature'))).toBe(true);
    expect(isCSAPIFeature(makeFeature(`${SOSA_NS}SamplingFeature`))).toBe(true);
    expect(isCSAPIFeature(makeFeature(`${SOSA_NS}Sample`))).toBe(true);
  });

  it('returns false for non-SOSA URIs', () => {
    expect(
      isCSAPIFeature(
        makeFeature(
          'http://www.opengis.net/def/samplingFeatureType/OGC-OM/2.0/SF_SamplingPoint'
        )
      )
    ).toBe(false);
  });

  it('returns false for missing featureType', () => {
    expect(
      isCSAPIFeature({
        type: 'Feature',
        properties: { uid: 'urn:x:1', name: 'Test' },
      })
    ).toBe(false);
  });

  it('returns false for non-object input', () => {
    expect(isCSAPIFeature(null)).toBe(false);
    expect(isCSAPIFeature(undefined)).toBe(false);
    expect(isCSAPIFeature('string')).toBe(false);
    expect(isCSAPIFeature(42)).toBe(false);
  });

  it('returns false for missing properties object', () => {
    expect(isCSAPIFeature({ type: 'Feature' })).toBe(false);
    expect(isCSAPIFeature({ type: 'Feature', properties: null })).toBe(false);
  });

  it('returns false for unrecognized SOSA local name', () => {
    expect(isCSAPIFeature(makeFeature('sosa:UnknownType'))).toBe(false);
  });

  it('returns true for SensorML Feature featureType', () => {
    expect(
      isCSAPIFeature(makeFeature(`${SENSORML_NS}Feature`))
    ).toBe(true);
  });

  it('returns true for SSN-namespaced Deployment (full URI)', () => {
    expect(isCSAPIFeature(makeFeature(`${SSN_NS}Deployment`))).toBe(true);
  });

  it('returns true for SSN-namespaced System (full URI)', () => {
    expect(isCSAPIFeature(makeFeature(`${SSN_NS}System`))).toBe(true);
  });

  it('returns true for SSN-namespaced types (compact CURIE)', () => {
    expect(isCSAPIFeature(makeFeature('ssn:Deployment'))).toBe(true);
    expect(isCSAPIFeature(makeFeature('ssn:System'))).toBe(true);
  });

  it('returns false for unrecognized SSN local name', () => {
    expect(isCSAPIFeature(makeFeature('ssn:UnknownType'))).toBe(false);
    expect(isCSAPIFeature(makeFeature(`${SSN_NS}UnknownType`))).toBe(false);
  });

  it('returns false for unrecognized SensorML local name', () => {
    expect(
      isCSAPIFeature(makeFeature(`${SENSORML_NS}UnknownThing`))
    ).toBe(false);
  });
});

// ========================================
// getCSAPIResourceType
// ========================================

describe('getCSAPIResourceType', () => {
  it('classifies System subtypes correctly', () => {
    expect(getCSAPIResourceType(makeFeature('sosa:Sensor'))).toBe('System');
    expect(getCSAPIResourceType(makeFeature('sosa:Actuator'))).toBe('System');
    expect(getCSAPIResourceType(makeFeature('sosa:Platform'))).toBe('System');
    expect(getCSAPIResourceType(makeFeature('sosa:Sampler'))).toBe('System');
    expect(getCSAPIResourceType(makeFeature('sosa:System'))).toBe('System');
  });

  it('classifies System subtypes with full URI', () => {
    expect(getCSAPIResourceType(makeFeature(`${SOSA_NS}Sensor`))).toBe('System');
    expect(getCSAPIResourceType(makeFeature(`${SOSA_NS}Platform`))).toBe(
      'System'
    );
  });

  it('classifies Deployment', () => {
    expect(getCSAPIResourceType(makeFeature('sosa:Deployment'))).toBe(
      'Deployment'
    );
    expect(getCSAPIResourceType(makeFeature(`${SOSA_NS}Deployment`))).toBe(
      'Deployment'
    );
  });

  it('classifies Procedure subtypes', () => {
    expect(getCSAPIResourceType(makeFeature('sosa:Procedure'))).toBe(
      'Procedure'
    );
    expect(getCSAPIResourceType(makeFeature('sosa:ObservingProcedure'))).toBe(
      'Procedure'
    );
    expect(getCSAPIResourceType(makeFeature('sosa:SamplingProcedure'))).toBe(
      'Procedure'
    );
    expect(getCSAPIResourceType(makeFeature('sosa:ActuatingProcedure'))).toBe(
      'Procedure'
    );
  });

  it('classifies SamplingFeature', () => {
    expect(getCSAPIResourceType(makeFeature('sosa:SamplingFeature'))).toBe(
      'SamplingFeature'
    );
    expect(getCSAPIResourceType(makeFeature(`${SOSA_NS}Sample`))).toBe(
      'SamplingFeature'
    );
  });

  it('returns null for non-SOSA featureType', () => {
    expect(getCSAPIResourceType(makeFeature('http://example.com/Type'))).toBe(
      null
    );
  });

  it('returns null for non-string featureType', () => {
    expect(
      getCSAPIResourceType({
        type: 'Feature',
        properties: { featureType: 42, uid: 'urn:x:1', name: 'Test' },
      })
    ).toBe(null);
  });

  it('returns null for null input', () => {
    expect(getCSAPIResourceType(null)).toBe(null);
  });

  it('prioritizes System over Procedure for shared SOSA names', () => {
    // The OGC spec ProcedureTypeUris includes System types; our
    // classification gives System priority.
    expect(getCSAPIResourceType(makeFeature('sosa:Sensor'))).toBe('System');
    expect(getCSAPIResourceType(makeFeature('sosa:Platform'))).toBe('System');
  });

  it('classifies SensorML Feature as SamplingFeature', () => {
    expect(
      getCSAPIResourceType(makeFeature(`${SENSORML_NS}Feature`))
    ).toBe('SamplingFeature');
  });

  it('returns null for unrecognized SensorML local name', () => {
    expect(
      getCSAPIResourceType(makeFeature(`${SENSORML_NS}UnknownThing`))
    ).toBe(null);
  });

  it('classifies SSN Deployment (full URI)', () => {
    expect(getCSAPIResourceType(makeFeature(`${SSN_NS}Deployment`))).toBe(
      'Deployment'
    );
  });

  it('classifies SSN System (full URI)', () => {
    expect(getCSAPIResourceType(makeFeature(`${SSN_NS}System`))).toBe(
      'System'
    );
  });

  it('classifies SSN types with compact CURIE prefix', () => {
    expect(getCSAPIResourceType(makeFeature('ssn:Deployment'))).toBe(
      'Deployment'
    );
    expect(getCSAPIResourceType(makeFeature('ssn:System'))).toBe('System');
    expect(getCSAPIResourceType(makeFeature('ssn:Sensor'))).toBe('System');
  });

  it('returns null for unrecognized SSN local name', () => {
    expect(getCSAPIResourceType(makeFeature('ssn:UnknownType'))).toBe(null);
    expect(getCSAPIResourceType(makeFeature(`${SSN_NS}UnknownType`))).toBe(
      null
    );
  });
});

// ========================================
// parseValidTime
// ========================================

describe('parseValidTime', () => {
  const iso = '2026-01-26T18:32:01.560Z';
  const isoEnd = '2027-06-15T00:00:00Z';

  it('parses array format with two ISO dates', () => {
    const result = parseValidTime([iso, isoEnd]);
    expect(result).toBeDefined();
    expect(result!.start).toEqual(new Date(iso));
    expect(result!.end).toEqual(new Date(isoEnd));
  });

  it('parses array format with "now" end sentinel', () => {
    const result = parseValidTime([iso, 'now']);
    expect(result).toBeDefined();
    expect(result!.start).toEqual(new Date(iso));
    expect(result!.end).toBeUndefined();
  });

  it('parses object format with Date instances', () => {
    const start = new Date(iso);
    const end = new Date(isoEnd);
    const result = parseValidTime({ start, end });
    expect(result).toBeDefined();
    expect(result!.start).toBe(start);
    expect(result!.end).toBe(end);
  });

  it('parses object format with string dates', () => {
    const result = parseValidTime({ start: iso, end: isoEnd });
    expect(result).toBeDefined();
    expect(result!.start).toEqual(new Date(iso));
    expect(result!.end).toEqual(new Date(isoEnd));
  });

  it('parses object format with "now" end', () => {
    const result = parseValidTime({ start: iso, end: 'now' });
    expect(result).toBeDefined();
    expect(result!.start).toEqual(new Date(iso));
    expect(result!.end).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(parseValidTime(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(parseValidTime(undefined)).toBeUndefined();
  });

  it('returns undefined for invalid start date string', () => {
    expect(parseValidTime(['not-a-date', 'now'])).toBeUndefined();
  });

  it('returns undefined for invalid end date string', () => {
    expect(parseValidTime([iso, 'not-a-date'])).toBeUndefined();
  });

  it('returns undefined for array with wrong length', () => {
    expect(parseValidTime([iso])).toBeUndefined();
    expect(parseValidTime([iso, isoEnd, 'extra'])).toBeUndefined();
  });

  it('returns undefined for non-string array start', () => {
    expect(parseValidTime([123, 'now'])).toBeUndefined();
  });

  it('returns undefined for object with non-Date non-string start', () => {
    expect(parseValidTime({ start: 123 })).toBeUndefined();
  });

  it('returns undefined for plain string input', () => {
    expect(parseValidTime(iso)).toBeUndefined();
  });
});

// ========================================
// isValidUri
// ========================================

describe('isValidUri', () => {
  it('accepts urn: URIs', () => {
    expect(isValidUri('urn:x-test:feature:1')).toBe(true);
  });

  it('accepts http: and https: URIs', () => {
    expect(isValidUri('http://example.com/thing')).toBe(true);
    expect(isValidUri('https://example.com/thing')).toBe(true);
  });

  it('accepts sosa: CURIEs', () => {
    expect(isValidUri('sosa:Sensor')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidUri('')).toBe(false);
  });

  it('rejects strings without a scheme', () => {
    expect(isValidUri('no-scheme')).toBe(false);
    expect(isValidUri('/relative/path')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidUri(42)).toBe(false);
    expect(isValidUri(null)).toBe(false);
    expect(isValidUri(undefined)).toBe(false);
  });

  it('rejects scheme starting with digit', () => {
    expect(isValidUri('1http://example.com')).toBe(false);
  });
});

// ========================================
// extractCSAPIFeature
// ========================================

describe('extractCSAPIFeature', () => {
  it('extracts a System feature', () => {
    const raw = makeFeature('sosa:Sensor', {
      description: 'A sensor',
      assetType: 'Equipment',
      validTime: ['2026-01-01T00:00:00Z', 'now'],
      geometry: { type: 'Point', coordinates: [1, 2] },
    });
    const result = extractCSAPIFeature(raw);
    expect(result.type).toBe('Feature');
    expect(result.id).toBe('abc123');
    expect(result.properties.featureType).toBe('sosa:Sensor');
    expect(result.properties.uid).toBe('urn:x-test:feature:1');
    expect(result.properties.name).toBe('Test Feature');
    expect(result.properties.description).toBe('A sensor');
    expect((result as any).properties.assetType).toBe('Equipment');
    expect((result as any).properties.validTime).toEqual({
      start: new Date('2026-01-01T00:00:00Z'),
      end: undefined,
    });
  });

  it('extracts a Deployment feature with validTime', () => {
    const raw = makeFeature('sosa:Deployment', {
      validTime: ['2026-01-01T00:00:00Z', '2027-01-01T00:00:00Z'],
    });
    const result = extractCSAPIFeature(raw);
    expect(result.properties.featureType).toBe('sosa:Deployment');
    expect((result as any).properties.validTime).toEqual({
      start: new Date('2026-01-01T00:00:00Z'),
      end: new Date('2027-01-01T00:00:00Z'),
    });
  });

  it('extracts a Procedure feature with null geometry', () => {
    const raw = makeFeature('sosa:Procedure', { geometry: null });
    const result = extractCSAPIFeature(raw);
    expect(result.properties.featureType).toBe('sosa:Procedure');
    expect(result.geometry).toBe(null);
  });

  it('extracts a SamplingFeature', () => {
    const raw = makeFeature('sosa:SamplingFeature', {
      geometry: { type: 'Point', coordinates: [12.31, -86.98, -21] },
      'sampledFeature@link': { href: 'http://example.com/feature/1' },
    });
    const result = extractCSAPIFeature(raw);
    expect(result.properties.featureType).toBe('sosa:SamplingFeature');
    expect(result.geometry).toEqual({
      type: 'Point',
      coordinates: [12.31, -86.98, -21],
    });
    expect((result as any).properties.sampledFeatureLink).toEqual({
      href: 'http://example.com/feature/1',
    });
  });

  it('converts validTime from array format to TimeInterval', () => {
    const raw = makeFeature('sosa:Sensor', {
      validTime: ['2026-01-26T18:32:01.56Z', 'now'],
    });
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.validTime).toEqual({
      start: new Date('2026-01-26T18:32:01.56Z'),
      end: undefined,
    });
  });

  it('omits validTime when not present', () => {
    const raw = makeFeature('sosa:Sensor');
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.validTime).toBeUndefined();
  });

  it('omits description when not present', () => {
    const raw = makeFeature('sosa:Sensor');
    const result = extractCSAPIFeature(raw);
    expect(result.properties.description).toBeUndefined();
  });

  it('preserves links array', () => {
    const links = [
      { rel: 'self', href: 'http://example.com/systems/1', type: 'application/geo+json' },
    ];
    const raw = makeFeature('sosa:Sensor', { links });
    const result = extractCSAPIFeature(raw);
    expect(result.links).toEqual(links);
  });

  it('defaults links to empty array when missing', () => {
    const raw = { ...makeFeature('sosa:Sensor') };
    delete (raw as any).links;
    const result = extractCSAPIFeature(raw);
    expect(result.links).toEqual([]);
  });

  it('extracts a SamplingFeature from SensorML vocabulary', () => {
    const raw = makeFeature(`${SENSORML_NS}Feature`, {
      geometry: { type: 'Point', coordinates: [10.5, 50.2] },
      'sampledFeature@link': { href: 'http://example.com/feature/1' },
    });
    const result = extractCSAPIFeature(raw);
    expect(result.properties.featureType).toBe(
      `${SENSORML_NS}Feature`
    );
    expect(result.properties.uid).toBe('urn:x-test:feature:1');
    expect(result.properties.name).toBe('Test Feature');
    expect(result.geometry).toEqual({
      type: 'Point',
      coordinates: [10.5, 50.2],
    });
  });

  it('extracts SamplingFeature without sampledFeature@link (tolerant extraction)', () => {
    const raw = makeFeature('sosa:SamplingFeature', {
      geometry: { type: 'Point', coordinates: [10.5, 50.2] },
    });
    const result = extractCSAPIFeature(raw);
    expect(result.properties.featureType).toBe('sosa:SamplingFeature');
    expect(result.properties.uid).toBe('urn:x-test:feature:1');
    expect(result.geometry).toEqual({ type: 'Point', coordinates: [10.5, 50.2] });
    expect((result as any).properties.sampledFeatureLink).toBeUndefined();
  });

  it('extracts Deployment without validTime (tolerant extraction)', () => {
    const raw = makeFeature('sosa:Deployment');
    const result = extractCSAPIFeature(raw);
    expect(result.properties.featureType).toBe('sosa:Deployment');
    expect(result.properties.uid).toBe('urn:x-test:feature:1');
  });

  it('extracts a Deployment from SSN namespace (full URI)', () => {
    const raw = makeFeature(`${SSN_NS}Deployment`, {
      validTime: ['2026-01-01T00:00:00Z', '2027-01-01T00:00:00Z'],
    });
    const result = extractCSAPIFeature(raw);
    expect(result.properties.featureType).toBe(`${SSN_NS}Deployment`);
    expect((result as any).properties.validTime).toEqual({
      start: new Date('2026-01-01T00:00:00Z'),
      end: new Date('2027-01-01T00:00:00Z'),
    });
  });

  it('extracts a System from SSN namespace (compact CURIE)', () => {
    const raw = makeFeature('ssn:System', {
      description: 'An SSN system',
    });
    const result = extractCSAPIFeature(raw);
    expect(result.properties.featureType).toBe('ssn:System');
    expect(result.properties.description).toBe('An SSN system');
  });

  it('extracts System with missing uid and name (tolerant extraction)', () => {
    const raw = makeFeature('sosa:Sensor', { uid: '', name: '' });
    const result = extractCSAPIFeature(raw);
    expect(result.properties.featureType).toBe('sosa:Sensor');
  });

  // ========================================
  // @link property extraction
  // ========================================

  it('extracts System with systemKind@link', () => {
    const raw = makeFeature('sosa:Sensor', {
      'systemKind@link': {
        href: 'http://example.com/api/procedures/proc1',
        uid: 'urn:x:procedure:1',
        title: 'Temperature Sensor Procedure',
        rt: 'http://www.w3.org/ns/sosa/Procedure',
      },
    });
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.systemKindLink).toEqual({
      href: 'http://example.com/api/procedures/proc1',
      uid: 'urn:x:procedure:1',
      title: 'Temperature Sensor Procedure',
      rt: 'http://www.w3.org/ns/sosa/Procedure',
    });
  });

  it('extracts System without systemKind@link (tolerant extraction)', () => {
    const raw = makeFeature('sosa:Sensor');
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.systemKindLink).toBeUndefined();
  });

  it('extracts System with systemKind@link containing only href', () => {
    const raw = makeFeature('sosa:System', {
      'systemKind@link': { href: 'http://example.com/procedures/1' },
    });
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.systemKindLink).toEqual({
      href: 'http://example.com/procedures/1',
    });
  });

  it('skips malformed systemKind@link missing href (tolerant extraction)', () => {
    const raw = makeFeature('sosa:Sensor', {
      'systemKind@link': { title: 'No href' },
    });
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.systemKindLink).toBeUndefined();
  });

  it('skips systemKind@link when value is a string (tolerant extraction)', () => {
    const raw = makeFeature('sosa:Sensor', {
      'systemKind@link': 'http://example.com/procedures/1',
    });
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.systemKindLink).toBeUndefined();
  });

  it('extracts Deployment with platform@link and deployedSystems@link', () => {
    const raw = makeFeature('sosa:Deployment', {
      'platform@link': {
        href: 'http://example.com/api/systems/platform1',
        uid: 'urn:x:platform:1',
        title: 'Weather Station',
      },
      'deployedSystems@link': [
        { href: 'http://example.com/api/systems/sensor1', uid: 'urn:x:sensor:1' },
        { href: 'http://example.com/api/systems/sensor2', uid: 'urn:x:sensor:2', title: 'Wind Sensor' },
      ],
    });
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.platformLink).toEqual({
      href: 'http://example.com/api/systems/platform1',
      uid: 'urn:x:platform:1',
      title: 'Weather Station',
    });
    expect((result as any).properties.deployedSystemsLink).toEqual([
      { href: 'http://example.com/api/systems/sensor1', uid: 'urn:x:sensor:1' },
      { href: 'http://example.com/api/systems/sensor2', uid: 'urn:x:sensor:2', title: 'Wind Sensor' },
    ]);
  });

  it('extracts Deployment without @link fields (tolerant extraction)', () => {
    const raw = makeFeature('sosa:Deployment');
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.platformLink).toBeUndefined();
    expect((result as any).properties.deployedSystemsLink).toBeUndefined();
  });

  it('filters malformed entries from deployedSystems@link array', () => {
    const raw = makeFeature('sosa:Deployment', {
      'deployedSystems@link': [
        { href: 'http://example.com/api/systems/sensor1' },
        { title: 'missing href' },
        'not-an-object',
        null,
        { href: 'http://example.com/api/systems/sensor2' },
      ],
    });
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.deployedSystemsLink).toEqual([
      { href: 'http://example.com/api/systems/sensor1' },
      { href: 'http://example.com/api/systems/sensor2' },
    ]);
  });

  it('extracts SamplingFeature with sampledFeature@link containing all fields', () => {
    const raw = makeFeature('sosa:SamplingFeature', {
      geometry: { type: 'Point', coordinates: [10, 50] },
      'sampledFeature@link': {
        href: 'http://example.com/features/river1',
        uid: 'urn:x:feature:river1',
        title: 'Rhine River',
        rt: 'http://example.com/FeatureOfInterest',
      },
    });
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.sampledFeatureLink).toEqual({
      href: 'http://example.com/features/river1',
      uid: 'urn:x:feature:river1',
      title: 'Rhine River',
      rt: 'http://example.com/FeatureOfInterest',
    });
  });

  it('normalizes @link type field to rt (OSH wire format)', () => {
    const raw = makeFeature('sosa:Sensor', {
      'systemKind@link': {
        href: 'http://example.com/api/procedures/proc1',
        uid: 'urn:x:procedure:1',
        type: 'application/geo+json',
      },
    });
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.systemKindLink).toEqual({
      href: 'http://example.com/api/procedures/proc1',
      uid: 'urn:x:procedure:1',
      rt: 'application/geo+json',
    });
  });

  it('prefers rt over type when both are present in @link', () => {
    const raw = makeFeature('sosa:Sensor', {
      'systemKind@link': {
        href: 'http://example.com/api/procedures/proc1',
        rt: 'http://www.w3.org/ns/sosa/Procedure',
        type: 'application/geo+json',
      },
    });
    const result = extractCSAPIFeature(raw);
    expect((result as any).properties.systemKindLink).toEqual({
      href: 'http://example.com/api/procedures/proc1',
      rt: 'http://www.w3.org/ns/sosa/Procedure',
    });
  });

  it('throws for unrecognized featureType', () => {
    const raw = makeFeature('http://example.com/Unknown');
    expect(() => extractCSAPIFeature(raw)).toThrow(
      'unrecognized or missing featureType'
    );
  });

  it('throws for null input', () => {
    expect(() => extractCSAPIFeature(null)).toThrow(
      'unrecognized or missing featureType'
    );
  });

  it('throws for missing featureType', () => {
    const raw = {
      type: 'Feature',
      properties: { uid: 'urn:x:1', name: 'Test' },
    };
    expect(() => extractCSAPIFeature(raw)).toThrow(
      'unrecognized or missing featureType'
    );
  });
});
