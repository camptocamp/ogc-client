/**
 * SensorML 3.0 PhysicalSystem & PhysicalComponent sub-parser.
 *
 * Parses raw JSON objects with `type: 'PhysicalSystem'` or
 * `type: 'PhysicalComponent'` into their respective typed instances.
 * Both concrete types extend {@link AbstractPhysicalProcess}, so this
 * file shares the physical-process-level parsing logic (`attachedTo`,
 * `localReferenceFrames`, `localTimeFrames`, `position`) and adds
 * the type-specific properties:
 *
 * - **PhysicalSystem**: `components`, `connections`
 * - **PhysicalComponent**: `method`
 *
 * This is a sub-parser — it is intended to be called by the main
 * SensorML parser (`parseSensorML30()`) when the `type` discriminator is
 * `'PhysicalSystem'` or `'PhysicalComponent'`.
 *
 * @see https://docs.ogc.org/is/23-000/23-000.html — OGC SensorML 3.0
 * @see OAS: PhysicalSystem (L4140), PhysicalComponent (L4102),
 *   AbstractPhysicalProcess (L4020), Position (L3998),
 *   SpatialFrame (L3961), TemporalFrame (L3987)
 * @module
 */

import type {
  PhysicalSystem,
  PhysicalComponent,
  InputList,
  OutputList,
  ParameterList,
  SpatialFrame,
  TemporalFrame,
  FrameAxis,
  Position,
  GeoJsonPoint,
  Pose,
} from './types.js';
import { SensorMLParseError } from './errors.js';
import {
  isRecord,
  optionalString,
  parseLink,
  parseProcessMethod,
  parseIOList,
  parseSettings,
  parseFeatureList,
  parseModes,
  parseComponentList,
  parseConnectionList,
} from './_helpers.js';

export { SensorMLParseError };
export {
  parseProcessMethod,
  parseComponentEntry,
  parseComponentList,
  parseConnectionList,
} from './_helpers.js';

// ========================================
// Internal Helpers — AbstractPhysicalProcess
// ========================================

/**
 * Parse a {@link FrameAxis} entry.
 *
 * Each axis requires a `name` (string) and a `description` (string)
 * per the OAS SpatialFrame schema.
 *
 * @param value - Raw JSON value
 * @param index - Array index for error messages
 * @returns Parsed FrameAxis
 * @throws {SensorMLParseError} If invalid
 * @see OAS: SpatialFrame.axes
 */
function parseFrameAxis(value: unknown, index: number): FrameAxis {
  if (!isRecord(value)) {
    throw new SensorMLParseError(`axes[${index}] must be an object`);
  }
  if (typeof value.name !== 'string') {
    throw new SensorMLParseError(
      `axes[${index}] must have a string "name" property`
    );
  }
  if (typeof value.description !== 'string') {
    throw new SensorMLParseError(
      `axes[${index}] must have a string "description" property`
    );
  }
  return { name: value.name, description: value.description };
}

/**
 * Parse a {@link SpatialFrame}.
 *
 * Requires `origin` (string) and `axes` (array with ≥ 1 element).
 *
 * @param value - Raw JSON value
 * @param index - Array index for error messages
 * @returns Parsed SpatialFrame
 * @throws {SensorMLParseError} If the frame is missing required fields
 * @see OAS: SpatialFrame (L3961)
 * @see SensorML 3.0 §7.6.2 — Local Reference Frames
 */
function parseSpatialFrame(value: unknown, index: number): SpatialFrame {
  if (!isRecord(value)) {
    throw new SensorMLParseError(
      `localReferenceFrames[${index}] must be an object`
    );
  }
  if (typeof value.origin !== 'string') {
    throw new SensorMLParseError(
      `localReferenceFrames[${index}] must have a string "origin" property`
    );
  }
  if (!Array.isArray(value.axes) || value.axes.length === 0) {
    throw new SensorMLParseError(
      `localReferenceFrames[${index}] must have a non-empty "axes" array`
    );
  }
  const axes = value.axes.map((a: unknown, ai: number) =>
    parseFrameAxis(a, ai)
  );

  const frame: SpatialFrame = { origin: value.origin, axes };
  if (typeof value.id === 'string') frame.id = value.id;
  if (typeof value.label === 'string') frame.label = value.label;
  if (typeof value.description === 'string')
    frame.description = value.description;
  return frame;
}

/**
 * Parse an array of {@link SpatialFrame} entries.
 *
 * @param value - Raw JSON value
 * @returns Parsed array, or `undefined` if absent/null
 * @throws {SensorMLParseError} If present but not an array, or if any
 *   frame is invalid
 * @see OAS: AbstractPhysicalProcess.localReferenceFrames (L4020)
 */
function parseSpatialFrames(value: unknown): SpatialFrame[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new SensorMLParseError('"localReferenceFrames" must be an array');
  }
  return value.map((item, i) => parseSpatialFrame(item, i));
}

/**
 * Parse a {@link TemporalFrame}.
 *
 * Requires `origin` (string) — the epoch description.
 *
 * @param value - Raw JSON value
 * @param index - Array index for error messages
 * @returns Parsed TemporalFrame
 * @throws {SensorMLParseError} If the frame is missing required fields
 * @see OAS: TemporalFrame (L3987)
 * @see SensorML 3.0 §7.6.3 — Local Time Frames
 */
function parseTemporalFrame(value: unknown, index: number): TemporalFrame {
  if (!isRecord(value)) {
    throw new SensorMLParseError(`localTimeFrames[${index}] must be an object`);
  }
  if (typeof value.origin !== 'string') {
    throw new SensorMLParseError(
      `localTimeFrames[${index}] must have a string "origin" property`
    );
  }
  const frame: TemporalFrame = { origin: value.origin };
  if (typeof value.id === 'string') frame.id = value.id;
  if (typeof value.label === 'string') frame.label = value.label;
  if (typeof value.description === 'string')
    frame.description = value.description;
  return frame;
}

/**
 * Parse an array of {@link TemporalFrame} entries.
 *
 * @param value - Raw JSON value
 * @returns Parsed array, or `undefined` if absent/null
 * @throws {SensorMLParseError} If present but not an array, or if any
 *   frame is invalid
 * @see OAS: AbstractPhysicalProcess.localTimeFrames (L4020)
 */
function parseTemporalFrames(value: unknown): TemporalFrame[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new SensorMLParseError('"localTimeFrames" must be an array');
  }
  return value.map((item, i) => parseTemporalFrame(item, i));
}

/**
 * Parse a {@link GeoJsonPoint} geometry.
 *
 * @param value - Raw JSON value
 * @returns Parsed GeoJsonPoint or `undefined`
 * @see RFC 7946 — GeoJSON, §3.1.2
 */
function parseGeoJsonPoint(value: unknown): GeoJsonPoint | undefined {
  if (!isRecord(value)) return undefined;
  if (value.type !== 'Point') return undefined;
  if (!Array.isArray(value.coordinates)) return undefined;
  if (value.coordinates.length < 2 || value.coordinates.length > 3)
    return undefined;
  if (!value.coordinates.every((c: unknown) => typeof c === 'number'))
    return undefined;
  return value as unknown as GeoJsonPoint;
}

/**
 * Parse a {@link Pose} object.
 *
 * Supports all 4 variants:
 * - GeoPose YPR: position + angles (yaw/pitch/roll)
 * - GeoPose Quaternion: position + quaternion (x/y/z/w)
 * - Relative Pose YPR: angles only (no position)
 * - Relative Pose Quaternion: quaternion only (no position)
 *
 * @param value - Raw JSON value
 * @returns Parsed Pose or `undefined`
 * @see OGC GeoPose 1.0
 * @see OAS: Position (L3998)
 */
function parsePose(value: unknown): Pose | undefined {
  if (!isRecord(value)) return undefined;

  // Must have at least one of `position`, `angles`, or `quaternion`
  const hasPosition = isRecord(value.position);
  const hasAngles = isRecord(value.angles);
  const hasQuaternion = isRecord(value.quaternion);
  if (!hasPosition && !hasAngles && !hasQuaternion) return undefined;

  const pose: Pose = {};

  if (hasPosition) {
    const point = parseGeoJsonPoint(value.position);
    if (point) pose.position = point;
  }

  if (hasAngles) {
    const a = value.angles as Record<string, unknown>;
    pose.angles = {};
    if (typeof a.yaw === 'number') pose.angles.yaw = a.yaw;
    if (typeof a.pitch === 'number') pose.angles.pitch = a.pitch;
    if (typeof a.roll === 'number') pose.angles.roll = a.roll;
  }

  if (hasQuaternion) {
    const q = value.quaternion as Record<string, unknown>;
    if (
      typeof q.x === 'number' &&
      typeof q.y === 'number' &&
      typeof q.z === 'number' &&
      typeof q.w === 'number'
    ) {
      pose.quaternion = { x: q.x, y: q.y, z: q.z, w: q.w };
    }
  }

  return pose;
}

/**
 * Parse a {@link Position} value.
 *
 * Handles 8 position variants (5 non-deprecated + 3 deprecated):
 * 1. `string` — textual description
 * 2. `GeoJsonPoint` — `{ type: 'Point', coordinates: [...] }`
 * 3. `Pose` — `{ position?, angles?, quaternion? }`
 * 4. `AbstractProcess` — inline process (pass-through)
 * 5. `Link` — `{ href: '...' }`
 * 6. Deprecated `Vector` / `DataRecord` / `DataArray` — pass-through
 *
 * @param value - Raw JSON value
 * @returns Parsed Position or `undefined`
 * @see OAS: Position (L3998)
 * @see SensorML 3.0 §7.6.4 — Position
 */
export function parsePosition(value: unknown): Position | undefined {
  if (value === undefined || value === null) return undefined;

  // 1. String — textual position description
  if (typeof value === 'string') return value;

  if (!isRecord(value)) return undefined;

  // 2. GeoJSON Point
  const point = parseGeoJsonPoint(value);
  if (point) return point;

  // 3. Pose (has angles or quaternion)
  const pose = parsePose(value);
  if (pose) return pose;

  // 4. Link (has href)
  const link = parseLink(value);
  if (link) return link;

  // 5. AbstractProcess (has a SensorML process type discriminator)
  const PROCESS_TYPES = [
    'SimpleProcess',
    'AggregateProcess',
    'PhysicalComponent',
    'PhysicalSystem',
  ];
  if (typeof value.type === 'string' && PROCESS_TYPES.includes(value.type)) {
    return value as unknown as Position;
  }

  // 6. Deprecated SWE Common variants (Vector, DataRecord, DataArray) —
  //    pass through as-is; full SWE Common parsing is handled by
  //    Issues #24-#28.
  if (
    typeof value.type === 'string' &&
    ['Vector', 'DataRecord', 'DataArray'].includes(value.type)
  ) {
    return value as unknown as Position;
  }

  // Unrecognized — pass through as-is to avoid data loss
  return value as unknown as Position;
}

// ========================================
// Main Parsers
// ========================================

/**
 * Parse a raw SensorML 3.0 PhysicalSystem JSON object into a typed
 * {@link PhysicalSystem}.
 *
 * PhysicalSystem is a physical observing system composed of multiple
 * sub-components connected by data links.
 *
 * Handles all {@link AbstractProcess}-level properties (`definition`,
 * `typeOf`, `configuration`, `featuresOfInterest`, `inputs`, `outputs`,
 * `parameters`, `modes`), the {@link AbstractPhysicalProcess}-level
 * properties (`attachedTo`, `localReferenceFrames`, `localTimeFrames`,
 * `position`), and the PhysicalSystem-specific `components` and
 * `connections` properties.
 *
 * Component parsing is **recursive**: if a component's `type` is
 * `'PhysicalSystem'`, it is parsed by calling this function again.
 * Other inline process types are passed through as-is until the main
 * parser (Issue #22) coordinates full sub-parser delegation.
 *
 * DescribedObject-level properties (`label`, `uniqueId`, `identifiers`,
 * `classifiers`, etc.) are passed through as-is — shared parsing helpers
 * for those fields belong to Issue #22 (SensorML Main Parser).
 *
 * @param json - Raw JSON object with `type: 'PhysicalSystem'`
 * @returns Parsed PhysicalSystem object
 * @throws {SensorMLParseError} If the input is not a valid PhysicalSystem
 * @see https://docs.ogc.org/is/23-000/23-000.html — OGC SensorML 3.0
 * @see OAS: PhysicalSystem (L4140), AbstractPhysicalProcess (L4020)
 */
export function parsePhysicalSystem(json: unknown): PhysicalSystem {
  if (!isRecord(json)) {
    throw new SensorMLParseError(
      'PhysicalSystem input must be a non-null object'
    );
  }

  if (json.type !== 'PhysicalSystem') {
    throw new SensorMLParseError(
      `Expected type "PhysicalSystem", got "${String(json.type)}"`
    );
  }

  // --- DescribedObject-level properties (required) ---
  if (typeof json.label !== 'string') {
    throw new SensorMLParseError(
      'PhysicalSystem must have a string "label" property'
    );
  }
  if (typeof json.uniqueId !== 'string') {
    throw new SensorMLParseError(
      'PhysicalSystem must have a string "uniqueId" property'
    );
  }

  // --- AbstractProcess-level properties ---
  const definition = optionalString(json.definition);
  const typeOf = parseLink(json.typeOf);
  const configuration = parseSettings(json.configuration);
  const featuresOfInterest = parseFeatureList(json.featuresOfInterest);
  const inputs = parseIOList(json.inputs, 'inputs') as InputList | undefined;
  const outputs = parseIOList(json.outputs, 'outputs') as
    | OutputList
    | undefined;
  const parameters = parseIOList(json.parameters, 'parameters') as
    | ParameterList
    | undefined;
  const modes = parseModes(json.modes);

  // --- AbstractPhysicalProcess-level properties ---
  const attachedTo = parseLink(json.attachedTo);
  const localReferenceFrames = parseSpatialFrames(json.localReferenceFrames);
  const localTimeFrames = parseTemporalFrames(json.localTimeFrames);
  const position = parsePosition(json.position);

  // --- PhysicalSystem-specific properties ---
  const components = parseComponentList(json.components);
  const connections = parseConnectionList(json.connections);

  // --- Build result, preserving DescribedObject passthrough ---
  // Parsed fields listed after the spread override any raw values
  // (including null) from the server JSON. Required fields (label,
  // uniqueId) are narrowed by the typeof guards above — no cast needed.
  return {
    ...(json as Record<string, unknown>),
    type: 'PhysicalSystem' as const,
    label: json.label,
    uniqueId: json.uniqueId,
    definition,
    typeOf,
    configuration,
    featuresOfInterest,
    inputs,
    outputs,
    parameters,
    modes,
    attachedTo,
    localReferenceFrames,
    localTimeFrames,
    position,
    components,
    connections,
  } as PhysicalSystem;
}

/**
 * Parse a raw SensorML 3.0 PhysicalComponent JSON object into a typed
 * {@link PhysicalComponent}.
 *
 * PhysicalComponent is a single physical sensor or actuator with no
 * sub-components.
 *
 * Handles all {@link AbstractProcess}-level properties (`definition`,
 * `typeOf`, `configuration`, `featuresOfInterest`, `inputs`, `outputs`,
 * `parameters`, `modes`), the {@link AbstractPhysicalProcess}-level
 * properties (`attachedTo`, `localReferenceFrames`, `localTimeFrames`,
 * `position`), and the PhysicalComponent-specific `method` property.
 *
 * DescribedObject-level properties (`label`, `uniqueId`, `identifiers`,
 * `classifiers`, etc.) are passed through as-is — shared parsing helpers
 * for those fields belong to Issue #22 (SensorML Main Parser).
 *
 * @param json - Raw JSON object with `type: 'PhysicalComponent'`
 * @returns Parsed PhysicalComponent object
 * @throws {SensorMLParseError} If the input is not a valid PhysicalComponent
 * @see https://docs.ogc.org/is/23-000/23-000.html — OGC SensorML 3.0
 * @see OAS: PhysicalComponent (L4102), AbstractPhysicalProcess (L4020)
 */
export function parsePhysicalComponent(json: unknown): PhysicalComponent {
  if (!isRecord(json)) {
    throw new SensorMLParseError(
      'PhysicalComponent input must be a non-null object'
    );
  }

  if (json.type !== 'PhysicalComponent') {
    throw new SensorMLParseError(
      `Expected type "PhysicalComponent", got "${String(json.type)}"`
    );
  }

  // --- DescribedObject-level properties (required) ---
  if (typeof json.label !== 'string') {
    throw new SensorMLParseError(
      'PhysicalComponent must have a string "label" property'
    );
  }
  if (typeof json.uniqueId !== 'string') {
    throw new SensorMLParseError(
      'PhysicalComponent must have a string "uniqueId" property'
    );
  }

  // --- AbstractProcess-level properties ---
  const definition = optionalString(json.definition);
  const typeOf = parseLink(json.typeOf);
  const configuration = parseSettings(json.configuration);
  const featuresOfInterest = parseFeatureList(json.featuresOfInterest);
  const inputs = parseIOList(json.inputs, 'inputs') as InputList | undefined;
  const outputs = parseIOList(json.outputs, 'outputs') as
    | OutputList
    | undefined;
  const parameters = parseIOList(json.parameters, 'parameters') as
    | ParameterList
    | undefined;
  const modes = parseModes(json.modes);

  // --- AbstractPhysicalProcess-level properties ---
  const attachedTo = parseLink(json.attachedTo);
  const localReferenceFrames = parseSpatialFrames(json.localReferenceFrames);
  const localTimeFrames = parseTemporalFrames(json.localTimeFrames);
  const position = parsePosition(json.position);

  // --- PhysicalComponent-specific property ---
  const method = parseProcessMethod(json.method);

  // --- Build result, preserving DescribedObject passthrough ---
  // Parsed fields listed after the spread override any raw values
  // (including null) from the server JSON. Required fields (label,
  // uniqueId) are narrowed by the typeof guards above — no cast needed.
  return {
    ...(json as Record<string, unknown>),
    type: 'PhysicalComponent' as const,
    label: json.label,
    uniqueId: json.uniqueId,
    definition,
    typeOf,
    configuration,
    featuresOfInterest,
    inputs,
    outputs,
    parameters,
    modes,
    attachedTo,
    localReferenceFrames,
    localTimeFrames,
    position,
    method,
  } as PhysicalComponent;
}
