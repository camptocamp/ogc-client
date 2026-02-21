/**
 * CSAPI Format Handlers — unified entry point.
 *
 * Re-exports all public symbols from the four CSAPI format modules:
 *
 * - **Constants** — Media types, SOSA resource type URIs, vocabulary
 *   namespaces, and asset type enumerations.
 * - **GeoJSON** — CSAPI featureType recognition, property extraction,
 *   and helper utilities for GeoJSON-encoded Part 1 resources.
 * - **SensorML 3.0** — Parser and types for SensorML JSON process
 *   descriptions (SimpleProcess, AggregateProcess, PhysicalComponent,
 *   PhysicalSystem).
 * - **SWE Common 3.0** — Parser and types for SWE Common data
 *   components, encodings, and observation/command value decoding.
 *
 * @example
 * ```ts
 * import {
 *   parseSensorML30,
 *   parseSWEComponent,
 *   MEDIA_TYPE_SWE_JSON,
 *   isCSAPIFeature,
 *   type DataRecord,
 *   type PhysicalSystem,
 * } from './formats/index.js';
 * ```
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html — OGC API Connected Systems Part 1
 * @see https://docs.ogc.org/is/23-002/23-002.html — OGC API Connected Systems Part 2
 * @see https://docs.ogc.org/is/23-000/23-000.html — OGC SensorML 3.0
 * @see https://docs.ogc.org/is/24-014/24-014.html — OGC SWE Common 3.0
 * @module
 */

// ========================================
// Constants — Media Types, Resource URIs, Vocabularies
// ========================================

export {
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
  SystemTypeUris,
  DeploymentTypeUris,
  ProcedureTypeUris,
  SamplingFeatureTypeUris,
  PropertyTypeUris,
  ObservationTypeUris,
  SSN_NS,
  QUDT_NS,
  UCUM_NS,
  CF_NS,
  AssetTypes,
  CSAPI_CONTENT_TYPES,
  getContentTypeForResource,
} from './constants.js';

export type {
  CSAPIMediaType,
  SystemTypeUri,
  DeploymentTypeUri,
  ProcedureTypeUri,
  SamplingFeatureTypeUri,
  PropertyTypeUri,
  ObservationTypeUri,
  AssetType,
} from './constants.js';

// ========================================
// GeoJSON — CSAPI Property Extraction
// ========================================

export {
  SENSORML_NS,
  isCSAPIFeature,
  getCSAPIResourceType,
  parseValidTime,
  isValidUri,
  extractCSAPIFeature,
} from './geojson.js';

export type { CSAPIResourceTypeName } from './geojson.js';

// ========================================
// SensorML 3.0 — Parsers
// ========================================

export {
  parseSensorML30,
  SensorMLParseError,
  parseCapabilityList,
  parseCharacteristicList,
  parseDescribedObjectProperties,
  parseAbstractProcessProperties,
  parseAbstractPhysicalProcessProperties,
  parsePosition,
  SENSORML_PROCESS_TYPES,
} from './sensorml/index.js';

// ========================================
// SensorML 3.0 — Types
// ========================================

// Primitive / utility types
export type { Link } from './sensorml/index.js';
export type { TimePeriod } from './sensorml/index.js';
export type { TimeInstant } from './sensorml/index.js';
export type { TimeInstantOrPeriod } from './sensorml/index.js';
export type { PathRef } from './sensorml/index.js';

// Metadata types
export type { Term } from './sensorml/index.js';
export type { Document } from './sensorml/index.js';
export type { LegalConstraint } from './sensorml/index.js';
export type { SecurityConstraint } from './sensorml/index.js';
export type { ContactInfo } from './sensorml/index.js';
export type { ResponsibleParty } from './sensorml/index.js';
export type { ContactLink } from './sensorml/index.js';
export type { ObservableProperty } from './sensorml/index.js';

// Capability / Characteristic types
export type { AnyProperty } from './sensorml/index.js';
export type { CapabilityList } from './sensorml/index.js';
export type { CharacteristicList } from './sensorml/index.js';

// I/O types
export type { IOComponentChoice } from './sensorml/index.js';
export type { InputList } from './sensorml/index.js';
export type { OutputList } from './sensorml/index.js';
export type { ParameterList } from './sensorml/index.js';

// Process method
export type { ProcessMethod } from './sensorml/index.js';

// Settings types
export type { SettingValue } from './sensorml/index.js';
export type { SettingArrayValue } from './sensorml/index.js';
export type { SettingMode } from './sensorml/index.js';
export type { SetConstraint } from './sensorml/index.js';
export type { SettingStatus } from './sensorml/index.js';
export type { Settings } from './sensorml/index.js';

// Spatial / temporal frame types
export type { FrameAxis } from './sensorml/index.js';
export type { SpatialFrame } from './sensorml/index.js';
export type { TemporalFrame } from './sensorml/index.js';

// Position types
export type { GeoJsonPoint } from './sensorml/index.js';
export type { Pose } from './sensorml/index.js';
export type { Position } from './sensorml/index.js';

// Event / history types
export type { Event } from './sensorml/index.js';
export type { FeatureList } from './sensorml/index.js';

// DescribedObject / AbstractProcess hierarchy
export type { DescribedObject } from './sensorml/index.js';
export type { Mode } from './sensorml/index.js';
export type { AbstractProcess } from './sensorml/index.js';
export type { AbstractPhysicalProcess } from './sensorml/index.js';

// Concrete process types
export type { SimpleProcess } from './sensorml/index.js';
export type { AggregateProcess } from './sensorml/index.js';
export type { PhysicalComponent } from './sensorml/index.js';
export type { PhysicalSystem } from './sensorml/index.js';

// Discriminated union
export type { SensorMLProcess } from './sensorml/index.js';

// Component / connection types
export type { ComponentLink } from './sensorml/index.js';
export type { ComponentEntry } from './sensorml/index.js';
export type { ComponentList } from './sensorml/index.js';
export type { Connection } from './sensorml/index.js';
export type { ConnectionList } from './sensorml/index.js';

// Process type literal union
export type { SensorMLProcessType } from './sensorml/index.js';

// ========================================
// SWE Common 3.0 — Parsers
// ========================================

export {
  parseSWEComponent,
  parseVector,
  parseMatrix,
  parseDataChoice,
  parseGeometry,
  detectEncoding,
  validateAgainstSchema,
} from './swecommon/index.js';

export {
  parseSimpleComponent,
  SweCommonParseError,
  parseUnitOfMeasure,
  parseAllowedValues,
  parseAllowedTokens,
  parseAllowedTimes,
  parseNilValues,
  parseQuality,
} from './swecommon/index.js';

export { parseDataRecord } from './swecommon/index.js';

export {
  parseDataArray,
  parseEncoding,
  decodeValues,
} from './swecommon/index.js';

// ========================================
// SWE Common 3.0 — Types
// ========================================

// Data components
export type {
  AnyComponent,
  AnyScalarComponent,
  AnySimpleComponent,
  SweComponentType,
  DataRecord,
  DataField,
  TypedDataField,
  Vector,
  Matrix,
  DataChoice,
  DataArray,
  SweGeometry,
  SweBoolean,
  SweCount,
  SweQuantity,
  SweText,
  SweCategory,
  SweTime,
  SweCountRange,
  SweQuantityRange,
  SweTimeRange,
  SweCategoryRange,
  ElementCount,
  EncodedValues,
} from './swecommon/index.js';

// Encoding types
export type {
  DataEncoding,
  SweEncodingType,
  JSONEncoding,
  TextEncoding,
  BinaryEncoding,
  XMLEncoding,
  BinaryMember,
  BinaryComponent,
  BinaryBlock,
} from './swecommon/index.js';

// Constraints, UOM, and supporting types
export type {
  UnitOfMeasure,
  AllowedValues,
  AllowedTokens,
  AllowedTimes,
  NilValue,
  NilValuesNumber,
  NilValuesInteger,
  NilValuesText,
  NilValuesTime,
  NumberOrSpecial,
  DateTimeNumberOrSpecial,
  AssociationAttributeGroup,
  GeometryConstraint,
  GeometryType,
  GeoJsonGeometry,
} from './swecommon/index.js';

// Base abstractions
export type {
  AbstractSWE,
  AbstractSweIdentifiable,
  AbstractDataComponent,
  AbstractSimpleComponent,
} from './swecommon/index.js';

// Validation types
export type {
  ValidationResult,
  ValidationError,
} from './swecommon/index.js';

// ========================================
// Response — Collection Envelope Normalization
// ========================================

export { parseCollectionResponse } from './response.js';

export type { CollectionResponse } from './response.js';

// ========================================
// Classification — Endpoint-Context Fallback
// ========================================

export {
  inferResourceTypeFromPath,
  classifyFeature,
} from './classification.js';

// ========================================
// Part 1 — Property Parser
// ========================================

export { parseProperty } from './property.js';

// ========================================
// Part 2 — Resource Parsers
// ========================================

export {
  parseDatastream,
  parseObservation,
  parseControlStream,
  parseCommand,
  parseCommandStatus,
  normalizeStatusCode,
} from './part2.js';

// ========================================
// Schema Response Parsers
// ========================================

export {
  parseDatastreamSchemaResponse,
  parseControlStreamSchemaResponse,
} from './schema-response.js';
