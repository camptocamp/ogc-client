/**
 * OGC SWE Common 3.0 — Public API barrel file.
 *
 * Re-exports all SWE Common parsers, types, and utilities from a single
 * entry point. Uses named exports throughout for tree-shaking friendliness.
 *
 * @example
 * ```ts
 * import {
 *   parseSWEComponent,
 *   validateAgainstSchema,
 *   type AnyComponent,
 *   type DataRecord,
 * } from './formats/swecommon/index.js';
 *
 * const component = parseSWEComponent(rawJson);
 * if (component.type === 'DataRecord') {
 *   const result = validateAgainstSchema(value, component);
 *   console.log(result.valid);
 * }
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — OGC SWE Common 3.0
 * @module
 */

// ========================================
// Types — Data Components
// ========================================

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
} from './types.js';

// ========================================
// Types — Encoding
// ========================================

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
} from './types.js';

// ========================================
// Types — Constraints, UOM, and Supporting
// ========================================

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
} from './types.js';

// ========================================
// Types — Base Abstractions
// ========================================

export type {
  AbstractSWE,
  AbstractSweIdentifiable,
  AbstractDataComponent,
  AbstractSimpleComponent,
} from './types.js';

// ========================================
// Types — Validation
// ========================================

export type { ValidationResult, ValidationError } from './parser.js';

// ========================================
// Main Parser
// ========================================

export {
  parseSWEComponent,
  parseVector,
  parseMatrix,
  parseDataChoice,
  parseGeometry,
  detectEncoding,
  validateAgainstSchema,
} from './parser.js';

// ========================================
// Sub-Parsers
// ========================================

export {
  parseSimpleComponent,
  SweCommonParseError,
  parseUnitOfMeasure,
  parseAllowedValues,
  parseAllowedTokens,
  parseAllowedTimes,
  parseNilValues,
  parseQuality,
} from './components.js';

export { parseDataRecord } from './data-record.js';

export { parseDataArray, parseEncoding, decodeValues } from './data-array.js';
