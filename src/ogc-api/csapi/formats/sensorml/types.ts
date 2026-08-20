/**
 * OGC SensorML 3.0 Data Model — TypeScript type definitions.
 *
 * Defines the complete SensorML 3.0 process-model type hierarchy for
 * OGC API — Connected Systems Part 1 (System descriptions).
 *
 * This module contains ONLY type definitions (interfaces, type aliases,
 * and const arrays). No runtime code, no parsing logic.
 *
 * Hierarchy (mirrors the JSON schema inheritance):
 * ```
 * DescribedObject
 *   ├─ Mode
 *   └─ AbstractProcess
 *        ├─ SimpleProcess          (type = 'SimpleProcess')
 *        ├─ AggregateProcess       (type = 'AggregateProcess')
 *        └─ AbstractPhysicalProcess
 *             ├─ PhysicalComponent (type = 'PhysicalComponent')
 *             └─ PhysicalSystem    (type = 'PhysicalSystem')
 *
 * AbstractSweIdentifiable  (from SWE Common)
 *   ├─ ObservableProperty
 *   ├─ CapabilityList
 *   ├─ CharacteristicList
 *   ├─ SpatialFrame
 *   ├─ TemporalFrame
 *   └─ SensorMLEvent
 * ```
 *
 * Design notes:
 * - Depends on SWE Common 3.0 types (`../swecommon/types.js`) for data
 *   component types used in capabilities, characteristics, and I/O.
 * - Four concrete process types use string-literal `type` discriminators
 *   for TypeScript union narrowing (same pattern as SWE Common).
 * - Properties marked as required by the OAS schema are non-optional;
 *   all others are optional (`?`).
 * - Forward references to `AbstractProcess` and `SensorMLProcess` are
 *   used in §6 Position and §9 ComponentList respectively; TypeScript
 *   resolves these lazily within a module.
 *
 * **CSAPI Relationship:** These process types represent what the CSAPI API
 * calls "Procedure" resources. When a {@link Procedure} resource is requested
 * with `Accept: application/sml+json`, the server returns one of the four
 * concrete types defined here ({@link SimpleProcess}, {@link AggregateProcess},
 * {@link PhysicalComponent}, {@link PhysicalSystem}).
 *
 * @see {@link Procedure} in `model.ts` for the GeoJSON representation
 * @see https://docs.ogc.org/is/23-000/23-000.html — OGC SensorML 3.0 (JSON)
 * @see https://docs.ogc.org/is/12-000r2/12-000r2.html — SensorML 2.0 (UML reference)
 * @see ogcapi-connectedsystems-1.bundled.oas31.yaml — Part 1 OAS schemas
 * @module
 */

import type {
  AbstractSweIdentifiable,
  AnySimpleComponent,
  AnyComponent,
  Vector,
  DataRecord,
  DataArray,
  Matrix,
} from '../swecommon/types.js';

// ========================================
// §1 — Cross-reference & Temporal Primitives
// ========================================

/**
 * Link object for cross-references between resources.
 *
 * Used for `typeOf`, `attachedTo`, feature-of-interest references,
 * and external documentation/contact links.
 *
 * @see OAS: link-2 schema
 */
export interface Link {
  /** Target URI (required). */
  href: string;
  /** Link relation type (e.g. `'alternate'`, `'self'`). */
  rel?: string;
  /** Media type of the target resource. */
  type?: string;
  /** Language of the target resource. */
  hreflang?: string;
  /** Human-readable title. */
  title?: string;
  /** Unique identifier of the linked resource. */
  uid?: string;
}

/**
 * ISO 8601 time period as one or two date-time strings.
 *
 * - `[start]` — open-ended period (no known end)
 * - `[start, end]` — bounded period
 *
 * @see OAS: timePeriod schema
 */
export type TimePeriod = [string] | [string, string];

/**
 * ISO 8601 date-time instant as a string.
 *
 * @example `'2024-01-15T12:00:00Z'`
 */
export type TimeInstant = string;

/**
 * Time instant or period — used in {@link SensorMLEvent.time}.
 *
 * - `string` — single instant
 * - `TimePeriod` — bounded or open-ended period
 */
export type TimeInstantOrPeriod = TimeInstant | TimePeriod;

/**
 * Dot-separated data-path reference used in {@link Settings} entries
 * to target specific properties within a process description.
 *
 * @example `'outputs/temperature/uom'`
 */
export type PathRef = string;

// ========================================
// §2 — Metadata Types
// ========================================

/**
 * Controlled-vocabulary term for identification and classification.
 *
 * @see OAS: Term (L3045)
 * @see SensorML 3.0 §7.2.3 — Identification / Classification
 */
export interface Term {
  /** Semantic link defining the type of identifier/classifier (URI). */
  definition?: string;
  /** Human-readable label. */
  label: string;
  /** URI of the codespace defining allowed values. */
  codeSpace?: string;
  /** The actual identifier/classifier value. */
  value: string;
}

/**
 * Reference to additional documentation.
 *
 * @see OAS: Document (L3274)
 * @see SensorML 3.0 §7.2.8 — Documentation
 */
export interface Document {
  /** Type of document — semantic URI (e.g. datasheet, manual). */
  role?: string;
  /** Document name. */
  name: string;
  /** Human-readable description. */
  description?: string;
  /** URI of the document. */
  link: Link;
}

/**
 * Legal constraint on use or distribution.
 *
 * Modelled as an open object with a required `type` discriminator so
 * that different constraint vocabularies can be represented.
 *
 * @see OAS: LegalConstraint schema
 */
export interface LegalConstraint {
  /** Type of legal constraint (URI). */
  type: string;
  /** Additional properties depend on the constraint vocabulary. */
  [key: string]: unknown;
}

/**
 * Security tagging constraint.
 *
 * Modelled as an open object with a required `type` discriminator.
 *
 * @see OAS: DescribedObject.securityConstraints
 */
export interface SecurityConstraint {
  /** Type of security marking (URI). */
  type: string;
  /** Additional properties depend on the security vocabulary. */
  [key: string]: unknown;
}

/**
 * Contact information — phone, address, and online resource.
 *
 * Follows the ISO 19115 CI_Contact structure used by SensorML.
 *
 * @see ISO 19115 CI_Contact
 */
export interface ContactInfo {
  /** Phone numbers. */
  phone?: {
    voice?: string[];
    facsimile?: string[];
  };
  /** Postal address. */
  address?: {
    deliveryPoint?: string[];
    city?: string;
    administrativeArea?: string;
    postalCode?: string;
    country?: string;
    electronicMailAddress?: string[];
  };
  /** Online resource link. */
  onlineResource?: Link;
  /** Hours of service (free text). */
  hoursOfService?: string;
  /** Contact instructions (free text). */
  contactInstructions?: string;
}

/**
 * Responsible party with contact information.
 *
 * At least one of `individualName` or `organisationName` should be
 * provided (enforced by the OAS oneOf, relaxed here for flexibility).
 *
 * @see OAS: ResponsibleParty (L3191)
 * @see SensorML 3.0 §7.2.7 — Contacts
 */
export interface ResponsibleParty {
  /** Individual's name. */
  individualName?: string;
  /** Organisation name. */
  organisationName?: string;
  /** Position or title. */
  positionName?: string;
  /** Detailed contact information. */
  contactInfo?: ContactInfo;
  /** Role of the responsible party (semantic URI). */
  role: string;
}

/**
 * Contact reference as a link — alternative to inline
 * {@link ResponsibleParty} in {@link DescribedObject.contacts}.
 */
export type ContactLink = Link;

/**
 * Observable property definition.
 *
 * Used in I/O lists when the input/output is described by an
 * observable property rather than a full data component.
 *
 * @see OAS: ObservableProperty (L3015)
 * @see SWE Common 3.0 §8.3.1
 */
export interface ObservableProperty extends AbstractSweIdentifiable {
  /** Discriminator — always `'ObservableProperty'`. */
  type: 'ObservableProperty';
  /** Definition URI identifying the observable property. */
  definition: string;
}

// ========================================
// §3 — Property & Capability Lists
// ========================================

/**
 * Named data component used in capability and characteristic lists.
 *
 * Subset of SWE Common components suitable for measurable / quantifiable
 * properties: simple scalars, vectors, arrays, and matrices.
 *
 * @see OAS: AnyProperty variant of SoftNamedProperty
 */
export type AnyProperty = {
  /** Property name (from SoftNamedProperty wrapper). */
  name: string;
} & (AnySimpleComponent | Vector | DataArray | Matrix);

/**
 * Group of capabilities describing what a process can measure or do.
 *
 * Capabilities are quantified by named SWE Common data components
 * (e.g. measurement range, accuracy, resolution).
 *
 * @see OAS: CapabilityList (L3129)
 * @see SensorML 3.0 §7.2.6 — Capabilities
 */
export interface CapabilityList extends AbstractSweIdentifiable {
  /** Semantic link to the capability-set definition (URI). */
  definition?: string;
  /** Conditions under which these capabilities apply. */
  conditions?: AnySimpleComponent[];
  /** The list of named capabilities (required by OAS). */
  capabilities: AnyProperty[];
}

/**
 * Group of characteristics describing physical or operational properties.
 *
 * Characteristics are quantified by named SWE Common data components
 * (e.g. weight, dimensions, power consumption).
 *
 * @see OAS: CharacteristicList (L3107)
 * @see SensorML 3.0 §7.2.5 — Characteristics
 */
export interface CharacteristicList extends AbstractSweIdentifiable {
  /** Semantic link to the characteristic-set definition (URI). */
  definition?: string;
  /** Conditions under which these characteristics apply. */
  conditions?: AnySimpleComponent[];
  /** The list of named characteristics (required by OAS). */
  characteristics: AnyProperty[];
}

// ========================================
// §4 — I/O Types
// ========================================

/**
 * Named I/O component for process inputs, outputs, and parameters.
 *
 * Can be any SWE Common data component or an
 * {@link ObservableProperty}.
 *
 * @see OAS: IOComponentChoice
 * @see SensorML 3.0 §7.3.2 — Inputs / Outputs / Parameters
 */
export type IOComponentChoice = {
  /** I/O port name. */
  name: string;
} & (AnyComponent | ObservableProperty);

/**
 * List of process inputs.
 * @see OAS: InputList
 */
export type InputList = IOComponentChoice[];

/**
 * List of process outputs.
 * @see OAS: OutputList
 */
export type OutputList = IOComponentChoice[];

/**
 * List of process tuneable parameters.
 * @see OAS: ParameterList
 */
export type ParameterList = IOComponentChoice[];

// ========================================
// §5 — Configuration Types
// ========================================

/**
 * Description of a process's algorithmic method.
 *
 * @see OAS: ProcessMethod (L3671)
 * @see SensorML 3.0 §7.4.1 — Method
 */
export interface ProcessMethod {
  /** Machine-readable algorithm description (inline or reference). */
  algorithm?: unknown;
  /** Natural-language description of the method. */
  description?: string;
}

/**
 * Single-value setting — sets one property by data-path reference.
 *
 * @see OAS: Settings.setValues
 */
export interface SettingValue {
  /** Data-path reference to the target property. */
  ref: PathRef;
  /** New value (number or string). */
  value: number | string;
}

/**
 * Array-value setting — sets array data by data-path reference.
 *
 * @see OAS: Settings.setArrayValues
 */
export interface SettingArrayValue {
  /** Data-path reference to the target array. */
  ref: PathRef;
  /** Array of replacement values. */
  value: unknown[];
}

/**
 * Mode-selection setting — activates a named mode by path reference.
 *
 * @see OAS: Settings.setModes
 */
export interface SettingMode {
  /** Data-path reference to the mode selector. */
  ref: PathRef;
  /** Name of the mode to activate. */
  value: string;
}

/**
 * Constraint-override entry — narrows a constraint on a property.
 *
 * The exact shape depends on the constraint vocabulary (`type`);
 * additional properties are represented by the index signature.
 *
 * @see OAS: Settings.setConstraints
 */
export interface SetConstraint {
  /** Constraint-type identifier (URI). */
  type: string;
  /** Data-path reference to the constrained property. */
  ref: PathRef;
  /** Additional constraint properties. */
  [key: string]: unknown;
}

/**
 * Status-override entry — enables or disables a component.
 *
 * @see OAS: Settings.setStatus
 */
export interface SettingStatus {
  /** Data-path reference to the target component. */
  ref: PathRef;
  /** New status. */
  value: 'enabled' | 'disabled';
}

/**
 * Configuration settings that constrain a base process type.
 *
 * Each array contains entries that override specific aspects of the
 * process description: values, constraints, modes, or status.
 *
 * @see OAS: Settings (L3307)
 * @see SensorML 3.0 §7.3.5 — Configuration
 */
export interface Settings {
  /** Individual value overrides. */
  setValues?: SettingValue[];
  /** Array-value overrides. */
  setArrayValues?: SettingArrayValue[];
  /** Mode activations. */
  setModes?: SettingMode[];
  /** Constraint overrides. */
  setConstraints?: SetConstraint[];
  /** Component status overrides (enable/disable). */
  setStatus?: SettingStatus[];
}

// ========================================
// §6 — Spatial & Temporal Reference Frames
// ========================================

/**
 * Named axis in a spatial reference frame.
 *
 * @see OAS: SpatialFrame.axes
 */
export interface FrameAxis {
  /** Axis name (e.g. `'X'`, `'Y'`, `'Z'`). */
  name: string;
  /** Textual description of the axis direction. */
  description: string;
}

/**
 * Local spatial reference frame attached to a physical process.
 *
 * Defines a coordinate system relative to the physical device,
 * with a described origin and one or more named axes.
 *
 * @see OAS: SpatialFrame (L3961)
 * @see SensorML 3.0 §7.6.2 — Local Reference Frames
 */
export interface SpatialFrame extends AbstractSweIdentifiable {
  /** Textual description of the origin relative to the physical device. */
  origin: string;
  /** Axis definitions (required by OAS; at least one). */
  axes: FrameAxis[];
}

/**
 * Local time reference frame for a physical process.
 *
 * Defines an epoch (origin) relative to which local times are measured.
 *
 * @see OAS: TemporalFrame (L3987)
 * @see SensorML 3.0 §7.6.3 — Local Time Frames
 */
export interface TemporalFrame extends AbstractSweIdentifiable {
  /** Textual description of the start of time (epoch). */
  origin: string;
}

/**
 * GeoJSON Point geometry for position specification.
 *
 * @see RFC 7946 — GeoJSON, §3.1.2
 */
export interface GeoJsonPoint {
  /** Geometry type — always `'Point'`. */
  type: 'Point';
  /** `[longitude, latitude]` or `[longitude, latitude, altitude]`. */
  coordinates: [number, number] | [number, number, number];
}

/**
 * GeoPose — position with orientation.
 *
 * Orientation can be expressed as Euler angles (yaw-pitch-roll) or
 * a unit quaternion. Position is given as a GeoJSON Point.
 *
 * @see OGC GeoPose 1.0
 */
export interface Pose {
  /** Position as a GeoJSON Point. */
  position?: GeoJsonPoint;
  /** Orientation as Euler angles (degrees). */
  angles?: {
    yaw?: number;
    pitch?: number;
    roll?: number;
  };
  /** Orientation as a unit quaternion. */
  quaternion?: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
}

/**
 * Position of a physical process — polymorphic (8 variants).
 *
 * Non-deprecated variants:
 * - `string` — textual description of location
 * - `GeoJsonPoint` — GeoJSON Point geometry
 * - `Pose` — GeoPose with orientation
 * - `AbstractProcess` — position computed by a process (forward ref)
 * - `Link` — reference to a datastream providing position
 *
 * Deprecated variants (SWE Common direct encoding):
 * - `Vector` — location as a SWE Common vector
 * - `DataRecord` — position as a SWE Common data record
 * - `DataArray` — trajectory as a SWE Common data array
 *
 * @see OAS: Position (L3998)
 * @see SensorML 3.0 §7.6.4 — Position
 */
export type Position =
  | string
  | GeoJsonPoint
  | Pose
  | AbstractProcess
  | Link
  | Vector
  | DataRecord
  | DataArray;

// ========================================
// §7 — Event & Feature Types
// ========================================

/**
 * Event in the history of a described object.
 *
 * Records significant occurrences such as calibrations, deployments,
 * maintenance, or configuration changes.
 *
 * Renamed from `Event` to avoid shadowing the DOM global `Event` interface.
 *
 * @see OAS: Event (L3387)
 * @see SensorML 3.0 §7.2.9 — History
 */
export interface SensorMLEvent extends AbstractSweIdentifiable {
  /** Human-readable label (required in Event per OAS). */
  label: string;
  /** Type of event — semantic URI (e.g. calibration, deployment). */
  definition?: string;
  /** Additional identifiers. */
  identifiers?: Term[];
  /** Additional classifiers. */
  classifiers?: Term[];
  /** Contacts relevant to this event. */
  contacts?: ResponsibleParty[];
  /** Additional documentation. */
  documentation?: Document[];
  /** Time of the event — instant or period (required by OAS). */
  time: TimeInstantOrPeriod;
  /** Additional properties (calibration data, error codes, etc.). */
  properties?: AnyProperty[];
  /** Configuration settings adjusted during this event. */
  configuration?: Settings;
}

/**
 * Array of links to sampling / domain features of interest.
 *
 * @see OAS: FeatureList (L3579)
 */
export type FeatureList = Link[];

// ========================================
// §8 — Base Interfaces (Abstract)
// ========================================

/**
 * Base interface for all SensorML objects that can be described.
 *
 * Provides identification, classification, constraints, documentation,
 * and history metadata common to all process descriptions.
 *
 * The `type` property serves as the string-literal discriminator in
 * concrete subtypes ({@link SimpleProcess}, {@link AggregateProcess},
 * {@link PhysicalComponent}, {@link PhysicalSystem}).
 *
 * Required by OAS: `type`, `label`, `uniqueId`.
 *
 * @see OAS: DescribedObject (L3432)
 * @see SensorML 3.0 §7.2 — DescribedObject
 */
export interface DescribedObject {
  /** Process-type discriminator (narrowed to a literal in concrete types). */
  type: string;
  /** Local feature ID. */
  id?: string;
  /** Textual description. */
  description?: string;
  /** Globally unique identifier — typically a URN. */
  uniqueId: string;
  /** Human-readable label. */
  label: string;
  /** Language code (e.g. `'en'`). */
  lang?: string;
  /** Short keywords for discovery. */
  keywords?: string[];
  /** Additional typed identifiers (e.g. serial number, manufacturer ID). */
  identifiers?: Term[];
  /** Classifiers for discovery and categorization. */
  classifiers?: Term[];
  /** Time period during which this description is valid. */
  validTime?: TimePeriod;
  /** Security-tagging constraints. */
  securityConstraints?: SecurityConstraint[];
  /** Legal constraints on use or distribution. */
  legalConstraints?: LegalConstraint[];
  /** Groups of operational / measurement characteristics. */
  characteristics?: CharacteristicList[];
  /** Groups of operational / measurement capabilities. */
  capabilities?: CapabilityList[];
  /** Contacts responsible for this object. */
  contacts?: (ResponsibleParty | ContactLink)[];
  /** Additional documentation references. */
  documents?: Document[];
  /** Historical events related to this object. */
  history?: SensorMLEvent[];
}

/**
 * Predefined operating mode — a described object with configuration.
 *
 * Modes define named configurations that constrain a base process
 * (e.g. "High Resolution Mode", "Low Power Mode").
 *
 * @see OAS: Mode (L3570)
 * @see SensorML 3.0 §7.3.4 — Mode
 */
export interface Mode extends DescribedObject {
  /** Configuration settings for this mode. */
  configuration?: Settings;
}

/**
 * Abstract base for all process types.
 *
 * Extends {@link DescribedObject} with process-specific metadata:
 * type definition, configuration, features of interest, I/O ports,
 * and operating modes.
 *
 * @see OAS: AbstractProcess (L3599)
 * @see SensorML 3.0 §7.3 — AbstractProcess
 */
export interface AbstractProcess extends DescribedObject {
  /** Type of process — semantic URI (e.g. `'http://www.opengis.net/def/x'`). */
  definition?: string;
  /** Reference to a base process type that this one specialises. */
  typeOf?: Link;
  /** Value settings constraining the base process type. */
  configuration?: Settings;
  /** Sampling / domain features of interest (array of links). */
  featuresOfInterest?: FeatureList;
  /** Process inputs. */
  inputs?: InputList;
  /** Process outputs. */
  outputs?: OutputList;
  /** Process tuneable parameters. */
  parameters?: ParameterList;
  /** Predefined operating modes. */
  modes?: Mode[];
}

/**
 * Abstract base for physical process types.
 *
 * Extends {@link AbstractProcess} with physical-deployment metadata:
 * attachment, local reference frames, and position.
 *
 * @see OAS: AbstractPhysicalProcess (L4020)
 * @see SensorML 3.0 §7.6 — AbstractPhysicalProcess
 */
export interface AbstractPhysicalProcess extends AbstractProcess {
  /** Reference to the platform / component this is attached to. */
  attachedTo?: Link;
  /** Local spatial reference frames defined on this device. */
  localReferenceFrames?: SpatialFrame[];
  /** Local time reference frames defined on this device. */
  localTimeFrames?: TemporalFrame[];
  /** Position relative to an external reference frame. */
  position?: Position;
}

// ========================================
// §9 — Concrete Process Types
// ========================================

/**
 * Non-physical process with a single algorithmic method.
 *
 * Represents a computational algorithm or data-processing step
 * that does not involve a physical device.
 *
 * @see OAS: SimpleProcess (L3679)
 * @see SensorML 3.0 §7.4 — SimpleProcess
 */
export interface SimpleProcess extends AbstractProcess {
  /** Discriminator — always `'SimpleProcess'`. */
  type: 'SimpleProcess';
  /** Algorithmic method description. */
  method?: ProcessMethod;
}

/**
 * Non-physical aggregate of interconnected sub-processes.
 *
 * Represents a process chain or workflow composed of named
 * sub-process components connected by data links.
 *
 * @see OAS: AggregateProcess (L3698)
 * @see SensorML 3.0 §7.5 — AggregateProcess
 */
export interface AggregateProcess extends AbstractProcess {
  /** Discriminator — always `'AggregateProcess'`. */
  type: 'AggregateProcess';
  /** Named sub-process components. */
  components?: ComponentList;
  /** Data links between component ports. */
  connections?: ConnectionList;
}

/**
 * Physical process with a single sensor / actuator — no sub-components.
 *
 * Represents an individual physical device (sensor, actuator,
 * or other hardware) with position and reference-frame metadata.
 *
 * @see OAS: PhysicalComponent (L4102)
 * @see SensorML 3.0 §7.7 — PhysicalComponent
 */
export interface PhysicalComponent extends AbstractPhysicalProcess {
  /** Discriminator — always `'PhysicalComponent'`. */
  type: 'PhysicalComponent';
  /** Algorithmic method description. */
  method?: ProcessMethod;
}

/**
 * Physical system composed of interconnected sub-components.
 *
 * Represents a complete observing system (e.g. weather station,
 * UAV platform) containing multiple sensors, actuators, or
 * sub-systems connected by data links.
 *
 * @see OAS: PhysicalSystem (L4140)
 * @see SensorML 3.0 §7.8 — PhysicalSystem
 */
export interface PhysicalSystem extends AbstractPhysicalProcess {
  /** Discriminator — always `'PhysicalSystem'`. */
  type: 'PhysicalSystem';
  /** Named sub-process components. */
  components?: ComponentList;
  /** Data links between component ports. */
  connections?: ConnectionList;
}

// ----------------------------------------
// Discriminated Union
// ----------------------------------------

/**
 * Discriminated union of all four concrete SensorML process types.
 *
 * This is the SensorML representation of a "Procedure" resource.
 * The GeoJSON representation is the {@link Procedure} interface in `model.ts`.
 *
 * Narrow using the `type` property:
 * ```typescript
 * function handle(proc: SensorMLProcess) {
 *   switch (proc.type) {
 *     case 'SimpleProcess':       // proc: SimpleProcess
 *     case 'AggregateProcess':    // proc: AggregateProcess
 *     case 'PhysicalComponent':   // proc: PhysicalComponent
 *     case 'PhysicalSystem':      // proc: PhysicalSystem
 *   }
 * }
 * ```
 *
 * @see {@link Procedure} for the GeoJSON representation
 */
export type SensorMLProcess =
  | SimpleProcess
  | AggregateProcess
  | PhysicalComponent
  | PhysicalSystem;

// ----------------------------------------
// Component & Connection Types
// ----------------------------------------

/**
 * Component reference as a link (alternative to inline process).
 *
 * When a component is referenced rather than described inline,
 * the `type` property is `'Link'` — distinguishing it from the four
 * process-type discriminators.
 *
 * @see OAS: ComponentList item variant (link-2 with type const: Link)
 */
export interface ComponentLink {
  /** Discriminator — always `'Link'` for referenced components. */
  type: 'Link';
  /** Target URI of the referenced process. */
  href: string;
  /** Link relation type. */
  rel?: string;
  /** Human-readable title. */
  title?: string;
  /** Unique identifier of the linked resource. */
  uid?: string;
}

/**
 * Named component entry in a component list.
 *
 * Each entry is either an inline process description (one of the four
 * concrete types) or a {@link ComponentLink} reference.
 *
 * @see OAS: ComponentList (L4112)
 */
export type ComponentEntry = {
  /** Component name (from SoftNamedProperty wrapper). */
  name: string;
} & (SensorMLProcess | ComponentLink);

/**
 * Array of named sub-process components.
 *
 * @see OAS: ComponentList (L4112)
 */
export type ComponentList = ComponentEntry[];

/**
 * Data link between two component ports.
 *
 * Connects a source data path to a destination data path within
 * a process aggregate or physical system.
 *
 * @see OAS: ConnectionList (L4127)
 * @see SensorML 3.0 §7.5.2 — Connections
 */
export interface Connection {
  /** Source data path (e.g. `'components/sensor1/outputs/temperature'`). */
  source: PathRef;
  /** Destination data path (e.g. `'outputs/temperature'`). */
  destination: PathRef;
}

/**
 * Array of data links between component ports.
 *
 * @see OAS: ConnectionList (L4127)
 */
export type ConnectionList = Connection[];

// ========================================
// §10 — Type Constants
// ========================================

/**
 * String-literal union of all SensorML process-type discriminator values.
 *
 * Derived from `SensorMLProcess['type']` — automatically stays in sync.
 */
export type SensorMLProcessType = SensorMLProcess['type'];

/**
 * All valid SensorML process-type discriminator values as a const tuple.
 *
 * Useful for runtime validation:
 * ```typescript
 * if (SENSORML_PROCESS_TYPES.includes(json.type)) {
 *   // json is a SensorML process
 * }
 * ```
 */
export const SENSORML_PROCESS_TYPES = [
  'SimpleProcess',
  'AggregateProcess',
  'PhysicalComponent',
  'PhysicalSystem',
] as const;
