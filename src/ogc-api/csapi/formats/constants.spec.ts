import {
  CSAPI_CONTENT_TYPES,
  getContentTypeForResource,
  MEDIA_TYPE_GEOJSON,
  MEDIA_TYPE_JSON,
  MEDIA_TYPE_SENSORML_JSON,
  MEDIA_TYPE_SWE_JSON,
  MEDIA_TYPE_SWE_TEXT,
  MEDIA_TYPE_SWE_CSV,
  MEDIA_TYPE_SWE_BINARY,
  CSAPI_MEDIA_TYPES,
  SOSA_NS,
  SOSA_PREFIX,
  SSN_NS,
  QUDT_NS,
  UCUM_NS,
  CF_NS,
  SystemTypeUris,
  DeploymentTypeUris,
  ProcedureTypeUris,
  SamplingFeatureTypeUris,
  PropertyTypeUris,
  ObservationTypeUris,
  AssetTypes,
} from './constants.js';

// ========================================
// CSAPI_CONTENT_TYPES constant
// ========================================

describe('CSAPI_CONTENT_TYPES', () => {
  it('has exactly 9 entries (one per CSAPIResourceType)', () => {
    expect(Object.keys(CSAPI_CONTENT_TYPES)).toHaveLength(9);
  });

  it.each(['systems', 'deployments', 'procedures', 'samplingFeatures', 'properties'] as const)(
    'maps Part 1 type "%s" to application/geo+json',
    (type) => {
      expect(CSAPI_CONTENT_TYPES[type]).toBe(MEDIA_TYPE_GEOJSON);
    }
  );

  it.each(['datastreams', 'observations', 'controlStreams', 'commands'] as const)(
    'maps Part 2 type "%s" to application/json',
    (type) => {
      expect(CSAPI_CONTENT_TYPES[type]).toBe(MEDIA_TYPE_JSON);
    }
  );
});

// ========================================
// getContentTypeForResource() helper
// ========================================

describe('getContentTypeForResource', () => {
  it('returns application/geo+json for a Part 1 resource', () => {
    expect(getContentTypeForResource('systems')).toBe('application/geo+json');
  });

  it('returns application/json for a Part 2 resource', () => {
    expect(getContentTypeForResource('datastreams')).toBe('application/json');
  });

  it('defaults to application/json for an unrecognized type', () => {
    expect(getContentTypeForResource('unknownType')).toBe('application/json');
  });
});

// ========================================
// CSAPI_MEDIA_TYPES — Value Assertions
// ========================================

describe('CSAPI_MEDIA_TYPES', () => {
  it('contains exactly 7 media type strings', () => {
    expect(CSAPI_MEDIA_TYPES).toHaveLength(7);
  });

  it('includes all expected media types', () => {
    expect(CSAPI_MEDIA_TYPES).toContain(MEDIA_TYPE_GEOJSON);
    expect(CSAPI_MEDIA_TYPES).toContain(MEDIA_TYPE_JSON);
    expect(CSAPI_MEDIA_TYPES).toContain(MEDIA_TYPE_SENSORML_JSON);
    expect(CSAPI_MEDIA_TYPES).toContain(MEDIA_TYPE_SWE_JSON);
    expect(CSAPI_MEDIA_TYPES).toContain(MEDIA_TYPE_SWE_TEXT);
    expect(CSAPI_MEDIA_TYPES).toContain(MEDIA_TYPE_SWE_CSV);
    expect(CSAPI_MEDIA_TYPES).toContain(MEDIA_TYPE_SWE_BINARY);
  });
});

// ========================================
// Resource Type URI Arrays — Value Assertions
// ========================================

describe('Resource Type URI Arrays', () => {
  it('SystemTypeUris contains 10 entries (5 CURIE + 5 full URI)', () => {
    expect(SystemTypeUris).toHaveLength(10);
    expect(SystemTypeUris).toContain('sosa:Sensor');
    expect(SystemTypeUris).toContain('http://www.w3.org/ns/sosa/Sensor');
    expect(SystemTypeUris).toContain('sosa:Platform');
    expect(SystemTypeUris).toContain('sosa:Actuator');
    expect(SystemTypeUris).toContain('sosa:Sampler');
    expect(SystemTypeUris).toContain('sosa:System');
  });

  it('DeploymentTypeUris contains 2 entries', () => {
    expect(DeploymentTypeUris).toHaveLength(2);
    expect(DeploymentTypeUris).toContain('sosa:Deployment');
    expect(DeploymentTypeUris).toContain('http://www.w3.org/ns/sosa/Deployment');
  });

  it('ProcedureTypeUris contains 8 entries (4 CURIE + 4 full URI)', () => {
    expect(ProcedureTypeUris).toHaveLength(8);
    expect(ProcedureTypeUris).toContain('sosa:Procedure');
    expect(ProcedureTypeUris).toContain('http://www.w3.org/ns/sosa/Procedure');
    expect(ProcedureTypeUris).toContain('sosa:ObservingProcedure');
    expect(ProcedureTypeUris).toContain('sosa:ActuatingProcedure');
  });

  it('SamplingFeatureTypeUris contains 2 entries', () => {
    expect(SamplingFeatureTypeUris).toHaveLength(2);
    expect(SamplingFeatureTypeUris).toContain('sosa:SamplingFeature');
    expect(SamplingFeatureTypeUris).toContain('http://www.w3.org/ns/sosa/SamplingFeature');
  });

  it('PropertyTypeUris contains 4 entries (2 CURIE + 2 full URI)', () => {
    expect(PropertyTypeUris).toHaveLength(4);
    expect(PropertyTypeUris).toContain('sosa:ObservableProperty');
    expect(PropertyTypeUris).toContain('http://www.w3.org/ns/sosa/ObservableProperty');
    expect(PropertyTypeUris).toContain('sosa:ActuatableProperty');
    expect(PropertyTypeUris).toContain('http://www.w3.org/ns/sosa/ActuatableProperty');
  });

  it('ObservationTypeUris contains 4 entries (2 CURIE + 2 full URI)', () => {
    expect(ObservationTypeUris).toHaveLength(4);
    expect(ObservationTypeUris).toContain('sosa:Observation');
    expect(ObservationTypeUris).toContain('http://www.w3.org/ns/sosa/Observation');
    expect(ObservationTypeUris).toContain('sosa:ObservationCollection');
    expect(ObservationTypeUris).toContain('http://www.w3.org/ns/sosa/ObservationCollection');
  });
});

// ========================================
// Vocabulary Namespace Constants — Value Assertions
// ========================================

describe('Vocabulary Namespace Constants', () => {
  it('SOSA_NS is the W3C SOSA namespace', () => {
    expect(SOSA_NS).toBe('http://www.w3.org/ns/sosa/');
  });

  it('SOSA_PREFIX is the compact CURIE prefix', () => {
    expect(SOSA_PREFIX).toBe('sosa:');
  });

  it('SSN_NS is the W3C SSN namespace', () => {
    expect(SSN_NS).toBe('http://www.w3.org/ns/ssn/');
  });

  it('QUDT_NS is the QUDT unit vocabulary namespace', () => {
    expect(QUDT_NS).toBe('http://qudt.org/vocab/unit/');
  });

  it('UCUM_NS is the UCUM namespace', () => {
    expect(UCUM_NS).toBe('http://unitsofmeasure.org/');
  });

  it('CF_NS is the CF Standard Names namespace', () => {
    expect(CF_NS).toBe('http://vocab.nerc.ac.uk/standard_name/');
  });

  it('all namespace constants start with http', () => {
    for (const ns of [SOSA_NS, SSN_NS, QUDT_NS, UCUM_NS, CF_NS]) {
      expect(ns).toMatch(/^http/);
    }
  });
});

// ========================================
// AssetTypes — Value Assertions
// ========================================

describe('AssetTypes', () => {
  it('contains exactly 7 asset type strings', () => {
    expect(AssetTypes).toHaveLength(7);
  });

  it('includes all expected asset types', () => {
    expect(AssetTypes).toContain('Equipment');
    expect(AssetTypes).toContain('Human');
    expect(AssetTypes).toContain('LivingThing');
    expect(AssetTypes).toContain('Simulation');
    expect(AssetTypes).toContain('Process');
    expect(AssetTypes).toContain('Group');
    expect(AssetTypes).toContain('Other');
  });
});
