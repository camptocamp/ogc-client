/**
 * SWE Common 3.0 Simple Component Parsers.
 *
 * Provides parse functions for all 10 SWE Common 3.0 simple component types
 * (6 scalar + 4 range), plus shared helpers for UOM, constraints, NilValues,
 * and quality indicators.
 *
 * Scalar components:
 * - {@link parseQuantity} — continuous numeric with UOM
 * - {@link parseCount} — discrete integer
 * - {@link parseBoolean} — true/false
 * - {@link parseText} — free text
 * - {@link parseTime} — ISO 8601 temporal
 * - {@link parseCategory} — categorical token from code space
 *
 * Range components:
 * - {@link parseQuantityRange} — numeric range with UOM
 * - {@link parseCountRange} — integer range
 * - {@link parseTimeRange} — temporal range
 * - {@link parseCategoryRange} — categorical range
 *
 * Discriminator:
 * - {@link parseSimpleComponent} — dispatches by `type` to the correct parser
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — OGC SWE Common 3.0
 * @see OAS: AnySimpleComponent (L7591)
 * @module
 */

import type {
  AbstractSimpleComponent,
  UnitOfMeasure,
  AllowedValues,
  AllowedTokens,
  AllowedTimes,
  NilValue,
  NumberOrSpecial,
  DateTimeNumberOrSpecial,
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
  AnySimpleComponent,
} from './types.js';
import { isRecord } from './_helpers.js';

// ========================================
// Error Class
// ========================================

/**
 * Error thrown when SWE Common component parsing fails.
 *
 * Provides an optional {@link path} property for JSON-path context.
 *
 * @see SensorMLParseError in `sensorml/errors.ts` for the analogous SensorML error
 */
export class SweCommonParseError extends Error {
  /** JSON path context where the error occurred. */
  path?: string;

  constructor(message: string, path?: string) {
    super(message);
    this.name = 'SweCommonParseError';
    if (path !== undefined) this.path = path;
  }
}

// ========================================
// Shared Constraint & Helper Parsers
// ========================================

/**
 * Parse a UnitOfMeasure (UOM) reference from raw JSON.
 *
 * Extracts `code` (UCUM unit code, e.g. `"Cel"`, `"m/s"`, `"%"`) and/or
 * `href` (URI to unit definition), plus optional `label` and `symbol`.
 *
 * @param json - Raw JSON value (expected to be an object with `code`/`href`)
 * @returns Parsed UnitOfMeasure
 *
 * @example
 * ```ts
 * const uom = parseUnitOfMeasure({ code: 'Cel' });
 * // uom.code === 'Cel'
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — UnitReference
 * @see http://unitsofmeasure.org/ — UCUM codes
 */
export function parseUnitOfMeasure(json: unknown): UnitOfMeasure {
  if (!isRecord(json)) {
    return {};
  }
  const result: UnitOfMeasure = {};
  if (typeof json.code === 'string') result.code = json.code;
  if (typeof json.href === 'string') result.href = json.href;
  if (typeof json.label === 'string') result.label = json.label;
  if (typeof json.symbol === 'string') result.symbol = json.symbol;
  return result;
}

/**
 * Parse an AllowedValues constraint (numeric values and/or intervals).
 *
 * @param json - Raw JSON value
 * @returns Parsed AllowedValues
 *
 * @example
 * ```ts
 * const av = parseAllowedValues({ values: [1, 2, 3], intervals: [[0, 100]] });
 * // av.values === [1, 2, 3]
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — AllowedValues
 * @see OAS: AllowedValues (L7510)
 */
export function parseAllowedValues(json: unknown): AllowedValues {
  if (!isRecord(json)) {
    return {};
  }
  const result: AllowedValues = {};
  if (typeof json.type === 'string') result.type = json.type as 'AllowedValues';
  if (Array.isArray(json.values)) {
    result.values = json.values as NumberOrSpecial[];
  }
  if (Array.isArray(json.intervals)) {
    result.intervals = json.intervals as [NumberOrSpecial, NumberOrSpecial][];
  }
  if (typeof json.significantFigures === 'number') {
    result.significantFigures = json.significantFigures;
  }
  return result;
}

/**
 * Parse an AllowedTokens constraint (enumerated strings or regex pattern).
 *
 * @param json - Raw JSON value
 * @returns Parsed AllowedTokens
 *
 * @example
 * ```ts
 * const at = parseAllowedTokens({ values: ['clear', 'cloudy', 'rain'] });
 * // at.values === ['clear', 'cloudy', 'rain']
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — AllowedTokens
 * @see OAS: AllowedTokens (L7555)
 */
export function parseAllowedTokens(json: unknown): AllowedTokens {
  if (!isRecord(json)) {
    return {};
  }
  const result: AllowedTokens = {};
  if (typeof json.type === 'string') result.type = json.type as 'AllowedTokens';
  if (Array.isArray(json.values)) {
    result.values = json.values as string[];
  }
  if (typeof json.pattern === 'string') {
    result.pattern = json.pattern;
  }
  return result;
}

/**
 * Parse an AllowedTimes constraint (enumerated times and/or time ranges).
 *
 * @param json - Raw JSON value
 * @returns Parsed AllowedTimes
 *
 * @example
 * ```ts
 * const at = parseAllowedTimes({
 *   intervals: [['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z']]
 * });
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — AllowedTimes
 * @see OAS: AllowedTimes (L7543)
 */
export function parseAllowedTimes(json: unknown): AllowedTimes {
  if (!isRecord(json)) {
    return {};
  }
  const result: AllowedTimes = {};
  if (typeof json.type === 'string') result.type = json.type as 'AllowedTimes';
  if (Array.isArray(json.values)) {
    result.values = json.values as DateTimeNumberOrSpecial[];
  }
  if (Array.isArray(json.intervals)) {
    result.intervals =
      json.intervals as [DateTimeNumberOrSpecial, DateTimeNumberOrSpecial][];
  }
  if (typeof json.significantFigures === 'number') {
    result.significantFigures = json.significantFigures;
  }
  return result;
}

/**
 * Parse a NilValues array from raw JSON.
 *
 * Each entry must have a `reason` (URI string) and a `value` (sentinel).
 * Entries without a string `reason` are silently skipped.
 *
 * @param json - Raw JSON value (expected to be an array of `{ reason, value }`)
 * @returns Parsed NilValue array
 *
 * @example
 * ```ts
 * const nv = parseNilValues([
 *   { reason: 'http://www.opengis.net/def/nil/OGC/0/BelowDetectionRange', value: -999 }
 * ]);
 * // nv[0].reason === 'http://...BelowDetectionRange'
 * // nv[0].value === -999
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — NilValues
 */
export function parseNilValues<T = unknown>(json: unknown): NilValue<T>[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((entry): entry is Record<string, unknown> =>
      isRecord(entry) && typeof entry.reason === 'string'
    )
    .map((entry) => ({
      reason: entry.reason as string,
      value: entry.value as T,
    }));
}

/**
 * Parse quality indicators from raw JSON.
 *
 * Quality indicators are inline simple components (e.g. Quantity for accuracy,
 * Category for quality flags) that describe measurement quality.
 *
 * @param json - Raw JSON value (expected to be an array of component objects)
 * @returns Parsed quality indicators as simple components
 *
 * @example
 * ```ts
 * const q = parseQuality([
 *   { type: 'Quantity', definition: 'http://.../accuracy', uom: { code: '%' }, value: 0.5 }
 * ]);
 * // q[0].type === 'Quantity'
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — Quality
 */
export function parseQuality(json: unknown): AnySimpleComponent[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((entry): entry is Record<string, unknown> =>
      isRecord(entry) && typeof entry.type === 'string'
    )
    .map((entry) => parseSimpleComponent(entry));
}

// ========================================
// Base Property Extraction
// ========================================

/**
 * Extract properties common to all AbstractSimpleComponent subtypes.
 *
 * Extracts: `id`, `label`, `description`, `definition`, `updatable`,
 * `optional`, `referenceFrame`, `axisID`.
 */
// Return type narrowed from Record<string, unknown> to Partial<AbstractSimpleComponent>
// to enable type-safe construction in component parsers (Issue #72).
function parseBaseProperties(json: Record<string, unknown>): Partial<AbstractSimpleComponent> {
  const result: Partial<AbstractSimpleComponent> = {};
  if (typeof json.id === 'string') result.id = json.id;
  if (typeof json.label === 'string') result.label = json.label;
  if (typeof json.description === 'string') result.description = json.description;
  if (typeof json.definition === 'string') result.definition = json.definition;
  if (typeof json.updatable === 'boolean') result.updatable = json.updatable;
  if (typeof json.optional === 'boolean') result.optional = json.optional;
  if (typeof json.referenceFrame === 'string') result.referenceFrame = json.referenceFrame;
  if (typeof json.axisID === 'string') result.axisID = json.axisID;
  return result;
}

// ========================================
// Scalar Component Parsers
// ========================================

/**
 * Parse a Quantity component — continuous numeric value with unit of measure.
 *
 * @param json - Raw JSON value
 * @returns Parsed SweQuantity
 * @throws {SweCommonParseError} If input is not a valid object
 *
 * @example
 * ```ts
 * const qty = parseQuantity({
 *   type: 'Quantity',
 *   uom: { code: 'Cel' },
 *   value: 23.5
 * });
 * // qty.uom.code === 'Cel'
 * // qty.value === 23.5
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — Quantity
 * @see OAS: Quantity (L7530)
 */
export function parseQuantity(json: unknown): SweQuantity {
  if (!isRecord(json)) {
    throw new SweCommonParseError('Quantity input must be a non-null object');
  }
  const result: SweQuantity = {
    ...parseBaseProperties(json),
    type: 'Quantity',
    uom: parseUnitOfMeasure(json.uom),
  };
  if (json.constraint !== undefined) {
    result.constraint = parseAllowedValues(json.constraint);
  }
  if (Array.isArray(json.nilValues)) {
    result.nilValues = parseNilValues<NumberOrSpecial>(json.nilValues);
  }
  if (typeof json.value === 'number') {
    result.value = json.value;
  }
  return result;
}

/**
 * Parse a Count component — discrete integer value.
 *
 * @param json - Raw JSON value
 * @returns Parsed SweCount
 * @throws {SweCommonParseError} If input is not a valid object
 *
 * @example
 * ```ts
 * const cnt = parseCount({ type: 'Count', value: 42 });
 * // cnt.value === 42
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — Count
 * @see OAS: Count (L7516)
 */
export function parseCount(json: unknown): SweCount {
  if (!isRecord(json)) {
    throw new SweCommonParseError('Count input must be a non-null object');
  }
  const result: SweCount = {
    ...parseBaseProperties(json),
    type: 'Count',
  };
  if (json.constraint !== undefined) {
    result.constraint = parseAllowedValues(json.constraint);
  }
  if (Array.isArray(json.nilValues)) {
    result.nilValues = parseNilValues<number>(json.nilValues);
  }
  if (typeof json.value === 'number') {
    result.value = json.value;
  }
  return result;
}

/**
 * Parse a Boolean component — true/false value.
 *
 * The simplest scalar component — no constraints, no UOM.
 *
 * @param json - Raw JSON value
 * @returns Parsed SweBoolean
 * @throws {SweCommonParseError} If input is not a valid object
 *
 * @example
 * ```ts
 * const b = parseBoolean({ type: 'Boolean', value: true });
 * // b.value === true
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — Boolean
 * @see OAS: Boolean (L7500)
 */
export function parseBoolean(json: unknown): SweBoolean {
  if (!isRecord(json)) {
    throw new SweCommonParseError('Boolean input must be a non-null object');
  }
  const result: SweBoolean = {
    ...parseBaseProperties(json),
    type: 'Boolean',
  };
  if (typeof json.value === 'boolean') {
    result.value = json.value;
  }
  return result;
}

/**
 * Parse a Text component — free text value.
 *
 * @param json - Raw JSON value
 * @returns Parsed SweText
 * @throws {SweCommonParseError} If input is not a valid object
 *
 * @example
 * ```ts
 * const t = parseText({ type: 'Text', value: 'Station Alpha' });
 * // t.value === 'Station Alpha'
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — Text
 * @see OAS: Text (L7564)
 */
export function parseText(json: unknown): SweText {
  if (!isRecord(json)) {
    throw new SweCommonParseError('Text input must be a non-null object');
  }
  const result: SweText = {
    ...parseBaseProperties(json),
    type: 'Text',
  };
  if (json.constraint !== undefined) {
    result.constraint = parseAllowedTokens(json.constraint);
  }
  if (Array.isArray(json.nilValues)) {
    result.nilValues = parseNilValues<string>(json.nilValues);
  }
  if (typeof json.value === 'string') {
    result.value = json.value;
  }
  return result;
}

/**
 * Parse a Time component — ISO 8601 temporal value.
 *
 * @param json - Raw JSON value
 * @returns Parsed SweTime
 * @throws {SweCommonParseError} If input is not a valid object
 *
 * @example
 * ```ts
 * const t = parseTime({
 *   type: 'Time',
 *   uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' },
 *   value: '2024-06-15T12:00:00Z'
 * });
 * // t.value === '2024-06-15T12:00:00Z'
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — Time
 * @see OAS: Time (L7546)
 */
export function parseTime(json: unknown): SweTime {
  if (!isRecord(json)) {
    throw new SweCommonParseError('Time input must be a non-null object');
  }
  const result: SweTime = {
    ...parseBaseProperties(json),
    type: 'Time',
    uom: parseUnitOfMeasure(json.uom),
  };
  if (typeof json.referenceTime === 'string') {
    result.referenceTime = json.referenceTime;
  }
  if (typeof json.localFrame === 'string') {
    result.localFrame = json.localFrame;
  }
  if (json.constraint !== undefined) {
    result.constraint = parseAllowedTimes(json.constraint);
  }
  if (Array.isArray(json.nilValues)) {
    result.nilValues = parseNilValues<DateTimeNumberOrSpecial>(json.nilValues);
  }
  if (typeof json.value === 'string' || typeof json.value === 'number') {
    result.value = json.value;
  }
  return result;
}

/**
 * Parse a Category component — categorical token from a code space.
 *
 * @param json - Raw JSON value
 * @returns Parsed SweCategory
 * @throws {SweCommonParseError} If input is not a valid object
 *
 * @example
 * ```ts
 * const c = parseCategory({
 *   type: 'Category',
 *   codeSpace: 'http://example.org/weather-conditions',
 *   value: 'clear'
 * });
 * // c.codeSpace === 'http://example.org/weather-conditions'
 * // c.value === 'clear'
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — Category
 * @see OAS: Category (L7559)
 */
export function parseCategory(json: unknown): SweCategory {
  if (!isRecord(json)) {
    throw new SweCommonParseError('Category input must be a non-null object');
  }
  const result: SweCategory = {
    ...parseBaseProperties(json),
    type: 'Category',
  };
  if (typeof json.codeSpace === 'string') {
    result.codeSpace = json.codeSpace;
  }
  if (json.constraint !== undefined) {
    result.constraint = parseAllowedTokens(json.constraint);
  }
  if (Array.isArray(json.nilValues)) {
    result.nilValues = parseNilValues<string>(json.nilValues);
  }
  if (typeof json.value === 'string') {
    result.value = json.value;
  }
  return result;
}

// ========================================
// Range Component Parsers
// ========================================

/**
 * Parse a QuantityRange component — numeric range with unit of measure.
 *
 * @param json - Raw JSON value
 * @returns Parsed SweQuantityRange
 * @throws {SweCommonParseError} If input is not a valid object
 *
 * @example
 * ```ts
 * const qr = parseQuantityRange({
 *   type: 'QuantityRange',
 *   uom: { code: 'Cel' },
 *   value: [-40, 85]
 * });
 * // qr.value === [-40, 85]
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — QuantityRange
 * @see OAS: QuantityRange (L7576)
 */
export function parseQuantityRange(json: unknown): SweQuantityRange {
  if (!isRecord(json)) {
    throw new SweCommonParseError('QuantityRange input must be a non-null object');
  }
  const result: SweQuantityRange = {
    ...parseBaseProperties(json),
    type: 'QuantityRange',
    uom: parseUnitOfMeasure(json.uom),
  };
  if (json.constraint !== undefined) {
    result.constraint = parseAllowedValues(json.constraint);
  }
  if (Array.isArray(json.nilValues)) {
    result.nilValues = parseNilValues<NumberOrSpecial>(json.nilValues);
  }
  if (Array.isArray(json.value) && json.value.length === 2) {
    result.value = json.value as [NumberOrSpecial, NumberOrSpecial];
  }
  return result;
}

/**
 * Parse a CountRange component — integer range.
 *
 * @param json - Raw JSON value
 * @returns Parsed SweCountRange
 * @throws {SweCommonParseError} If input is not a valid object
 *
 * @example
 * ```ts
 * const cr = parseCountRange({ type: 'CountRange', value: [0, 255] });
 * // cr.value === [0, 255]
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — CountRange
 * @see OAS: CountRange (L7571)
 */
export function parseCountRange(json: unknown): SweCountRange {
  if (!isRecord(json)) {
    throw new SweCommonParseError('CountRange input must be a non-null object');
  }
  const result: SweCountRange = {
    ...parseBaseProperties(json),
    type: 'CountRange',
  };
  if (json.constraint !== undefined) {
    result.constraint = parseAllowedValues(json.constraint);
  }
  if (Array.isArray(json.nilValues)) {
    result.nilValues = parseNilValues<string>(json.nilValues);
  }
  if (Array.isArray(json.value) && json.value.length === 2) {
    result.value = json.value as [number, number];
  }
  return result;
}

/**
 * Parse a TimeRange component — temporal range.
 *
 * @param json - Raw JSON value
 * @returns Parsed SweTimeRange
 * @throws {SweCommonParseError} If input is not a valid object
 *
 * @example
 * ```ts
 * const tr = parseTimeRange({
 *   type: 'TimeRange',
 *   uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' },
 *   value: ['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z']
 * });
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — TimeRange
 * @see OAS: TimeRange (L7581)
 */
export function parseTimeRange(json: unknown): SweTimeRange {
  if (!isRecord(json)) {
    throw new SweCommonParseError('TimeRange input must be a non-null object');
  }
  const result: SweTimeRange = {
    ...parseBaseProperties(json),
    type: 'TimeRange',
    uom: parseUnitOfMeasure(json.uom),
  };
  if (typeof json.referenceTime === 'string') {
    result.referenceTime = json.referenceTime;
  }
  if (typeof json.localFrame === 'string') {
    result.localFrame = json.localFrame;
  }
  if (json.constraint !== undefined) {
    result.constraint = parseAllowedTimes(json.constraint);
  }
  if (Array.isArray(json.nilValues)) {
    result.nilValues = parseNilValues<DateTimeNumberOrSpecial>(json.nilValues);
  }
  if (Array.isArray(json.value) && json.value.length === 2) {
    result.value = json.value as [DateTimeNumberOrSpecial, DateTimeNumberOrSpecial];
  }
  return result;
}

/**
 * Parse a CategoryRange component — categorical range in an ordinal reference system.
 *
 * @param json - Raw JSON value
 * @returns Parsed SweCategoryRange
 * @throws {SweCommonParseError} If input is not a valid object
 *
 * @example
 * ```ts
 * const cr = parseCategoryRange({
 *   type: 'CategoryRange',
 *   codeSpace: 'http://example.org/quality-levels',
 *   value: ['low', 'high']
 * });
 * // cr.value === ['low', 'high']
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — CategoryRange
 * @see OAS: CategoryRange (L7586)
 */
export function parseCategoryRange(json: unknown): SweCategoryRange {
  if (!isRecord(json)) {
    throw new SweCommonParseError('CategoryRange input must be a non-null object');
  }
  const result: SweCategoryRange = {
    ...parseBaseProperties(json),
    type: 'CategoryRange',
  };
  if (typeof json.codeSpace === 'string') {
    result.codeSpace = json.codeSpace;
  }
  if (json.constraint !== undefined) {
    result.constraint = parseAllowedTokens(json.constraint);
  }
  if (Array.isArray(json.nilValues)) {
    result.nilValues = parseNilValues<string>(json.nilValues);
  }
  if (Array.isArray(json.value) && json.value.length === 2) {
    result.value = json.value as [string, string];
  }
  return result;
}

// ========================================
// Discriminator
// ========================================

/**
 * Parse any SWE Common simple component by reading its `type` discriminator
 * and dispatching to the correct individual parser.
 *
 * Supports all 10 simple component types:
 * - Scalar: `Quantity`, `Count`, `Boolean`, `Text`, `Time`, `Category`
 * - Range: `QuantityRange`, `CountRange`, `TimeRange`, `CategoryRange`
 *
 * @param json - Raw JSON value
 * @returns A discriminated union member of {@link AnySimpleComponent}
 * @throws {SweCommonParseError} If input is not an object, has no string `type`,
 *   or has an unrecognized `type` value
 *
 * @example
 * ```ts
 * const component = parseSimpleComponent({
 *   type: 'Quantity',
 *   uom: { code: 'm/s' },
 *   value: 12.3
 * });
 * if (component.type === 'Quantity') {
 *   console.log(component.uom.code); // 'm/s'
 * }
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — AnySimpleComponent
 * @see OAS: AnySimpleComponent (L7591)
 */
export function parseSimpleComponent(json: unknown): AnySimpleComponent {
  if (!isRecord(json)) {
    throw new SweCommonParseError(
      'Simple component input must be a non-null object'
    );
  }
  if (typeof json.type !== 'string') {
    throw new SweCommonParseError(
      'Simple component must have a string "type" property',
      'type'
    );
  }

  switch (json.type) {
    case 'Quantity':
      return parseQuantity(json);
    case 'Count':
      return parseCount(json);
    case 'Boolean':
      return parseBoolean(json);
    case 'Text':
      return parseText(json);
    case 'Time':
      return parseTime(json);
    case 'Category':
      return parseCategory(json);
    case 'QuantityRange':
      return parseQuantityRange(json);
    case 'CountRange':
      return parseCountRange(json);
    case 'TimeRange':
      return parseTimeRange(json);
    case 'CategoryRange':
      return parseCategoryRange(json);
    default:
      throw new SweCommonParseError(
        `Unknown simple component type: "${json.type}"`,
        'type'
      );
  }
}
