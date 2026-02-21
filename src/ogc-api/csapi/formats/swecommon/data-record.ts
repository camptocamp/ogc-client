/**
 * SWE Common 3.0 DataRecord Parser.
 *
 * Parses DataRecord structures — ordered sequences of named fields where
 * each field contains an inline SWE Common data component or a link
 * reference. DataRecords may nest recursively (a field's component can
 * itself be a DataRecord).
 *
 * @example
 * ```ts
 * import { parseDataRecord } from './data-record.js';
 *
 * const record = parseDataRecord({
 *   type: 'DataRecord',
 *   label: 'Weather Observation',
 *   fields: [
 *     { name: 'temperature', type: 'Quantity', uom: { code: 'Cel' }, value: 23.5 },
 *     {
 *       name: 'location',
 *       type: 'DataRecord',
 *       fields: [
 *         { name: 'lat', type: 'Quantity', uom: { code: 'deg' }, value: 45.0 },
 *         { name: 'lon', type: 'Quantity', uom: { code: 'deg' }, value: -73.0 },
 *       ],
 *     },
 *   ],
 * });
 * // record.fields[0].name === 'temperature'
 * // record.fields[1].component.fields[0].name === 'lat'  (nested)
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — OGC SWE Common 3.0, DataRecord
 * @see OAS: DataRecord (L7593)
 * @module
 */

import type {
  AnyComponent,
  DataRecord,
  DataField,
  TypedDataField,
} from './types.js';

import { parseSimpleComponent, SweCommonParseError } from './components.js';
import { isRecord, parseBaseProperties } from './_helpers.js';

/**
 * Callback signature for delegating complex component parsing.
 *
 * When provided, `parseField()` delegates unrecognised (non-simple,
 * non-DataRecord) component types to this callback instead of throwing.
 * In practice the callback is `parseSWEComponent` from `parser.ts`,
 * injected to break the circular import.
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — AnyComponent
 */
export type ComponentParser = (json: unknown) => AnyComponent;

// ========================================
// Internal Helpers
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
 * Determine whether a raw field object is a link reference rather than an
 * inline data component. Link references have `href` but no `type`.
 */
function isLinkReference(json: Record<string, unknown>): boolean {
  return typeof json.href === 'string' && typeof json.type !== 'string';
}

// ========================================
// Field Parser
// ========================================

/**
 * Parse a single DataRecord field (SoftNamedProperty + inline component or link).
 *
 * @param json - Raw JSON object representing one field
 * @param index - Position in the fields array (for error context)
 * @param componentParser - Optional callback for complex types (Vector,
 *   DataArray, Matrix, DataChoice, Geometry). When omitted, these types
 *   throw `SweCommonParseError` (backward-compatible default).
 * @returns Parsed DataField or TypedDataField
 * @throws {SweCommonParseError} If the field is missing a `name` or has an
 *   unrecognised component type
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — SoftNamedProperty
 */
function parseField(
  json: unknown,
  index: number,
  componentParser?: ComponentParser
): DataField | TypedDataField {
  if (!isRecord(json)) {
    throw new SweCommonParseError(
      `DataRecord field at index ${index} must be a non-null object`,
      `fields[${index}]`
    );
  }

  if (typeof json.name !== 'string' || json.name.length === 0) {
    throw new SweCommonParseError(
      `DataRecord field at index ${index} must have a non-empty "name" string`,
      `fields[${index}].name`
    );
  }

  const name: string = json.name;

  // --- Link reference (href without inline type) ---
  if (isLinkReference(json)) {
    const field: DataField = { name };
    if (typeof json.href === 'string') field.href = json.href;
    if (typeof json.role === 'string') field.role = json.role;
    if (typeof json.arcrole === 'string') field.arcrole = json.arcrole;
    if (typeof json.title === 'string') field.title = json.title;
    return field;
  }

  // --- Inline component ---
  const type = json.type;
  if (typeof type !== 'string') {
    throw new SweCommonParseError(
      `DataRecord field "${name}" must have a "type" property or be a link reference`,
      `fields[${index}].type`
    );
  }

  // Recursive DataRecord (pass componentParser through for deeply nested records)
  if (type === 'DataRecord') {
    return {
      name,
      component: parseDataRecord(json, componentParser),
    } as TypedDataField;
  }

  // Simple components (Quantity, Count, Boolean, Text, Time, Category, ranges)
  if (SIMPLE_COMPONENT_TYPES.has(type)) {
    return {
      name,
      component: parseSimpleComponent(json),
    } as TypedDataField;
  }

  // Complex types (Vector, DataArray, Matrix, DataChoice, Geometry) —
  // delegate to injected callback when available
  if (componentParser) {
    return {
      name,
      component: componentParser(json),
    } as TypedDataField;
  }

  throw new SweCommonParseError(
    `DataRecord field "${name}" has unsupported component type: "${type}"`,
    `fields[${index}].type`
  );
}

// ========================================
// DataRecord Parser
// ========================================

/**
 * Parse a SWE Common 3.0 DataRecord structure.
 *
 * A DataRecord is an ordered sequence of named fields (ISO-11404 Record
 * datatype). Each field contains either an inline SWE Common DataComponent
 * (simple scalar, range, or nested DataRecord) or a link reference. Field
 * ordering is preserved.
 *
 * @param json - Raw JSON value (expected: `{ type: 'DataRecord', fields: [...] }`)
 * @param componentParser - Optional callback for complex types in fields.
 *   When provided, field types like Vector, DataArray, Matrix, DataChoice,
 *   and Geometry are delegated to this callback instead of throwing.
 * @returns Parsed DataRecord
 * @throws {SweCommonParseError} If the input is invalid, `type` is not
 *   `'DataRecord'`, `fields` is missing/empty, or a field fails validation
 *
 * @example
 * ```ts
 * const rec = parseDataRecord({
 *   type: 'DataRecord',
 *   fields: [
 *     { name: 'temp', type: 'Quantity', uom: { code: 'Cel' }, value: 20 },
 *     { name: 'status', type: 'Text', value: 'OK' },
 *   ],
 * });
 * // rec.type === 'DataRecord'
 * // rec.fields.length === 2
 * // rec.fields[0].name === 'temp'
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — DataRecord
 * @see OAS: DataRecord (L7593), fields array (L531-L544)
 */
export function parseDataRecord(
  json: unknown,
  componentParser?: ComponentParser
): DataRecord {
  if (!isRecord(json)) {
    throw new SweCommonParseError(
      'DataRecord input must be a non-null object'
    );
  }

  if (json.type !== 'DataRecord') {
    throw new SweCommonParseError(
      `Expected type "DataRecord" but received "${String(json.type)}"`,
      'type'
    );
  }

  if (!Array.isArray(json.fields) || json.fields.length === 0) {
    throw new SweCommonParseError(
      'DataRecord "fields" must be a non-empty array',
      'fields'
    );
  }

  const fields: DataField[] = (json.fields as unknown[]).map(
    (fieldJson, index) => parseField(fieldJson, index, componentParser)
  );

  const result: DataRecord = {
    ...parseBaseProperties(json),
    type: 'DataRecord',
    fields,
  };

  return result;
}
