/**
 * SWE Common 3.0 Main Parser.
 *
 * Central orchestrator that discriminates component types, detects
 * encodings, delegates to sub-parsers (simple components, DataRecord,
 * DataArray), and validates parsed structures against DataComponent
 * schema definitions.
 *
 * Entry points:
 * - {@link parseSWEComponent} — parse any SWE Common data component
 * - {@link detectEncoding} — detect encoding from a DataArray structure
 * - {@link validateAgainstSchema} — validate a value against a DataComponent schema
 *
 * Complex component parsers (not covered by dedicated sub-parser files):
 * - {@link parseVector} — positional vector with CRS
 * - {@link parseMatrix} — matrix with reference frame (extends DataArray)
 * - {@link parseDataChoice} — disjoint union of alternatives
 * - {@link parseGeometry} — GeoJSON geometry wrapper
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — OGC SWE Common 3.0
 * @see OAS: AnyComponent (L7606, oneOf *ref_36)
 * @module
 */

import type {
  AnyComponent,
  DataField,
  TypedDataField,
  Vector,
  Matrix,
  DataChoice,
  SweGeometry,
  SweCategory,
  SweQuantity,
  SweQuantityRange,
  SweCount,
  SweCountRange,
  SweText,
  SweCategoryRange,
  DataEncoding,
  DataArray,
  DataRecord,
  GeoJsonGeometry,
  GeometryConstraint,
  GeometryType,
  EncodedValues,
  ElementCount,
  AssociationAttributeGroup,
} from './types.js';

import { parseSimpleComponent, SweCommonParseError } from './components.js';
import { parseDataRecord } from './data-record.js';
import { parseDataArray, parseEncoding } from './data-array.js';
import {
  isRecord,
  parseBaseProperties,
  parseAssociationAttributeGroup,
} from './_helpers.js';

// ========================================
// Validation Interfaces
// ========================================

/**
 * Result of validating an observation value against a DataComponent schema.
 *
 * @see {@link validateAgainstSchema}
 */
export interface ValidationResult {
  /** Whether the value passes all validation checks. */
  valid: boolean;
  /** Validation errors found (empty when valid). */
  errors: ValidationError[];
}

/**
 * A single validation error with path context and machine-readable code.
 */
export interface ValidationError {
  /** JSON path to the problematic value (e.g. `"fields[0].value"`). */
  path: string;
  /** Human-readable error description. */
  message: string;
  /** Machine-readable error code (e.g. `"RANGE_VIOLATION"`, `"TYPE_MISMATCH"`). */
  code: string;
}

// ========================================
// Internal Helpers
// ========================================

// ========================================
// Simple Component Type Set
// ========================================

/**
 * Simple component type discriminators handled by {@link parseSimpleComponent}.
 */
const SIMPLE_COMPONENT_TYPES = new Set([
  'Quantity',
  'Count',
  'Boolean',
  'Text',
  'Time',
  'Category',
  'QuantityRange',
  'CountRange',
  'TimeRange',
  'CategoryRange',
]);

/**
 * All valid SWE Common 3.0 component type discriminators.
 */
const ALL_COMPONENT_TYPES = new Set([
  ...SIMPLE_COMPONENT_TYPES,
  'DataRecord',
  'DataArray',
  'Vector',
  'Matrix',
  'DataChoice',
  'Geometry',
]);

/**
 * Determine whether a raw object is a link reference rather than an
 * inline data component. Link references have `href` but no `type`.
 */
function isLinkReference(json: Record<string, unknown>): boolean {
  return typeof json.href === 'string' && typeof json.type !== 'string';
}

// ========================================
// Field / Item Parser
// ========================================

/**
 * Parse a single named field (SoftNamedProperty) used by Vector
 * coordinates and DataChoice items. Supports link references and
 * inline component delegation via {@link parseSWEComponent}.
 *
 * @param json - Raw JSON object representing one field
 * @param index - Position in the enclosing array (for error context)
 * @param parentType - Name of the parent component (for error messages)
 * @returns Parsed DataField or TypedDataField
 * @throws {SweCommonParseError} If the field is invalid
 */
function parseField(
  json: unknown,
  index: number,
  parentType: string
): DataField | TypedDataField {
  if (!isRecord(json)) {
    throw new SweCommonParseError(
      `${parentType} field at index ${index} must be a non-null object`,
      `fields[${index}]`
    );
  }

  if (typeof json.name !== 'string' || json.name.length === 0) {
    throw new SweCommonParseError(
      `${parentType} field at index ${index} must have a non-empty "name" string`,
      `fields[${index}].name`
    );
  }

  const name: string = json.name;

  // --- Link reference (href without inline type) ---
  if (isLinkReference(json)) {
    const field: DataField = { name };
    if (typeof json.href === 'string')
      (field as Record<string, unknown>).href = json.href;
    if (typeof json.role === 'string')
      (field as Record<string, unknown>).role = json.role;
    if (typeof json.arcrole === 'string')
      (field as Record<string, unknown>).arcrole = json.arcrole;
    if (typeof json.title === 'string')
      (field as Record<string, unknown>).title = json.title;
    return field;
  }

  // --- Inline component ---
  const type = json.type;
  if (typeof type !== 'string') {
    throw new SweCommonParseError(
      `${parentType} field "${name}" must have a "type" property or be a link reference`,
      `fields[${index}].type`
    );
  }

  // Delegate to parseSWEComponent for any recognized type
  if (ALL_COMPONENT_TYPES.has(type)) {
    return {
      name,
      component: parseSWEComponent(json),
    } as TypedDataField;
  }

  throw new SweCommonParseError(
    `${parentType} field "${name}" has unsupported component type: "${type}"`,
    `fields[${index}].type`
  );
}

// ========================================
// Vector Parser
// ========================================

/**
 * Parse a SWE Common 3.0 Vector component.
 *
 * A Vector represents a positional vector in a coordinate reference system.
 * It contains named coordinate components (typically Quantity or Count)
 * and carries a required reference frame URI.
 *
 * @param json - Raw JSON value (expected: `{ type: 'Vector', referenceFrame: '...', coordinates: [...] }`)
 * @returns Parsed Vector
 * @throws {SweCommonParseError} If the input is invalid, `type` is not
 *   `'Vector'`, `referenceFrame` is missing, or `coordinates` is invalid
 *
 * @example
 * ```ts
 * const vec = parseVector({
 *   type: 'Vector',
 *   label: 'Location',
 *   referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4326',
 *   coordinates: [
 *     { name: 'lat', type: 'Quantity', uom: { code: 'deg' }, value: 45.0 },
 *     { name: 'lon', type: 'Quantity', uom: { code: 'deg' }, value: -73.0 },
 *   ],
 * });
 * // vec.type === 'Vector'
 * // vec.referenceFrame === 'http://www.opengis.net/def/crs/EPSG/0/4326'
 * // vec.coordinates.length === 2
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — Vector
 * @see OAS: Vector (L1061, required: type, referenceFrame, label, coordinates)
 */
export function parseVector(json: unknown): Vector {
  if (!isRecord(json)) {
    throw new SweCommonParseError('Vector input must be a non-null object');
  }

  if (json.type !== 'Vector') {
    throw new SweCommonParseError(
      `Expected type "Vector" but received "${String(json.type)}"`,
      'type'
    );
  }

  if (typeof json.referenceFrame !== 'string') {
    throw new SweCommonParseError(
      'Vector requires a "referenceFrame" string property',
      'referenceFrame'
    );
  }

  if (!Array.isArray(json.coordinates) || json.coordinates.length === 0) {
    throw new SweCommonParseError(
      'Vector "coordinates" must be a non-empty array',
      'coordinates'
    );
  }

  const coordinates: DataField[] = (json.coordinates as unknown[]).map(
    (coordJson, index) => parseField(coordJson, index, 'Vector')
  );

  const result: Vector = {
    ...parseBaseProperties(json),
    type: 'Vector',
    referenceFrame: json.referenceFrame as string,
    coordinates,
  };

  if (typeof json.localFrame === 'string') {
    result.localFrame = json.localFrame;
  }

  return result;
}

// ========================================
// Matrix Parser
// ========================================

/**
 * Parse a SWE Common 3.0 Matrix component.
 *
 * A Matrix extends DataArray with spatial reference frame semantics.
 * It inherits all DataArray properties (`elementType`, `elementCount`,
 * `encoding`, `values`) and adds `referenceFrame` and `localFrame`.
 *
 * @param json - Raw JSON value (expected: `{ type: 'Matrix', elementType: {...}, referenceFrame: '...' }`)
 * @returns Parsed Matrix
 * @throws {SweCommonParseError} If the input is invalid, `type` is not
 *   `'Matrix'`, or `elementType` is missing
 *
 * @example
 * ```ts
 * const mat = parseMatrix({
 *   type: 'Matrix',
 *   referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4326',
 *   elementType: {
 *     name: 'row',
 *     type: 'DataRecord',
 *     fields: [
 *       { name: 'c1', type: 'Quantity', uom: { code: '1' } },
 *       { name: 'c2', type: 'Quantity', uom: { code: '1' } },
 *     ],
 *   },
 *   elementCount: { type: 'ElementCount', value: 3 },
 * });
 * // mat.type === 'Matrix'
 * // mat.referenceFrame === 'http://www.opengis.net/def/crs/EPSG/0/4326'
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — Matrix
 * @see OAS: Matrix (L1329, required: type, elementType)
 */
export function parseMatrix(json: unknown): Matrix {
  if (!isRecord(json)) {
    throw new SweCommonParseError('Matrix input must be a non-null object');
  }

  if (json.type !== 'Matrix') {
    throw new SweCommonParseError(
      `Expected type "Matrix" but received "${String(json.type)}"`,
      'type'
    );
  }

  // elementType — required
  if (json.elementType === undefined || json.elementType === null) {
    throw new SweCommonParseError(
      'Matrix requires an "elementType" property',
      'elementType'
    );
  }

  const elementType = parseElementType(json.elementType);

  // elementCount — optional
  const elementCount = parseElementCount(json.elementCount);

  // encoding — optional
  let encoding: DataEncoding | undefined;
  if (json.encoding !== undefined && json.encoding !== null) {
    encoding = parseEncoding(json.encoding);
  }

  // values — optional
  let values: EncodedValues | undefined;
  if (json.values !== undefined && json.values !== null) {
    if (encoding) {
      // Delegate to decodeValues via import, but since we don't import it,
      // for Matrix we store raw — the consumer will decode
      if (Array.isArray(json.values)) {
        values = json.values;
      } else if (
        isRecord(json.values) &&
        typeof (json.values as Record<string, unknown>).href === 'string'
      ) {
        values = parseAssociationAttributeGroup(
          json.values as Record<string, unknown>
        );
      }
    } else if (Array.isArray(json.values)) {
      values = json.values;
    } else if (
      isRecord(json.values) &&
      typeof (json.values as Record<string, unknown>).href === 'string'
    ) {
      values = parseAssociationAttributeGroup(
        json.values as Record<string, unknown>
      );
    }
  }

  const result: Matrix = {
    ...parseBaseProperties(json),
    type: 'Matrix',
    elementType,
  };

  if (elementCount !== undefined) result.elementCount = elementCount;
  if (encoding !== undefined) result.encoding = encoding;
  if (values !== undefined) result.values = values;
  if (typeof json.referenceFrame === 'string')
    result.referenceFrame = json.referenceFrame;
  if (typeof json.localFrame === 'string') result.localFrame = json.localFrame;

  return result;
}

/**
 * Parse the `elementType` property (SoftNamedProperty wrapper).
 * Reused by parseMatrix for its elementType field.
 *
 * @param json - Raw JSON value for elementType
 * @returns Parsed DataField
 * @throws {SweCommonParseError} If invalid or missing name
 */
function parseElementType(json: unknown): DataField {
  if (!isRecord(json)) {
    throw new SweCommonParseError(
      '"elementType" must be a non-null object',
      'elementType'
    );
  }

  if (typeof json.name !== 'string' || json.name.length === 0) {
    throw new SweCommonParseError(
      '"elementType" must have a non-empty "name" string',
      'elementType.name'
    );
  }

  const name: string = json.name;

  // Link reference (href without type)
  if (isLinkReference(json)) {
    const field: DataField = { name };
    if (typeof json.href === 'string')
      (field as Record<string, unknown>).href = json.href;
    if (typeof json.role === 'string')
      (field as Record<string, unknown>).role = json.role;
    if (typeof json.arcrole === 'string')
      (field as Record<string, unknown>).arcrole = json.arcrole;
    if (typeof json.title === 'string')
      (field as Record<string, unknown>).title = json.title;
    return field;
  }

  // Inline component
  const type = json.type;
  if (typeof type !== 'string') {
    throw new SweCommonParseError(
      '"elementType" must have a "type" property or be a link reference',
      'elementType.type'
    );
  }

  if (ALL_COMPONENT_TYPES.has(type)) {
    return { name, component: parseSWEComponent(json) };
  }

  throw new SweCommonParseError(
    `"elementType" has unsupported component type: "${type}"`,
    'elementType.type'
  );
}

/**
 * Parse an `elementCount` property.
 */
function parseElementCount(
  json: unknown
): ElementCount | AssociationAttributeGroup | undefined {
  if (json === undefined || json === null) return undefined;
  if (!isRecord(json)) return undefined;

  // Link reference
  if (typeof json.href === 'string') {
    return parseAssociationAttributeGroup(json);
  }

  // Count component
  const result: ElementCount = { type: 'ElementCount' };
  if (typeof json.value === 'number') result.value = json.value;
  if (typeof json.id === 'string') result.id = json.id;
  if (typeof json.label === 'string') result.label = json.label;
  return result;
}

// ========================================
// DataChoice Parser
// ========================================

/**
 * Parse a SWE Common 3.0 DataChoice component.
 *
 * A DataChoice represents a disjoint union — one of several named
 * alternative data components. Each item in the `items` array is a
 * SoftNamedProperty wrapper around an inline component.
 *
 * @param json - Raw JSON value (expected: `{ type: 'DataChoice', items: [...] }`)
 * @returns Parsed DataChoice
 * @throws {SweCommonParseError} If the input is invalid, `type` is not
 *   `'DataChoice'`, or `items` is missing/empty
 *
 * @example
 * ```ts
 * const choice = parseDataChoice({
 *   type: 'DataChoice',
 *   items: [
 *     { name: 'tempReading', type: 'Quantity', uom: { code: 'Cel' } },
 *     { name: 'statusText', type: 'Text' },
 *   ],
 * });
 * // choice.type === 'DataChoice'
 * // choice.items.length === 2
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — DataChoice
 * @see OAS: DataChoice (L1351, required: type, items)
 */
export function parseDataChoice(json: unknown): DataChoice {
  if (!isRecord(json)) {
    throw new SweCommonParseError('DataChoice input must be a non-null object');
  }

  if (json.type !== 'DataChoice') {
    throw new SweCommonParseError(
      `Expected type "DataChoice" but received "${String(json.type)}"`,
      'type'
    );
  }

  if (!Array.isArray(json.items) || json.items.length === 0) {
    throw new SweCommonParseError(
      'DataChoice "items" must be a non-empty array',
      'items'
    );
  }

  const items: DataField[] = (json.items as unknown[]).map((itemJson, index) =>
    parseField(itemJson, index, 'DataChoice')
  );

  // choiceValue — optional (SweCategory indicating active choice)
  let choiceValue: SweCategory | undefined;
  if (isRecord(json.choiceValue)) {
    choiceValue = parseSimpleComponent({
      ...json.choiceValue,
      type: (json.choiceValue as Record<string, unknown>).type ?? 'Category',
    }) as SweCategory;
  }

  const result: DataChoice = {
    ...parseBaseProperties(json),
    type: 'DataChoice',
    items,
  };

  if (choiceValue !== undefined) result.choiceValue = choiceValue;

  return result;
}

// ========================================
// Geometry Parser
// ========================================

/**
 * Recognized GeoJSON geometry type names.
 */
const GEOJSON_GEOMETRY_TYPES = new Set([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
  'GeometryCollection',
]);

/**
 * Parse a SWE Common 3.0 Geometry component.
 *
 * A Geometry component embeds an ISO 19107 / GeoJSON geometry with a
 * coordinate reference system URI. The `srs` property specifies the
 * spatial reference system.
 *
 * @param json - Raw JSON value (expected: `{ type: 'Geometry', srs: '...' }`)
 * @returns Parsed SweGeometry
 * @throws {SweCommonParseError} If the input is invalid or `type` is not
 *   `'Geometry'`
 *
 * @example
 * ```ts
 * const geom = parseGeometry({
 *   type: 'Geometry',
 *   srs: 'http://www.opengis.net/def/crs/EPSG/0/4326',
 *   value: { type: 'Point', coordinates: [45.0, -73.0] },
 * });
 * // geom.type === 'Geometry'
 * // geom.srs === 'http://www.opengis.net/def/crs/EPSG/0/4326'
 * // geom.value.type === 'Point'
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — Geometry
 * @see OAS: Geometry (L1384, required: type)
 */
export function parseGeometry(json: unknown): SweGeometry {
  if (!isRecord(json)) {
    throw new SweCommonParseError('Geometry input must be a non-null object');
  }

  if (json.type !== 'Geometry') {
    throw new SweCommonParseError(
      `Expected type "Geometry" but received "${String(json.type)}"`,
      'type'
    );
  }

  const result: SweGeometry = {
    ...parseBaseProperties(json),
    type: 'Geometry',
    srs: '',
  };

  // srs — required by spec
  if (typeof json.srs === 'string') {
    result.srs = json.srs;
  }

  // constraint — optional (permitted geometry types)
  if (isRecord(json.constraint)) {
    const constraint: GeometryConstraint = {};
    const raw = json.constraint as Record<string, unknown>;
    if (Array.isArray(raw.geomTypes)) {
      constraint.geomTypes = (raw.geomTypes as string[]).filter(
        (t) => typeof t === 'string'
      ) as GeometryType[];
    }
    result.constraint = constraint;
  }

  // nilValues — optional
  if (Array.isArray(json.nilValues)) {
    result.nilValues = json.nilValues
      .filter(
        (entry: unknown): entry is Record<string, unknown> =>
          isRecord(entry) &&
          typeof (entry as Record<string, unknown>).reason === 'string'
      )
      .map((entry: Record<string, unknown>) => ({
        reason: entry.reason as string,
        value: entry.value as string,
      }));
  }

  // value — optional GeoJSON geometry
  if (
    isRecord(json.value) &&
    typeof (json.value as Record<string, unknown>).type === 'string'
  ) {
    // GeoJsonGeometry has [key: string]: unknown index signature,
    // so a Record<string, unknown> with a string 'type' satisfies it.
    const geo = json.value as Record<string, unknown>;
    const geoResult: GeoJsonGeometry = {
      type: geo.type as string,
    };
    if (geo.coordinates !== undefined) geoResult.coordinates = geo.coordinates;
    if (Array.isArray(geo.geometries))
      geoResult.geometries = geo.geometries as GeoJsonGeometry[];
    // Preserve any additional GeoJSON properties
    for (const key of Object.keys(geo)) {
      if (key !== 'type' && key !== 'coordinates' && key !== 'geometries') {
        geoResult[key] = geo[key];
      }
    }
    result.value = geoResult;
  }

  return result;
}

// ========================================
// Main Component Discriminator
// ========================================

/**
 * Parse any SWE Common 3.0 DataComponent by discriminating on the `type`
 * property and delegating to the appropriate sub-parser.
 *
 * This is the primary entry point for all SWE Common component parsing.
 * It supports all 16 component types defined by the SWE Common 3.0
 * standard:
 *
 * | `type` value | Category | Delegated to |
 * |---|---|---|
 * | `'Quantity'` | Simple scalar | `parseSimpleComponent()` |
 * | `'Count'` | Simple scalar | `parseSimpleComponent()` |
 * | `'Boolean'` | Simple scalar | `parseSimpleComponent()` |
 * | `'Text'` | Simple scalar | `parseSimpleComponent()` |
 * | `'Time'` | Simple scalar | `parseSimpleComponent()` |
 * | `'Category'` | Simple scalar | `parseSimpleComponent()` |
 * | `'QuantityRange'` | Range | `parseSimpleComponent()` |
 * | `'CountRange'` | Range | `parseSimpleComponent()` |
 * | `'TimeRange'` | Range | `parseSimpleComponent()` |
 * | `'CategoryRange'` | Range | `parseSimpleComponent()` |
 * | `'DataRecord'` | Aggregate | `parseDataRecord()` |
 * | `'DataArray'` | Aggregate | `parseDataArray()` |
 * | `'Vector'` | Aggregate | `parseVector()` |
 * | `'Matrix'` | Array | `parseMatrix()` |
 * | `'DataChoice'` | Aggregate | `parseDataChoice()` |
 * | `'Geometry'` | Aggregate | `parseGeometry()` |
 *
 * @param json - Raw JSON value (expected: an object with a string `type` property)
 * @returns Parsed component as the appropriate union member of {@link AnyComponent}
 * @throws {SweCommonParseError} If input is null/undefined/non-object, has no
 *   string `type`, or has an unrecognized `type` value
 *
 * @example
 * ```ts
 * import { parseSWEComponent } from './parser.js';
 *
 * const component = parseSWEComponent({
 *   type: 'Quantity',
 *   uom: { code: 'Cel' },
 *   value: 23.5,
 * });
 * if (component.type === 'Quantity') {
 *   console.log(component.uom.code); // 'Cel'
 * }
 *
 * const record = parseSWEComponent({
 *   type: 'DataRecord',
 *   fields: [
 *     { name: 'temp', type: 'Quantity', uom: { code: 'Cel' } },
 *   ],
 * });
 * if (record.type === 'DataRecord') {
 *   console.log(record.fields.length); // 1
 * }
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — AnyComponent
 * @see OAS: AnyComponent (L7606, oneOf *ref_36)
 */
export function parseSWEComponent(json: unknown): AnyComponent {
  if (!isRecord(json)) {
    throw new SweCommonParseError(
      'SWE Component input must be a non-null object'
    );
  }

  if (typeof json.type !== 'string') {
    throw new SweCommonParseError(
      'SWE Component must have a string "type" property. ' +
        `Valid types: ${[...ALL_COMPONENT_TYPES].join(', ')}`,
      'type'
    );
  }

  switch (json.type) {
    // Simple components (6 scalar + 4 range) — delegate to parseSimpleComponent
    case 'Quantity':
    case 'Count':
    case 'Boolean':
    case 'Text':
    case 'Time':
    case 'Category':
    case 'QuantityRange':
    case 'CountRange':
    case 'TimeRange':
    case 'CategoryRange':
      return parseSimpleComponent(json);

    // Complex components — delegate to dedicated parsers
    case 'DataRecord':
      return parseDataRecord(json, parseSWEComponent);

    case 'DataArray':
      return parseDataArray(json, parseSWEComponent);

    // Complex components parsed in this file
    case 'Vector':
      return parseVector(json);

    case 'Matrix':
      return parseMatrix(json);

    case 'DataChoice':
      return parseDataChoice(json);

    case 'Geometry':
      return parseGeometry(json);

    default:
      throw new SweCommonParseError(
        `Unknown SWE Component type: "${json.type}". ` +
          `Valid types: ${[...ALL_COMPONENT_TYPES].join(', ')}`,
        'type'
      );
  }
}

// ========================================
// Encoding Detection
// ========================================

/**
 * Detect the encoding type from a DataArray or observation result structure.
 *
 * Reads the `encoding` property from the input JSON and delegates to
 * `parseEncoding()` from the DataArray parser for actual parsing.
 * Returns `undefined` when no encoding is present.
 *
 * @param json - Raw JSON value (expected: an object with an optional `encoding` property)
 * @returns Parsed DataEncoding, or `undefined` if no encoding is present
 *
 * @example
 * ```ts
 * // JSON encoding
 * const enc1 = detectEncoding({ encoding: { type: 'JSONEncoding' } });
 * // enc1?.type === 'JSONEncoding'
 *
 * // Text encoding
 * const enc2 = detectEncoding({
 *   encoding: { type: 'TextEncoding', tokenSeparator: ',', blockSeparator: '\\n' }
 * });
 * // enc2?.type === 'TextEncoding'
 *
 * // No encoding
 * const enc3 = detectEncoding({});
 * // enc3 === undefined
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — DataEncoding
 * @see OAS: encodings (L7620-7633)
 */
export function detectEncoding(json: unknown): DataEncoding | undefined {
  if (!isRecord(json)) return undefined;

  const encoding = json.encoding;
  if (encoding === undefined || encoding === null) return undefined;
  if (!isRecord(encoding)) return undefined;

  return parseEncoding(encoding);
}

// ========================================
// Schema Validation
// ========================================

/**
 * Validate a parsed observation result value against a DataStream's SWE
 * Common schema (DataComponent definition).
 *
 * Returns a {@link ValidationResult} indicating success or failure with
 * structured error details. Validation is non-throwing — errors are
 * collected and returned, not thrown as exceptions.
 *
 * **Validation checks performed:**
 * - **Structure match:** Value structure matches schema structure
 * - **Type match:** Value types match component types (number for Quantity,
 *   integer for Count, boolean for Boolean, string for Text/Category/Time)
 * - **Range validation:** Numeric values within AllowedValues ranges
 * - **Token validation:** Category/Text values match AllowedTokens list
 * - **Array dimensions:** Array value count consistent with `elementCount`
 * - **Required fields:** All required schema fields present in values
 *
 * @param value - The observation value to validate
 * @param schema - The DataComponent schema to validate against
 * @returns Validation result with error details
 *
 * @example
 * ```ts
 * import { validateAgainstSchema, parseSWEComponent } from './parser.js';
 *
 * const schema = parseSWEComponent({
 *   type: 'DataRecord',
 *   fields: [
 *     { name: 'temp', type: 'Quantity', uom: { code: 'Cel' }, constraint: { intervals: [[-40, 85]] } },
 *     { name: 'status', type: 'Text' },
 *   ],
 * });
 *
 * // Valid value
 * const ok = validateAgainstSchema({ temp: 23.5, status: 'OK' }, schema);
 * // ok.valid === true, ok.errors === []
 *
 * // Invalid: missing required field
 * const bad = validateAgainstSchema({ temp: 23.5 }, schema);
 * // bad.valid === false, bad.errors[0].code === 'MISSING_FIELD'
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — DataComponent validation
 */
export function validateAgainstSchema(
  value: unknown,
  schema: AnyComponent
): ValidationResult {
  const errors: ValidationError[] = [];
  validateComponent(value, schema, '', errors);
  return { valid: errors.length === 0, errors };
}

/**
 * Recursively validate a value against a data component schema.
 *
 * @param value - The value to validate
 * @param schema - The component schema
 * @param path - Current JSON path for error context
 * @param errors - Accumulator for validation errors
 */
function validateComponent(
  value: unknown,
  schema: AnyComponent,
  path: string,
  errors: ValidationError[]
): void {
  switch (schema.type) {
    case 'DataRecord':
      validateDataRecord(value, schema as DataRecord, path, errors);
      break;

    case 'DataArray':
      validateDataArray(value, schema as DataArray, path, errors);
      break;

    case 'Vector':
      validateVector(value, schema as Vector, path, errors);
      break;

    case 'Matrix':
      validateMatrix(value, schema as Matrix, path, errors);
      break;

    case 'DataChoice':
      validateDataChoice(value, schema as DataChoice, path, errors);
      break;

    case 'Geometry':
      validateGeometry(value, schema as SweGeometry, path, errors);
      break;

    // Simple components (scalar + range)
    case 'Quantity':
    case 'QuantityRange':
      validateNumeric(value, schema, path, errors);
      break;

    case 'Count':
    case 'CountRange':
      validateInteger(value, schema, path, errors);
      break;

    case 'Boolean':
      validateBoolean(value, path, errors);
      break;

    case 'Text':
    case 'Category':
    case 'CategoryRange':
      validateString(value, schema, path, errors);
      break;

    case 'Time':
    case 'TimeRange':
      validateTime(value, path, errors);
      break;

    default:
      // Unknown schema type — cannot validate
      break;
  }
}

// ========================================
// Simple Component Validators
// ========================================

/**
 * Validate a numeric value (Quantity, QuantityRange).
 */
function validateNumeric(
  value: unknown,
  schema: SweQuantity | SweQuantityRange,
  path: string,
  errors: ValidationError[]
): void {
  if (value === undefined || value === null) return; // optional values

  if (schema.type === 'QuantityRange') {
    if (!Array.isArray(value) || value.length !== 2) {
      errors.push({
        path: path || 'value',
        message: 'Expected a 2-element numeric range array',
        code: 'TYPE_MISMATCH',
      });
      return;
    }
    for (let i = 0; i < 2; i++) {
      if (typeof value[i] !== 'number') {
        errors.push({
          path: `${path || 'value'}[${i}]`,
          message: `Expected a number but received ${typeof value[i]}`,
          code: 'TYPE_MISMATCH',
        });
      }
    }
    return;
  }

  if (typeof value !== 'number') {
    errors.push({
      path: path || 'value',
      message: `Expected a number for Quantity but received ${typeof value}`,
      code: 'TYPE_MISMATCH',
    });
    return;
  }

  // Range validation via AllowedValues constraint
  const constraint = schema.constraint;
  if (isRecord(constraint)) {
    validateAllowedValues(value, constraint, path, errors);
  }
}

/**
 * Validate an integer value (Count, CountRange).
 */
function validateInteger(
  value: unknown,
  schema: SweCount | SweCountRange,
  path: string,
  errors: ValidationError[]
): void {
  if (value === undefined || value === null) return;

  if (schema.type === 'CountRange') {
    if (!Array.isArray(value) || value.length !== 2) {
      errors.push({
        path: path || 'value',
        message: 'Expected a 2-element integer range array',
        code: 'TYPE_MISMATCH',
      });
      return;
    }
    for (let i = 0; i < 2; i++) {
      if (typeof value[i] !== 'number' || !Number.isInteger(value[i])) {
        errors.push({
          path: `${path || 'value'}[${i}]`,
          message: `Expected an integer but received ${typeof value[i]}`,
          code: 'TYPE_MISMATCH',
        });
      }
    }
    return;
  }

  if (typeof value !== 'number') {
    errors.push({
      path: path || 'value',
      message: `Expected a number for Count but received ${typeof value}`,
      code: 'TYPE_MISMATCH',
    });
    return;
  }

  if (!Number.isInteger(value)) {
    errors.push({
      path: path || 'value',
      message: `Expected an integer for Count but received ${value}`,
      code: 'TYPE_MISMATCH',
    });
    return;
  }

  const constraint = schema.constraint;
  if (isRecord(constraint)) {
    validateAllowedValues(value, constraint, path, errors);
  }
}

/**
 * Validate a boolean value.
 */
function validateBoolean(
  value: unknown,
  path: string,
  errors: ValidationError[]
): void {
  if (value === undefined || value === null) return;
  if (typeof value !== 'boolean') {
    errors.push({
      path: path || 'value',
      message: `Expected a boolean but received ${typeof value}`,
      code: 'TYPE_MISMATCH',
    });
  }
}

/**
 * Validate a string value (Text, Category, CategoryRange).
 */
function validateString(
  value: unknown,
  schema: SweText | SweCategory | SweCategoryRange,
  path: string,
  errors: ValidationError[]
): void {
  if (value === undefined || value === null) return;

  if (schema.type === 'CategoryRange') {
    if (!Array.isArray(value) || value.length !== 2) {
      errors.push({
        path: path || 'value',
        message: 'Expected a 2-element string range array',
        code: 'TYPE_MISMATCH',
      });
      return;
    }
    for (let i = 0; i < 2; i++) {
      if (typeof value[i] !== 'string') {
        errors.push({
          path: `${path || 'value'}[${i}]`,
          message: `Expected a string but received ${typeof value[i]}`,
          code: 'TYPE_MISMATCH',
        });
      }
    }
    return;
  }

  if (typeof value !== 'string') {
    errors.push({
      path: path || 'value',
      message: `Expected a string for ${
        schema.type
      } but received ${typeof value}`,
      code: 'TYPE_MISMATCH',
    });
    return;
  }

  // Token validation via AllowedTokens constraint
  const constraint = schema.constraint;
  if (isRecord(constraint)) {
    validateAllowedTokens(value, constraint, path, errors);
  }
}

/**
 * Validate a time value (string or number).
 */
function validateTime(
  value: unknown,
  path: string,
  errors: ValidationError[]
): void {
  if (value === undefined || value === null) return;
  if (typeof value !== 'string' && typeof value !== 'number') {
    errors.push({
      path: path || 'value',
      message: `Expected a string or number for Time but received ${typeof value}`,
      code: 'TYPE_MISMATCH',
    });
  }
}

/**
 * Validate a numeric value against AllowedValues constraints.
 */
function validateAllowedValues(
  value: number,
  constraint: Record<string, unknown>,
  path: string,
  errors: ValidationError[]
): void {
  // Check enumerated values
  if (Array.isArray(constraint.values) && constraint.values.length > 0) {
    if (!constraint.values.includes(value)) {
      errors.push({
        path: path || 'value',
        message: `Value ${value} is not in the allowed values list`,
        code: 'RANGE_VIOLATION',
      });
      return;
    }
  }

  // Check interval ranges
  if (Array.isArray(constraint.intervals) && constraint.intervals.length > 0) {
    const inRange = constraint.intervals.some(
      (interval: unknown) =>
        Array.isArray(interval) &&
        interval.length === 2 &&
        typeof interval[0] === 'number' &&
        typeof interval[1] === 'number' &&
        value >= interval[0] &&
        value <= interval[1]
    );
    if (!inRange) {
      errors.push({
        path: path || 'value',
        message: `Value ${value} is outside the allowed range(s)`,
        code: 'RANGE_VIOLATION',
      });
    }
  }
}

/**
 * Validate a string value against AllowedTokens constraints.
 */
function validateAllowedTokens(
  value: string,
  constraint: Record<string, unknown>,
  path: string,
  errors: ValidationError[]
): void {
  if (Array.isArray(constraint.values) && constraint.values.length > 0) {
    if (!constraint.values.includes(value)) {
      errors.push({
        path: path || 'value',
        message: `Value "${value}" is not in the allowed tokens list`,
        code: 'TOKEN_VIOLATION',
      });
    }
  }
  if (typeof constraint.pattern === 'string') {
    try {
      const regex = new RegExp(constraint.pattern);
      if (!regex.test(value)) {
        errors.push({
          path: path || 'value',
          message: `Value "${value}" does not match pattern "${constraint.pattern}"`,
          code: 'TOKEN_VIOLATION',
        });
      }
    } catch {
      errors.push({
        path: path || 'value',
        message: `Schema contains invalid regex pattern: "${constraint.pattern}"`,
        code: 'SCHEMA_ERROR',
      });
    }
  }
}

// ========================================
// Aggregate Component Validators
// ========================================

/**
 * Validate a value against a DataRecord schema.
 * Checks that all schema fields are present and have correct types.
 */
function validateDataRecord(
  value: unknown,
  schema: DataRecord,
  path: string,
  errors: ValidationError[]
): void {
  if (!isRecord(value)) {
    errors.push({
      path: path || 'value',
      message: 'Expected an object for DataRecord value',
      code: 'TYPE_MISMATCH',
    });
    return;
  }

  for (let i = 0; i < schema.fields.length; i++) {
    const field = schema.fields[i];
    const fieldPath = path ? `${path}.${field.name}` : field.name;
    const fieldValue = value[field.name];

    // Check for required fields (fields are required unless marked optional)
    const component = (field as TypedDataField).component;
    if (component) {
      const isOptional = component.optional === true;
      if (fieldValue === undefined && !isOptional) {
        errors.push({
          path: fieldPath,
          message: `Missing required field "${field.name}"`,
          code: 'MISSING_FIELD',
        });
        continue;
      }
      if (fieldValue !== undefined) {
        validateComponent(fieldValue, component, fieldPath, errors);
      }
    }
  }
}

/**
 * Validate a value against a DataArray schema.
 * Checks array structure and element count consistency.
 */
function validateDataArray(
  value: unknown,
  schema: DataArray,
  path: string,
  errors: ValidationError[]
): void {
  if (!Array.isArray(value)) {
    errors.push({
      path: path || 'value',
      message: 'Expected an array for DataArray value',
      code: 'TYPE_MISMATCH',
    });
    return;
  }

  // Check element count consistency
  if (schema.elementCount && isRecord(schema.elementCount)) {
    const expectedCount = (schema.elementCount as Record<string, unknown>)
      .value;
    if (typeof expectedCount === 'number' && value.length !== expectedCount) {
      errors.push({
        path: path || 'value',
        message: `Expected ${expectedCount} elements but received ${value.length}`,
        code: 'ARRAY_DIMENSION_MISMATCH',
      });
    }
  }
}

/**
 * Validate a value against a Vector schema.
 */
function validateVector(
  value: unknown,
  schema: Vector,
  path: string,
  errors: ValidationError[]
): void {
  if (!isRecord(value) && !Array.isArray(value)) {
    errors.push({
      path: path || 'value',
      message: 'Expected an object or array for Vector value',
      code: 'TYPE_MISMATCH',
    });
    return;
  }

  // Vector values may be presented as objects with coordinate names or as arrays
  if (isRecord(value)) {
    for (let i = 0; i < schema.coordinates.length; i++) {
      const coord = schema.coordinates[i];
      const coordPath = path ? `${path}.${coord.name}` : coord.name;
      if (value[coord.name] === undefined) {
        errors.push({
          path: coordPath,
          message: `Missing coordinate field "${coord.name}"`,
          code: 'MISSING_FIELD',
        });
      }
    }
  }
}

/**
 * Validate a value against a Matrix schema.
 */
function validateMatrix(
  value: unknown,
  schema: Matrix,
  path: string,
  errors: ValidationError[]
): void {
  if (!Array.isArray(value)) {
    errors.push({
      path: path || 'value',
      message: 'Expected an array for Matrix value',
      code: 'TYPE_MISMATCH',
    });
    return;
  }

  // Check element count consistency
  if (schema.elementCount && isRecord(schema.elementCount)) {
    const expectedCount = (schema.elementCount as Record<string, unknown>)
      .value;
    if (typeof expectedCount === 'number' && value.length !== expectedCount) {
      errors.push({
        path: path || 'value',
        message: `Expected ${expectedCount} elements but received ${value.length}`,
        code: 'ARRAY_DIMENSION_MISMATCH',
      });
    }
  }
}

/**
 * Validate a value against a DataChoice schema.
 */
function validateDataChoice(
  value: unknown,
  schema: DataChoice,
  path: string,
  errors: ValidationError[]
): void {
  if (!isRecord(value)) {
    errors.push({
      path: path || 'value',
      message: 'Expected an object for DataChoice value',
      code: 'TYPE_MISMATCH',
    });
    return;
  }

  // DataChoice value should have exactly one key matching an item name
  const itemNames = schema.items.map((item) => item.name);
  const valueKeys = Object.keys(value);
  const matchingKeys = valueKeys.filter((k) => itemNames.includes(k));

  if (matchingKeys.length === 0) {
    errors.push({
      path: path || 'value',
      message: `DataChoice value must contain one of: ${itemNames.join(', ')}`,
      code: 'MISSING_FIELD',
    });
  }
}

/**
 * Validate a value against a Geometry schema.
 */
function validateGeometry(
  value: unknown,
  schema: SweGeometry,
  path: string,
  errors: ValidationError[]
): void {
  if (!isRecord(value)) {
    errors.push({
      path: path || 'value',
      message: 'Expected an object for Geometry value',
      code: 'TYPE_MISMATCH',
    });
    return;
  }

  if (typeof value.type !== 'string') {
    errors.push({
      path: path ? `${path}.type` : 'type',
      message: 'Geometry value must have a "type" property',
      code: 'MISSING_FIELD',
    });
    return;
  }

  if (!GEOJSON_GEOMETRY_TYPES.has(value.type)) {
    errors.push({
      path: path ? `${path}.type` : 'type',
      message: `Unrecognized geometry type: "${value.type}"`,
      code: 'TYPE_MISMATCH',
    });
    return;
  }

  // Validate against schema geomTypes constraint
  if (
    schema.constraint?.geomTypes != null &&
    schema.constraint.geomTypes.length > 0 &&
    !(schema.constraint.geomTypes as readonly string[]).includes(value.type)
  ) {
    errors.push({
      path: path ? `${path}.type` : 'type',
      message: `Geometry type "${
        value.type
      }" is not in the allowed types: ${schema.constraint.geomTypes.join(
        ', '
      )}`,
      code: 'CONSTRAINT_VIOLATION',
    });
  }
}
