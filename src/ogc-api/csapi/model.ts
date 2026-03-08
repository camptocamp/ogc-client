import type {
  BoundingBox,
  DateTimeParameter,
  CrsCode,
  MimeType,
} from '../../shared/models.js';
import type { OgcApiDocumentLink } from '../model.js';
import type { Geometry } from 'geojson';

/**
 * Extends {@link DateTimeParameter} with the CSAPI Part 2 `'latest'` keyword.
 *
 * The `resultTime` parameter on DataStream and Observation endpoints supports
 * the special value `'latest'` to retrieve the most recent result. This type
 * alias keeps the `'latest'` keyword scoped to CSAPI without modifying the
 * shared `DateTimeParameter` used by EDR and other OGC API modules.
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */
export type CsapiDateTimeParameter = DateTimeParameter | 'latest';

// ========================================
// CSAPI Resource Type Constants
// ========================================

/**
 * All CSAPI resource types as defined in OGC API - Connected Systems Parts 1 & 2.
 *
 * Part 1: systems, deployments, samplingFeatures, procedures, properties
 * Part 2: datastreams, observations, controlStreams, commands
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */
export const CSAPIResourceTypes = [
  'systems',
  'deployments',
  'samplingFeatures',
  'procedures',
  'properties',
  'datastreams',
  'observations',
  'controlStreams',
  'commands',
] as const;

/** Union type of all CSAPI resource type strings. */
export type CSAPIResourceType = (typeof CSAPIResourceTypes)[number];

// ========================================
// Command Status Code
// ========================================

/**
 * Status codes for commands as defined in OGC API - Connected Systems Part 2.
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */
export const CommandStatusCodes = [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'SCHEDULED',
  'UPDATED',
  'CANCELED',
  'EXECUTING',
  'FAILED',
  'COMPLETED',
] as const;

/** Union type of all command status code strings. */
export type CommandStatusCode = (typeof CommandStatusCodes)[number];

// ========================================
// System Type URIs
// ========================================

/**
 * Discriminator URIs for the `featureType` property on System resources.
 * @see https://docs.ogc.org/is/23-001/23-001.html#_system_resources
 */
export const SystemTypeUris = [
  'http://www.w3.org/ns/sosa/Sensor',
  'http://www.w3.org/ns/sosa/Actuator',
  'http://www.w3.org/ns/sosa/Platform',
  'http://www.w3.org/ns/sosa/Sampler',
  'http://www.w3.org/ns/sosa/System',
] as const;

/** Union type of system featureType discriminator URIs. */
export type SystemTypeUri = (typeof SystemTypeUris)[number];

// ========================================
// Helper Types
// ========================================

/**
 * A time interval with a required start and optional end.
 * Used by `validTime`, `phenomenonTime`, `resultTime`, etc.
 */
export interface TimeInterval {
  start: Date;
  end?: Date;
}

/**
 * HATEOAS link extended with CSAPI-relevant `rel` values.
 * @see https://docs.ogc.org/is/23-001/23-001.html#_link_relations
 */
export type ResourceLink = OgcApiDocumentLink;

/**
 * Parsed form of a CS API `@link` inline property.
 *
 * `@link` properties appear on Part 1 GeoJSON resources to encode structural
 * associations between resources (e.g., which procedure a system implements,
 * which platform a deployment sits on). They are distinct from the HATEOAS
 * `links[]` array which provides navigation URLs.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html §16 — JSON encoding for Part 1 resources
 */
export interface CSAPIResourceRef {
  /** URL of the referenced resource. */
  href: string;
  /** Globally unique identifier of the referenced resource. */
  uid?: string;
  /** Human-readable title. */
  title?: string;
  /** Resource type URI. */
  rt?: string;
}

// ========================================
// Query Options
// ========================================

/**
 * Base query options shared by all CSAPI resource list endpoints.
 *
 * These parameters map to the standard OGC API query parameters for
 * filtering, pagination, and format selection. All properties are optional;
 * omitting them returns a default-paginated, unfiltered list.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html#_query_parameters
 */
export interface QueryOptions {
  /** Maximum number of resources to return. */
  limit?: number;
  /** Offset-based pagination: number of resources to skip. */
  offset?: number;
  /** Cursor-based pagination: opaque token from a previous response. */
  cursor?: string;
  /** Spatial filter: bounding box [minx, miny, maxx, maxy]. */
  bbox?: BoundingBox;
  /** Temporal filter: single instant or interval. */
  datetime?: DateTimeParameter;
  /** Free-text search query. */
  q?: string;
  /** Filter by local resource ID(s). */
  id?: string | string[];
  /** Filter by globally unique identifier URI(s). */
  uid?: string | string[];
  /** Response format. */
  f?: MimeType;
  /** Coordinate reference system for response geometries. */
  crs?: CrsCode;
  /**
   * Sort results by one or more property names.
   * Single property: `'phenomenonTime'`
   * Multiple properties: `['phenomenonTime', 'resultTime']`
   * @see https://docs.ogc.org/is/23-001/23-001.html
   */
  sortBy?: string | string[];
  /**
   * Sort direction. Applies to all properties in `sortBy`.
   * @default Server-defined (typically `'asc'`)
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Query options for System list endpoints.
 * @see https://docs.ogc.org/is/23-001/23-001.html#_system_resources
 */
export interface SystemQueryOptions extends QueryOptions {
  /** Filter by parent system ID (for subsystem queries). */
  parent?: string;
  /** Filter by procedure ID. */
  procedureId?: string;
  /** Filter by feature of interest ID. */
  foiId?: string;
  /** Filter by observed property ID. */
  observedPropertyId?: string;
  /** Filter by controlled property ID. */
  controlledPropertyId?: string;
  /** Include subsystems recursively. */
  recursive?: boolean;
}

/**
 * Query options for Deployment list endpoints.
 * @see https://docs.ogc.org/is/23-001/23-001.html#_deployment_resources
 */
export interface DeploymentQueryOptions extends QueryOptions {
  /** Filter by parent deployment ID (for subdeployment queries). */
  parent?: string;
  /** Filter by deployed system ID. */
  systemId?: string;
  /** Include subdeployments recursively. */
  recursive?: boolean;
}

/**
 * Query options for Procedure list endpoints.
 * @see https://docs.ogc.org/is/23-001/23-001.html#_procedure_resources
 */
export type ProcedureQueryOptions = QueryOptions;

/**
 * Query options for SamplingFeature list endpoints.
 * @see https://docs.ogc.org/is/23-001/23-001.html#_samplingfeature_resources
 */
export type SamplingFeatureQueryOptions = QueryOptions;

/**
 * Query options for Property list endpoints.
 * @see https://docs.ogc.org/is/23-001/23-001.html#_property_resources
 */
export interface PropertyQueryOptions extends QueryOptions {
  /** Filter by system ID — returns properties observed/actuated by this system. */
  system?: string;
  /** Filter by base property URI — returns properties derived from this base. */
  baseProperty?: string;
}

/**
 * Query options for DataStream list endpoints.
 * @see https://docs.ogc.org/is/23-002/23-002.html#_datastream_resources
 */
export interface DatastreamQueryOptions extends QueryOptions {
  /** Filter by system ID. */
  systemId?: string;
  /** Filter by observed property ID. */
  observedPropertyId?: string;
  /** Filter by phenomenon time interval. */
  phenomenonTime?: DateTimeParameter;
  /** Filter by result time interval or the special `'latest'` keyword. */
  resultTime?: CsapiDateTimeParameter;
  /**
   * Filter by feature-of-interest ID.
   * @see https://docs.ogc.org/is/23-002/23-002.html#clause-datastream-query-params §13.2.4 Req 48
   */
  foiId?: string;
}

/**
 * Query options for Observation list endpoints.
 * @see https://docs.ogc.org/is/23-002/23-002.html#_observation_resources
 */
export interface ObservationQueryOptions extends QueryOptions {
  /** Filter by phenomenon time interval. */
  phenomenonTime?: DateTimeParameter;
  /** Filter by result time interval or the special `'latest'` keyword. */
  resultTime?: CsapiDateTimeParameter;
  /**
   * Filter by feature-of-interest ID.
   * @see https://docs.ogc.org/is/23-002/23-002.html#clause-observation-query-params §13.3.3 Req 51
   */
  foiId?: string;
}

/**
 * Query options for ControlStream list endpoints.
 * @see https://docs.ogc.org/is/23-002/23-002.html#_controlstream_resources
 */
export interface ControlStreamQueryOptions extends QueryOptions {
  /** Filter by system ID. */
  systemId?: string;
  /** Filter by controlled property ID. */
  controlledPropertyId?: string;
  /**
   * Filter by issue time interval.
   * @see https://docs.ogc.org/is/23-002/23-002.html#clause-controlstream-query-params §13.4.1 Req 52
   */
  issueTime?: DateTimeParameter;
  /**
   * Filter by execution time interval.
   * @see https://docs.ogc.org/is/23-002/23-002.html#clause-controlstream-query-params §13.4.2 Req 53
   */
  executionTime?: DateTimeParameter;
  /**
   * Filter by feature-of-interest ID.
   * @see https://docs.ogc.org/is/23-002/23-002.html#clause-controlstream-query-params §13.4.4 Req 55
   */
  foiId?: string;
}

/**
 * Query options for Command list endpoints.
 * @see https://docs.ogc.org/is/23-002/23-002.html#_command_resources
 */
export interface CommandQueryOptions extends QueryOptions {
  /** Filter by issue time interval. */
  issueTime?: DateTimeParameter;
  /** Filter by execution time interval. */
  executionTime?: DateTimeParameter;
  /** Filter by current status code. */
  currentStatus?: CommandStatusCode;
  /**
   * Filter by command sender.
   * @see https://docs.ogc.org/is/23-002/23-002.html#clause-command-query-params §13.5.4 Req 59
   */
  sender?: string;
  /**
   * Filter by feature-of-interest ID.
   * @see https://docs.ogc.org/is/23-002/23-002.html#clause-command-query-params §13.5.5 Req 60
   */
  foiId?: string;
}

/**
 * Query options for CommandStatus list endpoints.
 * @see https://docs.ogc.org/is/23-002/23-002.html#_command_resources
 * @see https://docs.ogc.org/is/23-002/23-002.html#_CommandStatus_Query_Params §13.6.1 Req 61
 */
export interface CommandStatusQueryOptions extends QueryOptions {
  /** Filter by status code. */
  statusCode?: CommandStatusCode;
}

// ========================================
// Part 1 Resource Interfaces (GeoJSON)
// ========================================

/**
 * A System resource in GeoJSON format.
 *
 * Systems represent sensing, actuating, sampling, or computational assets
 * (sensors, platforms, actuators, samplers, or composite systems).
 *
 * Required properties: `featureType`, `uid`, `name` (per OGC spec).
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html#_system_resources
 */
export interface System {
  /** Server-assigned local identifier (read-only). */
  id: string;
  type: 'Feature';
  properties: {
    /** Discriminator URI indicating the system type. */
    featureType: SystemTypeUri | string;
    /** Globally unique identifier URI (required by spec). */
    uid: string;
    /** Human-readable name. */
    name: string;
    /** Human-readable description. */
    description?: string;
    /** Asset type classification. */
    assetType?:
      | 'Equipment'
      | 'Human'
      | 'LivingThing'
      | 'Simulation'
      | 'Process'
      | 'Group'
      | 'Other';
    /** Validity time period for this system. */
    validTime?: TimeInterval;
    /**
     * Link to the procedure/method this system implements (from `systemKind@link`).
     * @see https://docs.ogc.org/is/23-001/23-001.html §8.3 Table 8 — Conditional (when a procedure exists)
     */
    systemKindLink?: CSAPIResourceRef;
  };
  geometry?: Geometry;
  links: ResourceLink[];
}

/**
 * A Deployment resource in GeoJSON format.
 *
 * Deployments represent the deployment of one or more systems at a location
 * for a specific time period.
 *
 * Required properties per OGC 23-001 Table 10: `featureType`, `uid`, `name`,
 * `validTime`.  However, §8.7 Requirement 3B explicitly handles the case where
 * "the validTime attribute is null or not set", and some servers (e.g. OSH)
 * omit it in practice.  `validTime` is therefore typed as **optional** here
 * to follow Postel's Law — be liberal in what you accept.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html#_deployment_resources
 */
export interface Deployment {
  /** Server-assigned local identifier (read-only). */
  id: string;
  type: 'Feature';
  properties: {
    /** Discriminator URI (sosa:Deployment). */
    featureType: string;
    /** Globally unique identifier URI (required by spec). */
    uid: string;
    /** Human-readable name. */
    name: string;
    /** Human-readable description. */
    description?: string;
    /**
     * Time period during which systems are deployed.
     *
     * OGC 23-001 Table 10 marks this as "Required", but §8.7 Req 3B
     * explicitly handles missing/null validTime.  Typed optional to
     * tolerate servers that omit it.
     */
    validTime?: TimeInterval;
    /**
     * Link to the platform system (from `platform@link`).
     * @see https://docs.ogc.org/is/23-001/23-001.html §8.5 Table 10 — Optional
     */
    platformLink?: CSAPIResourceRef;
    /**
     * Links to deployed systems (from `deployedSystems@link`).
     * @see https://docs.ogc.org/is/23-001/23-001.html §8.5 Table 10 — Required (array)
     */
    deployedSystemsLink?: CSAPIResourceRef[];
  };
  geometry?: Geometry;
  links: ResourceLink[];
}

/**
 * A Procedure resource in GeoJSON format.
 *
 * Procedures describe methodologies for observation, actuation, or sampling.
 * In GeoJSON encoding, geometry is always null; detailed descriptions use SensorML.
 *
 * When the same Procedure resource is requested with
 * `Accept: application/sml+json`, the server returns it as one of four
 * concrete SensorML 3.0 process types: {@link SimpleProcess},
 * {@link AggregateProcess}, {@link PhysicalComponent}, or
 * {@link PhysicalSystem} (collectively {@link SensorMLProcess}).
 *
 * Required properties: `featureType`, `uid`, `name` (per OGC spec).
 *
 * @see {@link SensorMLProcess} for the SensorML representation of this resource
 * @see ../formats/sensorml/types.ts — SensorML 3.0 type definitions
 * @see https://docs.ogc.org/is/23-001/23-001.html#_procedure_resources
 */
export interface Procedure {
  /** Server-assigned local identifier (read-only). */
  id: string;
  type: 'Feature';
  properties: {
    /** Discriminator URI indicating the procedure type. */
    featureType: string;
    /** Globally unique identifier URI (required by spec). */
    uid: string;
    /** Human-readable name. */
    name: string;
    /** Human-readable description. */
    description?: string;
  };
  /** Always null in GeoJSON encoding. */
  geometry: null;
  links: ResourceLink[];
}

/**
 * A SamplingFeature resource in GeoJSON format.
 *
 * Sampling features represent the spatial or physical entity at or on which
 * observations are made (e.g., a monitoring station, a transect, a specimen).
 *
 * Required properties: `featureType`, `uid`, `name` (per OGC spec).
 * The `sampledFeature@link` link relation is also required.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html#_samplingfeature_resources
 */
export interface SamplingFeature {
  /** Server-assigned local identifier (read-only). */
  id: string;
  type: 'Feature';
  properties: {
    /** Type URI for the sampling feature. */
    featureType: string;
    /** Globally unique identifier URI (required by spec). */
    uid: string;
    /** Human-readable name. */
    name: string;
    /** Human-readable description. */
    description?: string;
    /** Optional validity time period. */
    validTime?: TimeInterval;
    /**
     * Link to the sampled feature (from `sampledFeature@link`).
     * @see https://docs.ogc.org/is/23-001/23-001.html §8.9 Table 14 — Required
     */
    sampledFeatureLink?: CSAPIResourceRef;
  };
  geometry?: Geometry;
  links: ResourceLink[];
}

/**
 * A Property resource (DerivedProperty).
 *
 * Properties define observable or controllable quantities. Unlike other Part 1
 * resources, Property is NOT a GeoJSON Feature — it is a flat SWE Common object.
 *
 * Required properties: `label`, `uniqueId`, `baseProperty` (per OGC spec).
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html#_property_resources
 */
export interface Property {
  /** Server-assigned local identifier (read-only). */
  id?: string;
  /** Human-readable label (required). */
  label: string;
  /** Human-readable description. */
  description?: string;
  /** Globally unique identifier URI (required). */
  uniqueId: string;
  /** URI of the base property this is derived from (required). */
  baseProperty: string;
  /** URI of the object type this property applies to. */
  objectType?: string;
  /** URI of the statistic type (e.g., mean, max). */
  statistic?: string;
  links?: ResourceLink[];
}

// ========================================
// Part 2 Resource Interfaces
// ========================================

/**
 * A DataStream resource.
 *
 * DataStreams represent a stream of observations from a system, linking
 * a system to its observed properties and observation results.
 *
 * Required properties: `name`, `system@link`, `observedProperties`,
 * `phenomenonTime`, `resultTime`, `resultType`, `live` (per OGC spec).
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html#_datastream_resources
 */
export interface Datastream {
  /** Server-assigned local identifier (read-only). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Human-readable description. */
  description?: string;
  /** Validity time period. */
  validTime?: TimeInterval;
  /** Supported response formats (read-only). */
  formats: string[];
  /** Name of the system output this datastream represents. */
  outputName?: string;
  /** IDs/URIs of observed properties (read-only). */
  observedProperties: string[];
  /** Time extent of phenomenon times in this datastream (read-only, null if empty). */
  phenomenonTime: TimeInterval | null;
  /** Time extent of result times in this datastream (read-only, null if empty). */
  resultTime: TimeInterval | null;
  /** Type of result values. */
  resultType: 'measure' | 'vector' | 'record' | 'coverage' | 'complex' | null;
  /** Whether this datastream provides live data. */
  live: boolean | null;
  /** Datastream classification: status reporting or observation. */
  type?: 'status' | 'observation';
  links: ResourceLink[];
  /** ID of the parent system (from `system@id` in raw JSON). @see OGC 23-002 §9.2 Table 5 */
  systemId?: string;
}

/**
 * An Observation resource.
 *
 * Observations represent individual observation events with a result value.
 * Not a GeoJSON Feature — flat object.
 *
 * Required properties: `resultTime` (per OGC spec).
 * Must have either `result` (inline) or a result link.
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html#_observation_resources
 */
export interface Observation {
  /** Server-assigned local identifier (read-only). */
  id: string;
  /** Phenomenon time (defaults to resultTime if not provided). */
  phenomenonTime?: string;
  /** Time at which the result was produced (required). */
  resultTime: string;
  /** Parameters associated with this observation. */
  parameters?: Record<string, unknown>;
  /** Inline result value (type depends on observed property). */
  result?: unknown;
  links?: ResourceLink[];
  /** ID of the parent datastream (from `datastream@id` in raw JSON). @see OGC 23-002 §9.7 Table 7 */
  datastreamId?: string;
  /** ID of the sampling feature (from `samplingFeature@id` in raw JSON). @see OGC 23-002 §9.7 Table 7 */
  samplingFeatureId?: string;
  /** ID of the feature of interest (from `foi@id` in raw JSON). @see OGC 23-002 §9.7 Table 7 */
  featureOfInterestId?: string;
}

/**
 * A ControlStream resource.
 *
 * ControlStreams represent a channel for sending commands to a system,
 * linking a system to its controllable properties.
 *
 * Required properties: `name`, `system@link`, `controlledProperties`,
 * `issueTime`, `executionTime`, `live`, `async` (per OGC spec).
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html#_controlstream_resources
 */
export interface ControlStream {
  /** Server-assigned local identifier (read-only). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Human-readable description. */
  description?: string;
  /** Validity time period. */
  validTime?: TimeInterval;
  /** Supported response formats (read-only). */
  formats: string[];
  /** Name of the system input this control stream represents. */
  inputName?: string;
  /** IDs/URIs of controlled properties (read-only). */
  controlledProperties: string[];
  /** Time extent of command issue times (read-only, null if empty). */
  issueTime: TimeInterval | null;
  /** Time extent of command execution times (read-only, null if empty). */
  executionTime: TimeInterval | null;
  /** Whether this control stream accepts live commands. */
  live: boolean | null;
  /** Whether commands are handled asynchronously. */
  async: boolean;
  links: ResourceLink[];
  /** ID of the parent system (from `system@id` in raw JSON). @see OGC 23-002 §10.2 Table 10 */
  systemId?: string;
}

/**
 * A Command resource.
 *
 * Commands represent tasking requests sent to a system via a control stream.
 * Not a GeoJSON Feature — flat object.
 *
 * Required properties: `issueTime`, `parameters` (per OGC spec).
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html#_command_resources
 */
export interface Command {
  /** Server-assigned local identifier (read-only). */
  id: string;
  /** Time the command was issued (read-only). */
  issueTime: string;
  /** Execution time period (read-only). */
  executionTime?: TimeInterval;
  /** Identity of the command sender (read-only). */
  sender?: string;
  /** Current status of the command (read-only). */
  currentStatus?: CommandStatusCode;
  /** Command parameters (required). */
  parameters: Record<string, unknown>;
  links?: ResourceLink[];
  /** ID of the parent control stream (from `controlstream@id` in raw JSON). @see OGC 23-002 §10.7 Table 12 */
  controlStreamId?: string;
}

/**
 * A CommandStatus resource.
 *
 * Represents a status update for a command.
 *
 * Required properties: `reportTime`, `statusCode` (per OGC spec).
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html#_command_resources
 */
export interface CommandStatus {
  /** Server-assigned local identifier (read-only). */
  id: string;
  /** Time the status was reported (read-only). */
  reportTime: string;
  /** Status code. */
  statusCode: CommandStatusCode;
  /** Completion percentage (0-100). */
  percentCompletion?: number;
  /** Execution time period. */
  executionTime?: TimeInterval;
  /** Human-readable status message. */
  message?: string;
  links?: ResourceLink[];
  /** ID of the parent command (from `command@id` in raw JSON). @see OGC 23-002 §10.11 Table 15 */
  commandId?: string;
}

// ========================================
// Schema Response Types
// ========================================

/**
 * Parsed response from the `/datastreams/{id}/schema` endpoint.
 *
 * The schema format varies by `obsFormat`:
 * - JSON format (`application/om+json`): uses `resultSchema`
 * - SWE Common format (`application/swe+json`): uses `recordSchema` + `encoding`
 *
 * Schema fields are parsed via `parseSWEComponent()` from the SWE Common parser
 * layer. The `encoding` field is parsed via `parseEncoding()`.
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html — Datastream schema endpoint
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/17 — Demo app finding F-14
 */
export interface DatastreamSchemaResponse {
  /** The observation format identifier (e.g., `"application/om+json"`). */
  obsFormat: string;
  /** Result schema for JSON observation format. Parsed via `parseSWEComponent()`. */
  resultSchema?: import('./formats/swecommon/types.js').AnyComponent;
  /** Record schema for SWE Common observation format. Parsed via `parseSWEComponent()`. */
  recordSchema?: import('./formats/swecommon/types.js').AnyComponent;
  /** Encoding descriptor for SWE Common observation format. Parsed via `parseEncoding()`. */
  encoding?: import('./formats/swecommon/types.js').DataEncoding;
}

/**
 * Typed representation of the response from a Control Stream schema endpoint
 * (`/controlstreams/{id}/schema`).
 *
 * This is the Phase 5 Task 7b counterpart to {@link DatastreamSchemaResponse}.
 * The response varies by command format:
 * - **JSON format** (`application/json`): contains `parametersSchema` — a
 *   SWE Common component describing the command parameters structure.
 *
 * Schema fields are parsed via `parseSWEComponent()` from the SWE Common parser
 * layer. The `encoding` field is parsed via `parseEncoding()`.
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html — Control stream schema endpoint
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/87 — Task 7b
 */
export interface ControlStreamSchemaResponse {
  /** The command format identifier (e.g., `"application/json"`). */
  commandFormat: string;
  /** Parameters schema for the command. Parsed via `parseSWEComponent()`. */
  parametersSchema?: import('./formats/swecommon/types.js').AnyComponent;
  /** Encoding descriptor for SWE Common command format. Parsed via `parseEncoding()`. */
  encoding?: import('./formats/swecommon/types.js').DataEncoding;
}

// ========================================
// Collection Types
// ========================================

/**
 * A GeoJSON FeatureCollection response for Part 1 resources.
 * @see https://docs.ogc.org/is/23-001/23-001.html#_response_schema
 */
export interface FeatureCollection<T> {
  type: 'FeatureCollection';
  features: T[];
  links: ResourceLink[];
  numberMatched?: number;
  numberReturned: number;
  timeStamp?: string;
}

/**
 * A collection response for Part 2 resources (not GeoJSON).
 * @see https://docs.ogc.org/is/23-002/23-002.html#_response_schema
 */
export interface ItemCollection<T> {
  items: T[];
  links: ResourceLink[];
  numberMatched?: number;
  numberReturned: number;
  timeStamp?: string;
}

/** Collection of System features. */
export type SystemCollection = FeatureCollection<System>;
/** Collection of Deployment features. */
export type DeploymentCollection = FeatureCollection<Deployment>;
/** Collection of Procedure features. */
export type ProcedureCollection = FeatureCollection<Procedure>;
/** Collection of SamplingFeature features. */
export type SamplingFeatureCollection = FeatureCollection<SamplingFeature>;
/** Collection of Property items. */
export type PropertyCollection = ItemCollection<Property>;
/** Collection of Datastream items. */
export type DatastreamCollection = ItemCollection<Datastream>;
/** Collection of Observation items. */
export type ObservationCollection = ItemCollection<Observation>;
/** Collection of ControlStream items. */
export type ControlStreamCollection = ItemCollection<ControlStream>;
/** Collection of Command items. */
export type CommandCollection = ItemCollection<Command>;
/** Collection of CommandStatus items. */
export type CommandStatusCollection = ItemCollection<CommandStatus>;
