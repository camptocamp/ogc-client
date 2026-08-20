/**
 * OGC API — Connected Systems (Parts 1 & 2) URL builder and response parsers.
 *
 * **What this module is:** a URL builder + response parser for the
 * [OGC API — Connected Systems](https://docs.ogc.org/is/23-002/23-002.html)
 * standards Part 1 (Sensor Discovery) and Part 2 (Streams & Tasking).
 * `CSAPIQueryBuilder.get*()` methods return URL strings; the parser
 * functions (`parseDatastream`, `parseObservation`, `parseSystem`, …) take
 * the parsed JSON body and return strongly-typed model objects.
 *
 * **What this module is NOT:** an HTTP client. The library does not call
 * `fetch()` on your behalf for collection-resource queries — the consumer
 * is responsible for every request (auth headers, timeouts, retries,
 * `AbortSignal`, status-code handling, content-negotiation). This mirrors
 * the design of `EDRQueryBuilder` from the sibling `ogc-api/edr` module —
 * same pattern, same rationale.
 *
 * ## Making a request — the 5-step pattern
 *
 * 1. Construct an {@link OgcApiEndpoint} for the API root.
 * 2. Build a {@link CSAPIQueryBuilder} for the target collection.
 * 3. Call a `get*()` method to obtain a URL string.
 * 4. Issue the request yourself (`fetch`, `axios`, your wrapper of choice).
 * 5. Hand the parsed JSON body to the matching parser.
 *
 * @example
 * ```ts
 * import { OgcApiEndpoint } from '@camptocamp/ogc-client';
 * import {
 *   createCSAPIBuilder,
 *   parseDatastream,
 * } from '@camptocamp/ogc-client/csapi';
 *
 * // 1. Endpoint → 2. Builder → 3. URL → 4. fetch → 5. parse
 * const endpoint = new OgcApiEndpoint('https://api.example.com');
 * const builder = await createCSAPIBuilder(endpoint, 'weather-stations');
 * const url = builder.getDatastreams({ limit: 10 });
 * const response = await fetch(url, {
 *   headers: { Authorization: 'Bearer ...' },
 * });
 * const body = (await response.json()) as { items: unknown[] };
 * const datastreams = body.items.map(parseDatastream);
 * ```
 *
 * ## Pagination
 *
 * All `get*()` list methods follow the OGC API Common pagination contract:
 * the **server** picks the default page size when `limit` is unspecified
 * (defaults vary — `connected-systems-go` returns 10, OpenSensorHub returns
 * 100), and the consumer is responsible for following `rel: "next"` links
 * from the response body's `links` array to retrieve subsequent pages.
 * This module does **not** auto-paginate. See
 * [`integration/observation.spec.ts`](./integration/observation.spec.ts)
 * for the canonical link-walking pattern, and the
 * {@link CSAPIQueryBuilder} class docblock for the full contract. An
 * opt-in async-iterator helper is deferred to issue
 * [#170](https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/170).
 *
 * @see {@link CSAPIQueryBuilder} — all available URL-building methods
 * @see {@link createCSAPIBuilder} — the factory entry point
 * @see https://docs.ogc.org/is/23-001/23-001.html — OGC API CS Part 1
 * @see https://docs.ogc.org/is/23-002/23-002.html — OGC API CS Part 2
 *
 * @module csapi
 */

// ── Factory Function ───────────────────────────────────────
export { createCSAPIBuilder } from './factory.js';

// ── Query Builder ──────────────────────────────────────────
export { default as CSAPIQueryBuilder } from './url_builder.js';

// ── Model Values ───────────────────────────────────────────
export {
  CSAPIResourceTypes,
  CommandStatusCodes,
  SystemTypeUris,
} from './model.js';

// ── Model Types ────────────────────────────────────────────
export type {
  CSAPIResourceType,
  CommandStatusCode,
  SystemTypeUri,
  TimeInterval,
  ResourceLink,
  CSAPICollectionRef,
  CSAPIResourceRef,
  CsapiDateTimeParameter,
  QueryOptions as CSAPIQueryOptions,
  SystemQueryOptions,
  DeploymentQueryOptions,
  ProcedureQueryOptions,
  SamplingFeatureQueryOptions,
  PropertyQueryOptions,
  DatastreamQueryOptions,
  ObservationQueryOptions,
  ControlStreamQueryOptions,
  CommandQueryOptions,
  CommandStatusQueryOptions,
  System,
  Deployment,
  Procedure,
  SamplingFeature,
  Property,
  Datastream,
  Observation,
  ControlStream,
  Command,
  CommandStatus,
  FeatureCollection,
  ItemCollection,
  SystemCollection,
  DeploymentCollection,
  ProcedureCollection,
  SamplingFeatureCollection,
  PropertyCollection,
  DatastreamCollection,
  ObservationCollection,
  ControlStreamCollection,
  CommandCollection,
  CommandStatusCollection,
  DatastreamSchemaResponse,
  ControlStreamSchemaResponse,
} from './model.js';

// ── Format Handler Values ──────────────────────────────────
export {
  SOSA_NS,
  SSN_NS,
  SENSORML_NS,
  isCSAPIFeature,
  getCSAPIResourceType,
  parseValidTime,
  isValidUri,
  extractCSAPIFeature,
  parseSensorML30,
  parseSWEComponent,
  parseVector,
  parseMatrix,
  parseDataChoice,
  parseGeometry,
  detectEncoding,
  validateAgainstSchema,
  CSAPI_CONTENT_TYPES,
  getContentTypeForResource,
  parseProperty,
  parseDatastream,
  parseObservation,
  parseControlStream,
  parseCommand,
  parseCommandStatus,
  normalizeStatusCode,
  parseDatastreamSchemaResponse,
  parseControlStreamSchemaResponse,
} from './formats/index.js';

// ── Format Handler Types ───────────────────────────────────
export type { CSAPIResourceTypeName } from './formats/index.js';
export type {
  SensorMLProcess,
  SensorMLProcessType,
  PhysicalSystem,
  PhysicalComponent,
  SimpleProcess,
  AggregateProcess,
  DescribedObject,
  AbstractProcess,
  AbstractPhysicalProcess,
  CapabilityList,
  CharacteristicList,
  Term,
  ComponentList,
  ComponentEntry,
  ConnectionList,
  Connection,
  Settings,
  Link as SensorMLLink,
  ResponsibleParty,
  InputList,
  OutputList,
  ParameterList,
  IOComponentChoice,
  Mode,
  SensorMLEvent,
  Position,
  Pose,
  GeoJsonPoint,
  Document as SensorMLDocument,
  FeatureList,
  LegalConstraint,
  SecurityConstraint,
  ContactInfo,
  ContactLink,
  ObservableProperty,
  AnyProperty,
  ProcessMethod,
  SpatialFrame,
  TemporalFrame,
  TimePeriod,
  TimeInstant,
  TimeInstantOrPeriod,
  ComponentLink,
  SettingValue,
  SettingArrayValue,
  SettingMode,
  SetConstraint,
  SettingStatus,
  FrameAxis,
} from './formats/index.js';
export type {
  AnyComponent,
  AnyScalarComponent,
  AnySimpleComponent,
  DataRecord,
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
  DataEncoding,
  TextEncoding,
  JSONEncoding,
  BinaryEncoding,
  XMLEncoding,
  ValidationResult,
  UnitOfMeasure,
  AllowedValues,
  AllowedTokens,
  AllowedTimes,
  DataField,
  TypedDataField,
  ElementCount,
  EncodedValues,
  AssociationAttributeGroup,
  NilValue,
  NilValuesNumber,
  NilValuesInteger,
  NilValuesText,
  NilValuesTime,
  NumberOrSpecial,
  DateTimeNumberOrSpecial,
  GeometryConstraint,
  GeometryType,
  GeoJsonGeometry,
  BinaryMember,
  BinaryComponent,
  BinaryBlock,
  ValidationError,
} from './formats/index.js';
