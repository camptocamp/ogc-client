/**
 * OGC SWE Common 3.0 Data Model — TypeScript type definitions.
 *
 * Defines all data component, encoding, and constraint interfaces
 * specified by the OGC SWE Common Data Model Encoding Standard 3.0.
 *
 * This module contains ONLY type definitions (interfaces, type aliases,
 * and const enums). No runtime code, no parsing logic.
 *
 * Hierarchy (mirrors the JSON schema inheritance):
 * ```
 * AbstractSWE
 *   └─ AbstractSweIdentifiable
 *        └─ AbstractDataComponent
 *             ├─ AbstractSimpleComponent
 *             │    ├─ Boolean, Count, Quantity, Text, Category, Time   (scalar)
 *             │    ├─ CountRange, QuantityRange, TimeRange, CategoryRange (range)
 *             │    └─ ElementCount
 *             ├─ DataRecord, Vector, DataChoice, Geometry              (aggregate)
 *             └─ DataArray, Matrix                                     (array)
 *
 * AbstractEncoding
 *   ├─ TextEncoding
 *   ├─ JSONEncoding
 *   ├─ BinaryEncoding
 *   └─ XMLEncoding
 * ```
 *
 * @see https://docs.ogc.org/is/20-004/20-004.html — OGC SWE Common 3.0
 * @see https://github.com/opengeospatial/ogcapi-connected-systems/tree/master/swecommon/schemas/json
 * @module
 */

// ========================================
// Base Types
// ========================================

/**
 * Base for all SWE Common objects. Provides an optional `id` for
 * fragment-based referencing within a document.
 *
 * @see AbstractSWE in basicTypes.json
 */
export interface AbstractSWE {
  /** Object ID, referenceable using a URI fragment. */
  id?: string;
}

/**
 * Base for SWE Common objects that carry human-readable identification.
 *
 * @see AbstractSweIdentifiable.json
 */
export interface AbstractSweIdentifiable extends AbstractSWE {
  /** Human-readable label. */
  label?: string;
  /** Human-readable description. */
  description?: string;
}

/**
 * Abstract base for all data components.
 *
 * Every concrete component carries a discriminator `type` string,
 * an optional semantic `definition` URI, and flags for whether the
 * value is updatable or optional in a data stream.
 *
 * @see AbstractDataComponent.json
 */
export interface AbstractDataComponent extends AbstractSweIdentifiable {
  /** Discriminator string — overridden to a literal in each concrete type. */
  type: string;
  /** URI linking to the semantic definition of this component. */
  definition?: string;
  /** Whether the value can be updated externally. */
  updatable?: boolean;
  /** Whether this component's data can be omitted in a data stream. */
  optional?: boolean;
}

/**
 * Abstract base for simple (scalar and range) components.
 *
 * Adds reference frame, axis ID, and placeholders for nil values,
 * constraints, and inline value — each overridden in concrete types.
 *
 * @see AbstractSimpleComponent.json
 */
export interface AbstractSimpleComponent extends AbstractDataComponent {
  /** Spatial or temporal reference frame URI. */
  referenceFrame?: string;
  /** Reference axis identifier (CRS axisID). */
  axisID?: string;
}

// ========================================
// Unit of Measure
// ========================================

/**
 * Reference to a unit of measure.
 *
 * At least one of `code` (UCUM) or `href` (URI) is required by the spec.
 *
 * @see UnitReference in basicTypes.json
 */
export interface UnitOfMeasure {
  /** Human-readable label. */
  label?: string;
  /** Preferred display symbol. */
  symbol?: string;
  /** UCUM unit code (e.g. `"m/s"`, `"degC"`, `"hPa"`). */
  code?: string;
  /** URI to unit definition. */
  href?: string;
}

// ========================================
// Constraints
// ========================================

/**
 * Numeric value constraint: enumerated values and/or inclusive ranges.
 *
 * @see AllowedValues in basicTypes.json
 */
export interface AllowedValues {
  type?: 'AllowedValues';
  /** Enumerated permitted values. */
  values?: NumberOrSpecial[];
  /** Inclusive numeric ranges (each a 2-element tuple). */
  intervals?: [NumberOrSpecial, NumberOrSpecial][];
  /** Maximum significant figures for display. */
  significantFigures?: number;
}

/**
 * Token constraint: enumerated strings or a regex pattern.
 *
 * @see AllowedTokens in basicTypes.json
 */
export interface AllowedTokens {
  type?: 'AllowedTokens';
  /** Enumerated permitted tokens. */
  values?: string[];
  /** Regular expression pattern for permitted values. */
  pattern?: string;
}

/**
 * Temporal value constraint: enumerated times and/or inclusive ranges.
 *
 * @see AllowedTimes in basicTypes.json
 */
export interface AllowedTimes {
  type?: 'AllowedTimes';
  /** Enumerated permitted time values. */
  values?: DateTimeNumberOrSpecial[];
  /** Inclusive time ranges (each a 2-element tuple). */
  intervals?: [DateTimeNumberOrSpecial, DateTimeNumberOrSpecial][];
  /** Maximum significant figures for display. */
  significantFigures?: number;
}

// ========================================
// Nil Values
// ========================================

/**
 * A single nil value entry (reason + sentinel value).
 *
 * The reason is a URI identifying why the value is missing
 * (e.g. `http://www.opengis.net/def/nil/OGC/0/BelowDetectionRange`).
 */
export interface NilValue<T = unknown> {
  /** URI describing the reason for the nil value. */
  reason: string;
  /** The reserved sentinel value. */
  value: T;
}

/** Nil values for numeric components. */
export type NilValuesNumber = NilValue<NumberOrSpecial>[];

/** Nil values for integer components. */
export type NilValuesInteger = NilValue<number>[];

/** Nil values for text/category components. */
export type NilValuesText = NilValue<string>[];

/** Nil values for time components. */
export type NilValuesTime = NilValue<DateTimeNumberOrSpecial>[];

// ========================================
// Special Value Types
// ========================================

/**
 * A number or one of the IEEE 754 special-value strings.
 *
 * @see NumberOrSpecial in basicTypes.json
 */
export type NumberOrSpecial = number | 'NaN' | 'Infinity' | '+Infinity' | '-Infinity';

/**
 * An ISO 8601 date-time string, a number (epoch offset), or a special value.
 *
 * @see DateTimeNumberOrSpecial in basicTypes.json
 */
export type DateTimeNumberOrSpecial = string | NumberOrSpecial;

// ========================================
// Encoded Values & Element Count
// ========================================

/**
 * Encoded values: either an inline JSON array or an external reference.
 *
 * @see EncodedValues in basicTypes.json
 */
export type EncodedValues = unknown[] | AssociationAttributeGroup;

/**
 * OGC association (external reference by href).
 *
 * @see AssociationAttributeGroup in basicTypes.json
 */
export interface AssociationAttributeGroup {
  /** URI reference to the target resource. */
  href: string;
  /** Role URI. */
  role?: string;
  /** Arc-role URI. */
  arcrole?: string;
  /** Human-readable title. */
  title?: string;
}

/**
 * Element count for arrays. Extends AbstractSimpleComponent semantics
 * but is typically used as a lightweight integer holder.
 *
 * @see ElementCount in basicTypes.json
 */
export interface ElementCount extends AbstractSimpleComponent {
  type: 'ElementCount';
  constraint?: AllowedValues;
  value?: number;
}

// ========================================
// Named Field / Item Wrapper
// ========================================

/**
 * A named wrapper for a data component (SoftNamedProperty).
 *
 * Used by DataRecord fields, DataChoice items, Vector coordinates,
 * and DataArray elementType.
 *
 * @see SoftNamedProperty in basicTypes.json
 */
export interface DataField {
  /** Field name (token: starts with letter, then letters/digits/hyphens/underscores). */
  name: string;
  [key: string]: unknown;
}

/**
 * A named data field carrying an inline component (the common case).
 * This is the typed version of {@link DataField} used in most contexts.
 */
export interface TypedDataField extends DataField {
  name: string;
  /** The inline data component. */
  component?: AnyComponent;
}

// ========================================
// Scalar Components
// ========================================
// OGC SWE Common 3.0 §7.2 — Simple Components
// @see https://docs.ogc.org/is/20-004/20-004.html#_simple_components

/**
 * Boolean scalar component.
 *
 * @see Boolean.json
 * @see https://docs.ogc.org/is/20-004/20-004.html#boolean_component
 */
export interface SweBoolean extends AbstractSimpleComponent {
  type: 'Boolean';
  value?: boolean;
}

/**
 * Integer count scalar component.
 *
 * @see Count.json
 */
export interface SweCount extends AbstractSimpleComponent {
  type: 'Count';
  constraint?: AllowedValues;
  nilValues?: NilValuesInteger;
  value?: number;
}

/**
 * Continuous quantity scalar component with a unit of measure.
 *
 * @see Quantity.json
 */
export interface SweQuantity extends AbstractSimpleComponent {
  type: 'Quantity';
  /** Unit of measure (required by spec). */
  uom: UnitOfMeasure;
  constraint?: AllowedValues;
  nilValues?: NilValuesNumber;
  value?: number;
}

/**
 * Free-text scalar component.
 *
 * @see Text.json
 */
export interface SweText extends AbstractSimpleComponent {
  type: 'Text';
  constraint?: AllowedTokens;
  nilValues?: NilValuesText;
  value?: string;
}

/**
 * Categorical scalar component — a token from a code space.
 *
 * @see Category.json
 */
export interface SweCategory extends AbstractSimpleComponent {
  type: 'Category';
  /** URI of the code-space dictionary. */
  codeSpace?: string;
  constraint?: AllowedTokens;
  nilValues?: NilValuesText;
  value?: string;
}

/**
 * Temporal scalar component — ISO 8601 or epoch-relative.
 *
 * @see Time.json
 */
export interface SweTime extends AbstractSimpleComponent {
  type: 'Time';
  /** Origin of the temporal reference frame (ISO 8601). */
  referenceTime?: string;
  /** Temporal frame located by this component's value. */
  localFrame?: string;
  /** Temporal unit of measure (required by spec). */
  uom: UnitOfMeasure;
  constraint?: AllowedTimes;
  nilValues?: NilValuesTime;
  value?: DateTimeNumberOrSpecial;
}

// ========================================
// Range Components
// ========================================

/**
 * Integer range component — pair of counts.
 *
 * @see CountRange.json
 */
export interface SweCountRange extends AbstractSimpleComponent {
  type: 'CountRange';
  constraint?: AllowedValues;
  nilValues?: NilValuesText;
  value?: [number, number];
}

/**
 * Continuous quantity range with a unit of measure.
 *
 * @see QuantityRange.json
 */
export interface SweQuantityRange extends AbstractSimpleComponent {
  type: 'QuantityRange';
  /** Unit of measure (required by spec). */
  uom: UnitOfMeasure;
  constraint?: AllowedValues;
  nilValues?: NilValuesNumber;
  value?: [NumberOrSpecial, NumberOrSpecial];
}

/**
 * Temporal range component.
 *
 * @see TimeRange.json
 */
export interface SweTimeRange extends AbstractSimpleComponent {
  type: 'TimeRange';
  /** Origin of the temporal reference frame (ISO 8601). */
  referenceTime?: string;
  /** Temporal frame located by this component's value. */
  localFrame?: string;
  /** Temporal unit of measure (required by spec). */
  uom: UnitOfMeasure;
  constraint?: AllowedTimes;
  nilValues?: NilValuesTime;
  value?: [DateTimeNumberOrSpecial, DateTimeNumberOrSpecial];
}

/**
 * Categorical range in an ordinal reference system.
 *
 * @see CategoryRange.json
 */
export interface SweCategoryRange extends AbstractSimpleComponent {
  type: 'CategoryRange';
  /** URI of the code-space dictionary (ordinal reference system). */
  codeSpace?: string;
  constraint?: AllowedTokens;
  nilValues?: NilValuesText;
  value?: [string, string];
}

// ========================================
// Aggregate Components
// ========================================
// OGC SWE Common 3.0 §7.4 — Record, Choice, and Vector Components
// @see https://docs.ogc.org/is/20-004/20-004.html#record_components

/**
 * Record (named tuple) — ordered sequence of named fields.
 *
 * @see DataRecord.json
 * @see https://docs.ogc.org/is/20-004/20-004.html#datarecord_def
 */
export interface DataRecord extends AbstractDataComponent {
  type: 'DataRecord';
  /** Record fields (at least one required by spec). */
  fields: DataField[];
}

/**
 * Mathematical vector — ordered coordinates in a reference frame.
 *
 * @see Vector.json
 */
export interface Vector extends AbstractDataComponent {
  type: 'Vector';
  /** Spatial reference frame URI (required by spec). */
  referenceFrame: string;
  /** Frame of reference located by this vector. */
  localFrame?: string;
  /** Coordinate components (Count, Quantity, or Time). */
  coordinates: DataField[];
}

/**
 * Disjoint union — one of several named alternatives.
 *
 * @see DataChoice.json
 */
export interface DataChoice extends AbstractDataComponent {
  type: 'DataChoice';
  /** Category component indicating which choice is active. */
  choiceValue?: SweCategory;
  /** Named alternative items (at least one required by spec). */
  items: DataField[];
}

/**
 * Geometry component — embeds an ISO 19107 / GeoJSON geometry.
 *
 * @see Geometry.json
 */
export interface SweGeometry extends AbstractDataComponent {
  type: 'Geometry';
  /** Coordinate reference system URI (required by spec). */
  srs: string;
  /** Permitted geometry types. */
  constraint?: GeometryConstraint;
  nilValues?: NilValuesText;
  /** Inline GeoJSON geometry value. */
  value?: GeoJsonGeometry;
}

/** Constraint on permitted geometry types. */
export interface GeometryConstraint {
  geomTypes?: GeometryType[];
}

/** GeoJSON geometry type names. */
export type GeometryType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon';

/** GeoJSON Geometry object (loosely typed — full typing is out of scope). */
export interface GeoJsonGeometry {
  type: string;
  coordinates?: unknown;
  geometries?: GeoJsonGeometry[];
  [key: string]: unknown;
}

// ========================================
// Array Components
// ========================================
// OGC SWE Common 3.0 §7.5 — Array Components
// @see https://docs.ogc.org/is/20-004/20-004.html#array_components

/**
 * Homogeneous array of data components.
 *
 * @see DataArray.json
 * @see https://docs.ogc.org/is/20-004/20-004.html#dataarray_def
 */
export interface DataArray extends AbstractDataComponent {
  type: 'DataArray';
  /** Element structure definition (named wrapper). */
  elementType: DataField;
  /** Array size specification. */
  elementCount?: ElementCount | AssociationAttributeGroup;
  /** Encoding method for inline values. */
  encoding?: DataEncoding;
  /** Inline encoded values. */
  values?: EncodedValues;
}

/**
 * Matrix — an array with spatial reference frame semantics.
 *
 * @see Matrix.json
 */
export interface Matrix extends AbstractDataComponent {
  type: 'Matrix';
  /** Element structure definition (named wrapper). */
  elementType: DataField;
  /** Array size specification. */
  elementCount?: ElementCount | AssociationAttributeGroup;
  /** Encoding method for inline values. */
  encoding?: DataEncoding;
  /** Inline encoded values. */
  values?: EncodedValues;
  /** Spatial reference frame for interpretation. */
  referenceFrame?: string;
  /** Frame of reference whose position is defined by this matrix. */
  localFrame?: string;
}

// ========================================
// Encoding Types
// ========================================
// OGC SWE Common 3.0 §8 — Data Encodings
// @see https://docs.ogc.org/is/20-004/20-004.html#data_encoding_rules

/**
 * Text encoding — delimited token/block format.
 *
 * @see TextEncoding in encodings.json
 * @see https://docs.ogc.org/is/20-004/20-004.html#text_encoding_rules
 */
export interface TextEncoding extends AbstractSWE {
  type: 'TextEncoding';
  /** Token separator (e.g. `","`, `"\t"`). */
  tokenSeparator: string;
  /** Block separator (e.g. `"\n"`). */
  blockSeparator: string;
  /** Decimal separator (default `"."`). */
  decimalSeparator?: string;
  /** Whether to collapse white space around separators. */
  collapseWhiteSpaces?: boolean;
}

/**
 * JSON encoding — values encoded as JSON arrays/objects.
 *
 * @see JSONEncoding in encodings.json
 */
export interface JSONEncoding extends AbstractSWE {
  type: 'JSONEncoding';
  /** Encode DataRecord values as arrays instead of objects. */
  recordsAsArrays?: boolean;
  /** Encode Vector values as arrays instead of objects. */
  vectorsAsArrays?: boolean;
}

/**
 * Binary encoding — raw or base64-encoded byte stream.
 *
 * @see BinaryEncoding in encodings.json
 */
export interface BinaryEncoding extends AbstractSWE {
  type: 'BinaryEncoding';
  /** Byte order: big-endian (MSB first) or little-endian (LSB first). */
  byteOrder: 'bigEndian' | 'littleEndian';
  /** Byte stream encoding: raw bytes or base64. */
  byteEncoding: 'base64' | 'raw';
  /** Total byte length of the stream (if known). */
  byteLength?: number;
  /** Per-field encoding parameters. */
  members: BinaryMember[];
}

/**
 * XML encoding — values encoded as XML elements.
 *
 * @see XMLEncoding in encodings.json
 */
export interface XMLEncoding extends AbstractSWE {
  type: 'XMLEncoding';
  /** Target XML namespace URI. */
  namespace?: string;
}

/**
 * Binary encoding member — parameters for a single scalar component.
 *
 * @see Component in encodings.json
 */
export interface BinaryComponent extends AbstractSWE {
  type: 'Component';
  /** Reference to the data component these settings apply to. */
  ref: string;
  /** URI identifying the binary data type. */
  dataType: string;
  /** Byte length for custom data types. */
  byteLength?: number;
  /** Number of significant bits for numeric values. */
  significantBits?: number;
  /** Bit length override. */
  bitLength?: number;
  /** Encryption method URI. */
  encryption?: string;
}

/**
 * Binary encoding block — parameters for encoding a block of values.
 *
 * @see Block in encodings.json
 */
export interface BinaryBlock extends AbstractSWE {
  type: 'Block';
  /** Reference to the aggregate component these settings apply to. */
  ref: string;
  /** Compression method URI. */
  compression?: string;
  /** Encryption method URI. */
  encryption?: string;
  /** Padding bytes before the block. */
  'paddingBytes-before'?: number;
  /** Padding bytes after the block. */
  'paddingBytes-after'?: number;
  /** Total byte length of the block. */
  byteLength?: number;
}

/** A binary encoding member is either a scalar component or a block. */
export type BinaryMember = BinaryComponent | BinaryBlock;

// ========================================
// Union Types
// ========================================

/**
 * Union of all encoding types supported by SWE Common 3.0.
 *
 * Discriminated on the `type` property.
 */
export type DataEncoding =
  | TextEncoding
  | JSONEncoding
  | BinaryEncoding
  | XMLEncoding;

/**
 * The 6 scalar component types.
 *
 * Discriminated on the `type` property.
 */
export type AnyScalarComponent =
  | SweBoolean
  | SweCount
  | SweQuantity
  | SweText
  | SweCategory
  | SweTime;

/**
 * All simple (scalar + range) component types.
 *
 * Discriminated on the `type` property.
 */
export type AnySimpleComponent =
  | AnyScalarComponent
  | SweCountRange
  | SweQuantityRange
  | SweTimeRange
  | SweCategoryRange;

/**
 * Any SWE Common 3.0 data component — the top-level union.
 *
 * This is the type used for recursive nesting in DataRecord fields,
 * DataArray elementType, DataChoice items, and Vector coordinates.
 *
 * Discriminated on the `type` property.
 *
 * @see AnyComponent in sweCommon.json
 */
export type AnyComponent =
  | AnySimpleComponent
  | DataRecord
  | Vector
  | DataArray
  | Matrix
  | DataChoice
  | SweGeometry;

/**
 * Convenience alias: the discriminator values for all 16 component types.
 */
export type SweComponentType = AnyComponent['type'];

/**
 * Convenience alias: the discriminator values for all 4 encoding types.
 */
export type SweEncodingType = DataEncoding['type'];
