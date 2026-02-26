/**
 * SWE Common 3.0 DataArray Parser.
 *
 * Parses DataArray structures — homogeneous arrays of data components with
 * a named element type, optional element count, encoding specification,
 * and an encoded values block. Supports three primary encodings: JSON,
 * Text, and Binary, plus recognition of XMLEncoding.
 *
 * @example
 * ```ts
 * import { parseDataArray } from './data-array.js';
 *
 * const arr = parseDataArray({
 *   type: 'DataArray',
 *   elementType: {
 *     name: 'temperature',
 *     type: 'Quantity',
 *     uom: { code: 'Cel' },
 *   },
 *   elementCount: { type: 'ElementCount', value: 3 },
 *   encoding: { type: 'JSONEncoding' },
 *   values: [23.5, 24.1, 22.8],
 * });
 * // arr.type === 'DataArray'
 * // arr.elementType.name === 'temperature'
 * // arr.values === [23.5, 24.1, 22.8]
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — OGC SWE Common 3.0, DataArray
 * @see OAS: DataArray (L7638), encodings (L1138-1300), values (L1304-1310)
 * @module
 */

import type {
  DataArray,
  DataField,
  DataEncoding,
  TextEncoding,
  JSONEncoding,
  BinaryEncoding,
  XMLEncoding,
  BinaryMember,
  BinaryComponent,
  BinaryBlock,
  ElementCount,
  EncodedValues,
  AssociationAttributeGroup,
} from './types.js';

import { parseSimpleComponent, SweCommonParseError } from './components.js';
import { parseDataRecord } from './data-record.js';
import type { ComponentParser } from './data-record.js';
import {
  isRecord,
  parseBaseProperties,
  parseAssociationAttributeGroup,
} from './_helpers.js';

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
 * Determine whether a raw object is a link reference rather than an
 * inline data component. Link references have `href` but no `type`.
 */
function isLinkReference(json: Record<string, unknown>): boolean {
  return typeof json.href === 'string' && typeof json.type !== 'string';
}

// ========================================
// Element Type Parser
// ========================================

/**
 * Parse the `elementType` property (SoftNamedProperty wrapper).
 *
 * @param json - Raw JSON value for elementType
 * @param componentParser - Optional callback for complex types (Vector,
 *   Matrix, DataChoice, Geometry). When omitted, these types throw.
 * @returns Parsed DataField
 * @throws {SweCommonParseError} If invalid or missing name
 *
 * @see OAS: SoftNamedProperty (L1127-1136)
 */
function parseElementType(
  json: unknown,
  componentParser?: ComponentParser
): DataField {
  if (!isRecord(json)) {
    throw new SweCommonParseError(
      'DataArray "elementType" must be a non-null object',
      'elementType'
    );
  }

  if (typeof json.name !== 'string' || json.name.length === 0) {
    throw new SweCommonParseError(
      'DataArray "elementType" must have a non-empty "name" string',
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
      'DataArray "elementType" must have a "type" property or be a link reference',
      'elementType.type'
    );
  }

  // Recursive DataRecord (pass componentParser through)
  if (type === 'DataRecord') {
    return { name, component: parseDataRecord(json, componentParser) };
  }

  // Recursive DataArray (pass componentParser through)
  if (type === 'DataArray') {
    return { name, component: parseDataArray(json, componentParser) };
  }

  // Simple components
  if (SIMPLE_COMPONENT_TYPES.has(type)) {
    return { name, component: parseSimpleComponent(json) };
  }

  // Complex types (Vector, Matrix, DataChoice, Geometry) —
  // delegate to injected callback when available
  if (componentParser) {
    return { name, component: componentParser(json) };
  }

  throw new SweCommonParseError(
    `DataArray "elementType" has unsupported component type: "${type}"`,
    'elementType.type'
  );
}

// ========================================
// Element Count Parser
// ========================================

/**
 * Parse the `elementCount` property.
 *
 * May be either a Count-like component `{ type: 'ElementCount', value: N }`
 * or a link reference `{ href: '...' }`.
 *
 * @param json - Raw JSON value for elementCount
 * @returns Parsed ElementCount or AssociationAttributeGroup, or undefined
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
// Encoding Parsers
// ========================================

/**
 * Parse a BinaryMember (Component or Block) from raw JSON.
 *
 * @param json - Raw JSON value
 * @param index - Position in members array (for error context)
 * @returns Parsed BinaryMember
 * @throws {SweCommonParseError} If invalid
 */
function parseBinaryMember(json: unknown, index: number): BinaryMember {
  if (!isRecord(json)) {
    throw new SweCommonParseError(
      `BinaryEncoding member at index ${index} must be a non-null object`,
      `encoding.members[${index}]`
    );
  }

  const type = json.type;
  if (type === 'Component') {
    if (typeof json.ref !== 'string') {
      throw new SweCommonParseError(
        `BinaryEncoding Component member at index ${index} must have a "ref" string`,
        `encoding.members[${index}].ref`
      );
    }
    if (typeof json.dataType !== 'string') {
      throw new SweCommonParseError(
        `BinaryEncoding Component member at index ${index} must have a "dataType" string`,
        `encoding.members[${index}].dataType`
      );
    }
    // Required fields ref and dataType are validated above (Issue #74).
    const member: BinaryComponent = {
      type: 'Component',
      ref: json.ref as string,
      dataType: json.dataType as string,
    };
    if (typeof json.encryption === 'string')
      member.encryption = json.encryption;
    if (typeof json.significantBits === 'number')
      member.significantBits = json.significantBits;
    if (typeof json.bitLength === 'number') member.bitLength = json.bitLength;
    if (typeof json.byteLength === 'number')
      member.byteLength = json.byteLength;
    return member;
  }

  if (type === 'Block') {
    if (typeof json.ref !== 'string') {
      throw new SweCommonParseError(
        `BinaryEncoding Block member at index ${index} must have a "ref" string`,
        `encoding.members[${index}].ref`
      );
    }
    // Required field ref is validated above (Issue #74).
    const member: BinaryBlock = {
      type: 'Block',
      ref: json.ref as string,
    };
    if (typeof json.compression === 'string')
      member.compression = json.compression;
    if (typeof json.encryption === 'string')
      member.encryption = json.encryption;
    if (typeof json['paddingBytes-before'] === 'number') {
      member['paddingBytes-before'] = json['paddingBytes-before'];
    }
    if (typeof json['paddingBytes-after'] === 'number') {
      member['paddingBytes-after'] = json['paddingBytes-after'];
    }
    if (typeof json.byteLength === 'number')
      member.byteLength = json.byteLength;
    return member;
  }

  throw new SweCommonParseError(
    `BinaryEncoding member at index ${index} has unrecognized type: "${String(
      type
    )}"`,
    `encoding.members[${index}].type`
  );
}

/**
 * Parse a SWE Common 3.0 DataEncoding specification.
 *
 * Supports four encoding types: JSONEncoding, TextEncoding,
 * BinaryEncoding, and XMLEncoding (recognition only).
 *
 * @param json - Raw JSON value for the encoding object
 * @returns Parsed DataEncoding
 * @throws {SweCommonParseError} If the encoding is invalid or has missing
 *   required properties
 *
 * @example
 * ```ts
 * const enc = parseEncoding({ type: 'TextEncoding', tokenSeparator: ',', blockSeparator: '\\n' });
 * // enc.type === 'TextEncoding'
 * // enc.tokenSeparator === ','
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — DataEncoding
 * @see OAS: encodings (L1138-1300)
 */
export function parseEncoding(json: unknown): DataEncoding {
  if (!isRecord(json)) {
    throw new SweCommonParseError(
      'DataEncoding must be a non-null object',
      'encoding'
    );
  }

  const type = json.type;
  if (typeof type !== 'string') {
    throw new SweCommonParseError(
      'DataEncoding must have a "type" string property',
      'encoding.type'
    );
  }

  switch (type) {
    case 'JSONEncoding': {
      const result: JSONEncoding = { type: 'JSONEncoding' };
      if (typeof json.recordsAsArrays === 'boolean') {
        result.recordsAsArrays = json.recordsAsArrays;
      }
      if (typeof json.vectorsAsArrays === 'boolean') {
        result.vectorsAsArrays = json.vectorsAsArrays;
      }
      return result;
    }

    case 'TextEncoding': {
      if (typeof json.tokenSeparator !== 'string') {
        throw new SweCommonParseError(
          'TextEncoding requires a "tokenSeparator" string',
          'encoding.tokenSeparator'
        );
      }
      if (typeof json.blockSeparator !== 'string') {
        throw new SweCommonParseError(
          'TextEncoding requires a "blockSeparator" string',
          'encoding.blockSeparator'
        );
      }
      // Required fields tokenSeparator and blockSeparator are validated above (Issue #74).
      const result: TextEncoding = {
        type: 'TextEncoding',
        tokenSeparator: json.tokenSeparator as string,
        blockSeparator: json.blockSeparator as string,
      };
      if (typeof json.decimalSeparator === 'string') {
        result.decimalSeparator = json.decimalSeparator;
      }
      if (typeof json.collapseWhiteSpaces === 'boolean') {
        result.collapseWhiteSpaces = json.collapseWhiteSpaces;
      }
      return result;
    }

    case 'BinaryEncoding': {
      if (typeof json.byteOrder !== 'string') {
        throw new SweCommonParseError(
          'BinaryEncoding requires a "byteOrder" string',
          'encoding.byteOrder'
        );
      }
      if (typeof json.byteEncoding !== 'string') {
        throw new SweCommonParseError(
          'BinaryEncoding requires a "byteEncoding" string',
          'encoding.byteEncoding'
        );
      }
      if (!Array.isArray(json.members) || json.members.length === 0) {
        throw new SweCommonParseError(
          'BinaryEncoding requires a non-empty "members" array',
          'encoding.members'
        );
      }
      const members: BinaryMember[] = (json.members as unknown[]).map((m, i) =>
        parseBinaryMember(m, i)
      );
      // Required fields byteOrder, byteEncoding, members are validated above (Issue #74).
      const result: BinaryEncoding = {
        type: 'BinaryEncoding',
        byteOrder: json.byteOrder as BinaryEncoding['byteOrder'],
        byteEncoding: json.byteEncoding as BinaryEncoding['byteEncoding'],
        members,
      };
      if (typeof json.byteLength === 'number') {
        result.byteLength = json.byteLength;
      }
      return result;
    }

    case 'XMLEncoding': {
      // Recognized but not fully decoded — preserve properties
      const result: XMLEncoding = { type: 'XMLEncoding' };
      if (typeof json.namespace === 'string') {
        result.namespace = json.namespace;
      }
      return result;
    }

    default:
      throw new SweCommonParseError(
        `Unrecognized encoding type: "${type}"`,
        'encoding.type'
      );
  }
}

// ========================================
// Values Decoder
// ========================================

/**
 * Decode an encoded values block according to the specified encoding.
 *
 * - **JSONEncoding:** Values are already structured JSON (array passthrough)
 * - **TextEncoding:** Values are a string — split by `blockSeparator` into
 *   records, then by `tokenSeparator` into fields
 * - **BinaryEncoding:** Values are preserved as-is (base64 string or raw);
 *   binary byte-level decoding is out of scope for this parser
 * - **XMLEncoding:** Values are preserved as-is
 * - **Link reference:** If `values` has an `href`, it is returned as-is
 *   for downstream resolution
 *
 * @param values - Raw values from the DataArray
 * @param encoding - Parsed DataEncoding specification
 * @returns Decoded values as an array, or the original link/binary reference
 *
 * @example
 * ```ts
 * // Text encoding
 * const rows = decodeValues(
 *   '23.5,65.2\n24.1,63.8',
 *   { type: 'TextEncoding', tokenSeparator: ',', blockSeparator: '\\n' }
 * );
 * // rows === [['23.5', '65.2'], ['24.1', '63.8']]
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — EncodedValues
 */
export function decodeValues(
  values: unknown,
  encoding: DataEncoding
): EncodedValues {
  // Link reference passthrough
  if (
    isRecord(values) &&
    typeof (values as Record<string, unknown>).href === 'string'
  ) {
    return parseAssociationAttributeGroup(values as Record<string, unknown>);
  }

  switch (encoding.type) {
    case 'JSONEncoding': {
      // JSON-encoded values are already structured — pass through
      if (Array.isArray(values)) return values;
      return [];
    }

    case 'TextEncoding': {
      if (typeof values !== 'string') return [];
      const enc = encoding as TextEncoding;
      const blockSep = enc.blockSeparator;
      const tokenSep = enc.tokenSeparator;

      const blocks = values.split(blockSep).filter((b) => b.length > 0);
      return blocks.map((block) => {
        const tokens = block.split(tokenSep);
        if (enc.collapseWhiteSpaces) {
          return tokens.map((t) => t.trim());
        }
        return tokens;
      });
    }

    case 'BinaryEncoding':
    case 'XMLEncoding':
      // Binary and XML values preserved as-is for downstream consumers
      if (Array.isArray(values)) return values;
      if (typeof values === 'string') return [values];
      return [];
  }
}

// ========================================
// DataArray Parser
// ========================================

/**
 * Parse a SWE Common 3.0 DataArray structure.
 *
 * A DataArray is a homogeneous array of data components (ISO-11404 Array
 * datatype). It defines a single element structure (`elementType`) that
 * is repeated. Values can be inline-encoded using JSON, Text, or Binary
 * encoding, or provided via link reference.
 *
 * @param json - Raw JSON value (expected: `{ type: 'DataArray', elementType: { name: '...', ... } }`)
 * @returns Parsed DataArray
 * @throws {SweCommonParseError} If the input is invalid, `type` is not
 *   `'DataArray'`, or `elementType` is missing/invalid
 *
 * @example
 * ```ts
 * const arr = parseDataArray({
 *   type: 'DataArray',
 *   elementType: {
 *     name: 'measurement',
 *     type: 'DataRecord',
 *     fields: [
 *       { name: 'time', type: 'Time', uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' } },
 *       { name: 'temp', type: 'Quantity', uom: { code: 'Cel' } },
 *     ],
 *   },
 *   encoding: { type: 'TextEncoding', tokenSeparator: ',', blockSeparator: '\\n' },
 *   values: '2024-01-01T00:00:00Z,23.5\\n2024-01-01T01:00:00Z,24.1',
 * });
 * // arr.type === 'DataArray'
 * // arr.elementType.name === 'measurement'
 * ```
 *
 * @see https://docs.ogc.org/is/24-014/24-014.html — DataArray
 * @see OAS: DataArray (L7638), required: type + elementType (L1314-1316)
 */
export function parseDataArray(
  json: unknown,
  componentParser?: ComponentParser
): DataArray {
  if (!isRecord(json)) {
    throw new SweCommonParseError('DataArray input must be a non-null object');
  }

  if (json.type !== 'DataArray') {
    throw new SweCommonParseError(
      `Expected type "DataArray" but received "${String(json.type)}"`,
      'type'
    );
  }

  // elementType — required
  if (json.elementType === undefined || json.elementType === null) {
    throw new SweCommonParseError(
      'DataArray requires an "elementType" property',
      'elementType'
    );
  }
  const elementType = parseElementType(json.elementType, componentParser);

  // elementCount — optional
  const elementCount = parseElementCount(json.elementCount);

  // encoding — optional
  let encoding: DataEncoding | undefined;
  if (json.encoding !== undefined && json.encoding !== null) {
    encoding = parseEncoding(json.encoding);
  }

  // values — optional (may be encoded inline or a link reference)
  let values: EncodedValues | undefined;
  if (json.values !== undefined && json.values !== null) {
    if (encoding) {
      values = decodeValues(json.values, encoding);
    } else if (Array.isArray(json.values)) {
      // No encoding specified — treat as raw JSON array
      values = json.values;
    } else if (
      isRecord(json.values) &&
      typeof (json.values as Record<string, unknown>).href === 'string'
    ) {
      // Link reference
      values = parseAssociationAttributeGroup(
        json.values as Record<string, unknown>
      );
    }
  }

  const result: DataArray = {
    ...parseBaseProperties(json),
    type: 'DataArray',
    elementType,
  };

  if (elementCount !== undefined) result.elementCount = elementCount;
  if (encoding !== undefined) result.encoding = encoding;
  if (values !== undefined) result.values = values;

  return result;
}
