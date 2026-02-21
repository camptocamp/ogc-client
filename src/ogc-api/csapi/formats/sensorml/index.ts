/**
 * SensorML 3.0 — public entry point for SensorML parsing and types.
 *
 * This barrel file re-exports the public API surface of the `sensorml/`
 * directory. All runtime values and compile-time types needed by
 * consumers are available from a single import path:
 *
 * ```typescript
 * // Runtime values
 * import { parseSensorML30, SensorMLParseError } from '@camptocamp/ogc-client/csapi/formats/sensorml';
 *
 * // Type-only imports
 * import type { PhysicalSystem, SensorMLProcess } from '@camptocamp/ogc-client/csapi/formats/sensorml';
 * ```
 *
 * **Runtime exports:**
 * - {@link parseSensorML30} — main parser entry point (type discriminates
 *   and delegates to sub-parsers)
 * - {@link SensorMLParseError} — error class thrown on parse failures
 * - {@link parseCapabilityList} — standalone CapabilityList parser
 * - {@link parseCharacteristicList} — standalone CharacteristicList parser
 * - {@link parseDescribedObjectProperties} — shared DescribedObject helper
 * - {@link parseAbstractProcessProperties} — shared AbstractProcess helper
 * - {@link parseAbstractPhysicalProcessProperties} — shared AbstractPhysicalProcess helper
 * - {@link parsePosition} — position parser (all SensorML position variants)
 * - {@link SENSORML_PROCESS_TYPES} — const array of valid process type strings
 *
 * **Type-only exports:**
 * All interfaces and type aliases from `types.ts` — concrete process types,
 * the {@link SensorMLProcess} discriminated union, supporting interfaces
 * (capabilities, characteristics, components, connections, etc.).
 *
 * Sub-parser internals (`parseSimpleProcess`, `parseAggregateProcess`,
 * `parsePhysicalComponent`, `parsePhysicalSystem`) are intentionally NOT
 * re-exported — they are consumed by `parser.ts` and are not part of the
 * public API.
 *
 * @see https://docs.ogc.org/is/23-000/23-000.html — OGC SensorML 3.0 (JSON)
 * @see https://docs.ogc.org/is/23-001/23-001.html — OGC API - Connected Systems Part 1
 * @module
 */

// ========================================
// Runtime value re-exports
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
} from './parser.js';

export { SENSORML_PROCESS_TYPES } from './types.js';

// ========================================
// Type-only re-exports
// ========================================

// Primitive / utility types
export type { Link } from './types.js';
export type { TimePeriod } from './types.js';
export type { TimeInstant } from './types.js';
export type { TimeInstantOrPeriod } from './types.js';
export type { PathRef } from './types.js';

// Metadata types
export type { Term } from './types.js';
export type { Document } from './types.js';
export type { LegalConstraint } from './types.js';
export type { SecurityConstraint } from './types.js';
export type { ContactInfo } from './types.js';
export type { ResponsibleParty } from './types.js';
export type { ContactLink } from './types.js';
export type { ObservableProperty } from './types.js';

// Capability / Characteristic types
export type { AnyProperty } from './types.js';
export type { CapabilityList } from './types.js';
export type { CharacteristicList } from './types.js';

// I/O types
export type { IOComponentChoice } from './types.js';
export type { InputList } from './types.js';
export type { OutputList } from './types.js';
export type { ParameterList } from './types.js';

// Process method
export type { ProcessMethod } from './types.js';

// Settings types
export type { SettingValue } from './types.js';
export type { SettingArrayValue } from './types.js';
export type { SettingMode } from './types.js';
export type { SetConstraint } from './types.js';
export type { SettingStatus } from './types.js';
export type { Settings } from './types.js';

// Spatial / temporal frame types
export type { FrameAxis } from './types.js';
export type { SpatialFrame } from './types.js';
export type { TemporalFrame } from './types.js';

// Position types
export type { GeoJsonPoint } from './types.js';
export type { Pose } from './types.js';
export type { Position } from './types.js';

// Event / history types
export type { Event } from './types.js';
export type { FeatureList } from './types.js';

// DescribedObject / AbstractProcess hierarchy
export type { DescribedObject } from './types.js';
export type { Mode } from './types.js';
export type { AbstractProcess } from './types.js';
export type { AbstractPhysicalProcess } from './types.js';

// Concrete process types
export type { SimpleProcess } from './types.js';
export type { AggregateProcess } from './types.js';
export type { PhysicalComponent } from './types.js';
export type { PhysicalSystem } from './types.js';

// Discriminated union
export type { SensorMLProcess } from './types.js';

// Component / connection types
export type { ComponentLink } from './types.js';
export type { ComponentEntry } from './types.js';
export type { ComponentList } from './types.js';
export type { Connection } from './types.js';
export type { ConnectionList } from './types.js';

// Process type literal union
export type { SensorMLProcessType } from './types.js';
