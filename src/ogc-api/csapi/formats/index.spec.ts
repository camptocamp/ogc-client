/**
 * Integration tests for the CSAPI Format Index barrel file.
 *
 * Verifies that all public symbols from the four format modules
 * (constants, geojson, sensorml, swecommon) are accessible from
 * a single import path, and that tree-shaking conventions are followed.
 */

import {
  // --- Constants: Media types ---
  MEDIA_TYPE_GEOJSON,
  MEDIA_TYPE_JSON,
  MEDIA_TYPE_SENSORML_JSON,
  MEDIA_TYPE_SWE_JSON,
  MEDIA_TYPE_SWE_TEXT,
  MEDIA_TYPE_SWE_CSV,
  MEDIA_TYPE_SWE_BINARY,
  CSAPI_MEDIA_TYPES,
  // --- Constants: Namespaces & URIs ---
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
  // --- GeoJSON ---
  SENSORML_NS,
  isCSAPIFeature,
  getCSAPIResourceType,
  parseValidTime,
  isValidUri,
  extractCSAPIFeature,
  // --- SensorML: Parsers ---
  parseSensorML30,
  SensorMLParseError,
  parseCapabilityList,
  parseCharacteristicList,
  parseDescribedObjectProperties,
  parseAbstractProcessProperties,
  parseAbstractPhysicalProcessProperties,
  parsePosition,
  SENSORML_PROCESS_TYPES,
  // --- SWE Common: Parsers ---
  parseSWEComponent,
  parseVector,
  parseMatrix,
  parseDataChoice,
  parseGeometry,
  detectEncoding,
  validateAgainstSchema,
  parseSimpleComponent,
  SweCommonParseError,
  parseUnitOfMeasure,
  parseAllowedValues,
  parseAllowedTokens,
  parseAllowedTimes,
  parseNilValues,
  parseQuality,
  parseDataRecord,
  parseDataArray,
  parseEncoding,
  decodeValues,
  // --- Response ---
  parseCollectionResponse,
  // --- Classification ---
  classifyFeature,
  inferResourceTypeFromPath,
  // --- Part 1: Property Parser ---
  parseProperty,
  // --- Part 2: Resource Parsers ---
  parseDatastream,
  parseObservation,
  parseControlStream,
  parseCommand,
  parseCommandStatus,
  normalizeStatusCode,
  // --- Schema Response Parsers ---
  parseDatastreamSchemaResponse,
  parseControlStreamSchemaResponse,
} from './index.js';

// ========================================
// Constants — Export Accessibility
// ========================================

describe('Format Index — Constants', () => {
  it('exports all media type constants with correct values', () => {
    expect(MEDIA_TYPE_GEOJSON).toBe('application/geo+json');
    expect(MEDIA_TYPE_JSON).toBe('application/json');
    expect(MEDIA_TYPE_SENSORML_JSON).toBe('application/sml+json');
    expect(MEDIA_TYPE_SWE_JSON).toBe('application/swe+json');
    expect(MEDIA_TYPE_SWE_TEXT).toBe('application/swe+text');
    expect(MEDIA_TYPE_SWE_CSV).toBe('application/swe+csv');
    expect(MEDIA_TYPE_SWE_BINARY).toBe('application/swe+binary');
  });

  it('exports CSAPI_MEDIA_TYPES array containing all 7 media types', () => {
    expect(CSAPI_MEDIA_TYPES).toHaveLength(7);
    expect(CSAPI_MEDIA_TYPES).toContain('application/geo+json');
    expect(CSAPI_MEDIA_TYPES).toContain('application/swe+binary');
  });

  it('exports SOSA/SSN namespace constants', () => {
    expect(SOSA_NS).toBe('http://www.w3.org/ns/sosa/');
    expect(SOSA_PREFIX).toBe('sosa:');
    expect(SSN_NS).toBe('http://www.w3.org/ns/ssn/');
  });

  it('exports unit/vocabulary namespace constants', () => {
    expect(QUDT_NS).toBe('http://qudt.org/vocab/unit/');
    expect(UCUM_NS).toBe('http://unitsofmeasure.org/');
    expect(CF_NS).toBe('http://vocab.nerc.ac.uk/standard_name/');
  });

  it('exports resource type URI arrays with both compact and full URI forms', () => {
    expect(SystemTypeUris).toContain('sosa:Sensor');
    expect(SystemTypeUris).toContain('http://www.w3.org/ns/sosa/Sensor');
    expect(DeploymentTypeUris).toContain('sosa:Deployment');
    expect(ProcedureTypeUris).toContain('sosa:Procedure');
    expect(SamplingFeatureTypeUris).toContain('sosa:SamplingFeature');
    expect(PropertyTypeUris).toContain('sosa:ObservableProperty');
    expect(ObservationTypeUris).toContain('sosa:Observation');
  });

  it('exports AssetTypes array', () => {
    expect(AssetTypes).toContain('Equipment');
    expect(AssetTypes).toContain('Human');
    expect(AssetTypes).toHaveLength(7);
  });
});

// ========================================
// GeoJSON — Export Accessibility
// ========================================

describe('Format Index — GeoJSON', () => {
  it('exports SENSORML_NS constant', () => {
    expect(SENSORML_NS).toBe('http://www.opengis.net/sensorml/2.0#');
  });

  it('exports isCSAPIFeature as a callable function', () => {
    expect(typeof isCSAPIFeature).toBe('function');
    expect(isCSAPIFeature({})).toBe(false);
  });

  it('exports getCSAPIResourceType as a callable function', () => {
    expect(typeof getCSAPIResourceType).toBe('function');
    expect(getCSAPIResourceType({})).toBeNull();
  });

  it('exports parseValidTime as a callable function', () => {
    expect(typeof parseValidTime).toBe('function');
    expect(parseValidTime(null)).toBeUndefined();
  });

  it('exports isValidUri as a callable function', () => {
    expect(typeof isValidUri).toBe('function');
    expect(isValidUri('urn:example:test')).toBe(true);
  });

  it('exports extractCSAPIFeature as a callable function', () => {
    expect(typeof extractCSAPIFeature).toBe('function');
  });
});

// ========================================
// SensorML — Export Accessibility
// ========================================

describe('Format Index — SensorML', () => {
  it('exports parseSensorML30 as a callable function', () => {
    expect(typeof parseSensorML30).toBe('function');
  });

  it('exports SensorMLParseError as a constructable class', () => {
    const err = new SensorMLParseError('test');
    expect(err).toBeInstanceOf(SensorMLParseError);
    expect(err.message).toBe('test');
  });

  it('exports sub-parser functions', () => {
    expect(typeof parseCapabilityList).toBe('function');
    expect(typeof parseCharacteristicList).toBe('function');
    expect(typeof parseDescribedObjectProperties).toBe('function');
    expect(typeof parseAbstractProcessProperties).toBe('function');
    expect(typeof parseAbstractPhysicalProcessProperties).toBe('function');
    expect(typeof parsePosition).toBe('function');
  });

  it('exports SENSORML_PROCESS_TYPES array', () => {
    expect(SENSORML_PROCESS_TYPES).toContain('SimpleProcess');
    expect(SENSORML_PROCESS_TYPES).toContain('PhysicalSystem');
    expect(SENSORML_PROCESS_TYPES).toHaveLength(4);
  });
});

// ========================================
// SWE Common — Export Accessibility
// ========================================

describe('Format Index — SWE Common', () => {
  it('exports main parser functions', () => {
    expect(typeof parseSWEComponent).toBe('function');
    expect(typeof parseVector).toBe('function');
    expect(typeof parseMatrix).toBe('function');
    expect(typeof parseDataChoice).toBe('function');
    expect(typeof parseGeometry).toBe('function');
    expect(typeof detectEncoding).toBe('function');
    expect(typeof validateAgainstSchema).toBe('function');
  });

  it('exports SweCommonParseError as a constructable class', () => {
    const err = new SweCommonParseError('test');
    expect(err).toBeInstanceOf(SweCommonParseError);
    expect(err.message).toBe('test');
  });

  it('exports component sub-parser functions', () => {
    expect(typeof parseSimpleComponent).toBe('function');
    expect(typeof parseUnitOfMeasure).toBe('function');
    expect(typeof parseAllowedValues).toBe('function');
    expect(typeof parseAllowedTokens).toBe('function');
    expect(typeof parseAllowedTimes).toBe('function');
    expect(typeof parseNilValues).toBe('function');
    expect(typeof parseQuality).toBe('function');
  });

  it('exports DataRecord and DataArray parsers', () => {
    expect(typeof parseDataRecord).toBe('function');
    expect(typeof parseDataArray).toBe('function');
    expect(typeof parseEncoding).toBe('function');
    expect(typeof decodeValues).toBe('function');
  });
});

// ========================================
// Response — Export Accessibility
// ========================================

describe('Format Index — Response', () => {
  it('exports parseCollectionResponse as a callable function', () => {
    expect(typeof parseCollectionResponse).toBe('function');
  });
});

// ========================================
// Classification — Export Accessibility
// ========================================

describe('Format Index — Classification', () => {
  it('exports classifyFeature as a callable function', () => {
    expect(typeof classifyFeature).toBe('function');
  });

  it('exports inferResourceTypeFromPath as a callable function', () => {
    expect(typeof inferResourceTypeFromPath).toBe('function');
  });
});

// ========================================
// Part 1 — Property Parser Export Accessibility
// ========================================

describe('Format Index — Property Parser', () => {
  it('exports parseProperty as a callable function', () => {
    expect(typeof parseProperty).toBe('function');
  });
});

// ========================================
// Part 2 — Resource Parser Export Accessibility
// ========================================

describe('Format Index — Part 2 Resource Parsers', () => {
  it('exports parseDatastream as a callable function', () => {
    expect(typeof parseDatastream).toBe('function');
  });
  it('exports parseObservation as a callable function', () => {
    expect(typeof parseObservation).toBe('function');
  });
  it('exports parseControlStream as a callable function', () => {
    expect(typeof parseControlStream).toBe('function');
  });
  it('exports parseCommand as a callable function', () => {
    expect(typeof parseCommand).toBe('function');
  });
  it('exports parseCommandStatus as a callable function', () => {
    expect(typeof parseCommandStatus).toBe('function');
  });
  it('exports normalizeStatusCode as a callable function', () => {
    expect(typeof normalizeStatusCode).toBe('function');
  });
});

// ========================================
// Schema Response Parser Export Accessibility
// ========================================

describe('Format Index — Schema Response Parsers', () => {
  it('exports parseDatastreamSchemaResponse as a callable function', () => {
    expect(typeof parseDatastreamSchemaResponse).toBe('function');
  });
  it('exports parseControlStreamSchemaResponse as a callable function', () => {
    expect(typeof parseControlStreamSchemaResponse).toBe('function');
  });
});

// ========================================
// Tree-shaking Friendliness
// ========================================

describe('Format Index — Tree-shaking', () => {
  it('uses only named exports (no default export)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const indexModule = require('./index.js');
    expect(indexModule.default).toBeUndefined();
  });

  it('all exported names are accessible as named properties', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const indexModule = require('./index.js');

    // Spot-check a representative symbol from each source module
    expect(indexModule.MEDIA_TYPE_GEOJSON).toBeDefined();
    expect(indexModule.isCSAPIFeature).toBeDefined();
    expect(indexModule.parseSensorML30).toBeDefined();
    expect(indexModule.parseSWEComponent).toBeDefined();
  });
});
