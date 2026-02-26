/**
 * GeoJSON handler extensions for OGC API — Connected Systems (CSAPI).
 *
 * Provides featureType recognition and CSAPI property extraction
 * for GeoJSON Feature resources returned by CSAPI endpoints.
 *
 * Supported resource types: System, Deployment, Procedure, SamplingFeature.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html
 * @module
 */

import type {
  System,
  Deployment,
  Procedure,
  SamplingFeature,
  ResourceLink,
  TimeInterval,
  CSAPIResourceRef,
} from '../model.js';
import type { Geometry } from 'geojson';

// ========================================
// Constants
// ========================================

/** SOSA namespace URI. */
export const SOSA_NS = 'http://www.w3.org/ns/sosa/';

/** SOSA compact prefix. */
const SOSA_PREFIX = 'sosa:';

/**
 * W3C SSN namespace URI.
 *
 * The SSN ontology defines canonical URIs for some CSAPI concepts
 * (e.g., `ssn:Deployment`, `ssn:System`) that overlap with their
 * SOSA counterparts. Servers such as OSH may use SSN-prefixed URIs.
 *
 * @see https://www.w3.org/TR/vocab-ssn/
 */
export const SSN_NS = 'http://www.w3.org/ns/ssn/';

/** SSN compact prefix. */
const SSN_PREFIX = 'ssn:';

/**
 * OGC SensorML 2.0 namespace URI.
 * @see https://docs.ogc.org/is/12-000r2/12-000r2.html
 */
export const SENSORML_NS = 'http://www.opengis.net/sensorml/2.0#';

/** CSAPI resource type discriminator names. */
export type CSAPIResourceTypeName =
  | 'System'
  | 'Deployment'
  | 'Procedure'
  | 'SamplingFeature';

/**
 * SOSA local names that map to the System resource type.
 * @see SystemTypeUris in model.ts
 */
const SYSTEM_LOCAL_NAMES: ReadonlySet<string> = new Set([
  'System',
  'Sensor',
  'Actuator',
  'Platform',
  'Sampler',
]);

/** SOSA local names that map to the Deployment resource type. */
const DEPLOYMENT_LOCAL_NAMES: ReadonlySet<string> = new Set(['Deployment']);

/**
 * SOSA local names that map to the Procedure resource type.
 *
 * Note: The OGC spec's ProcedureTypeUris also lists System-type URIs,
 * but featureType-based classification prioritizes System over Procedure.
 */
const PROCEDURE_LOCAL_NAMES: ReadonlySet<string> = new Set([
  'Procedure',
  'ObservingProcedure',
  'SamplingProcedure',
  'ActuatingProcedure',
]);

/** SOSA local names that map to the SamplingFeature resource type. */
const SAMPLING_FEATURE_LOCAL_NAMES: ReadonlySet<string> = new Set([
  'SamplingFeature',
  'Sample',
]);

/**
 * SensorML local names that map to the SamplingFeature resource type.
 *
 * OSH servers use `http://www.opengis.net/sensorml/2.0#Feature` as the
 * featureType for sampling features. The SensorML `Feature` local name
 * maps to the CSAPI `SamplingFeature` resource type.
 */
const SENSORML_SAMPLING_FEATURE_LOCAL_NAMES: ReadonlySet<string> = new Set([
  'Feature',
]);

// ========================================
// Internal Helpers
// ========================================

/**
 * Safely extracts the `featureType` string from a GeoJSON-like object.
 * Returns `undefined` if the input is not a valid structure.
 */
function getFeatureType(feature: unknown): string | undefined {
  if (
    typeof feature !== 'object' ||
    feature === null ||
    !('properties' in feature)
  ) {
    return undefined;
  }
  const props = (feature as Record<string, unknown>).properties;
  if (typeof props !== 'object' || props === null) {
    return undefined;
  }
  const ft = (props as Record<string, unknown>).featureType;
  return typeof ft === 'string' ? ft : undefined;
}

/**
 * Extracts the SOSA local name from a featureType URI or CURIE.
 *
 * Handles both forms:
 * - Full URI: `http://www.w3.org/ns/sosa/Sensor` → `Sensor`
 * - Compact CURIE: `sosa:Sensor` → `Sensor`
 *
 * Returns `undefined` if the value does not use the SOSA vocabulary.
 */
function toSosaLocalName(featureType: string): string | undefined {
  if (featureType.startsWith(SOSA_NS)) {
    return featureType.slice(SOSA_NS.length);
  }
  if (featureType.startsWith(SOSA_PREFIX)) {
    return featureType.slice(SOSA_PREFIX.length);
  }
  return undefined;
}

/**
 * Extracts the SSN local name from a featureType URI or CURIE.
 *
 * Handles both forms:
 * - Full URI: `http://www.w3.org/ns/ssn/Deployment` → `Deployment`
 * - Compact CURIE: `ssn:Deployment` → `Deployment`
 *
 * Returns `undefined` if the value does not use the SSN vocabulary.
 */
function toSsnLocalName(featureType: string): string | undefined {
  if (featureType.startsWith(SSN_NS)) {
    return featureType.slice(SSN_NS.length);
  }
  if (featureType.startsWith(SSN_PREFIX)) {
    return featureType.slice(SSN_PREFIX.length);
  }
  return undefined;
}

/**
 * Extracts the SensorML local name from a featureType URI.
 *
 * Handles full URI form:
 * - `http://www.opengis.net/sensorml/2.0#Feature` → `Feature`
 *
 * Returns `undefined` if the value does not use the SensorML namespace.
 */
function toSensormlLocalName(featureType: string): string | undefined {
  if (featureType.startsWith(SENSORML_NS)) {
    return featureType.slice(SENSORML_NS.length);
  }
  return undefined;
}

// ========================================
// Recognition
// ========================================

/**
 * Tests whether a GeoJSON Feature has a CSAPI-recognized `featureType`.
 *
 * Recognition covers the SOSA, SSN, and SensorML vocabularies.
 *
 * @param feature - A candidate GeoJSON Feature object.
 * @returns `true` if the feature has a recognized featureType.
 */
export function isCSAPIFeature(feature: unknown): boolean {
  return getCSAPIResourceType(feature) !== null;
}

/**
 * Determines the CSAPI resource type from a GeoJSON Feature's `featureType` property.
 *
 * Only Part 1 resource types are recognized: System, Deployment, Procedure,
 * SamplingFeature. Part 2 resources (DataStreams, Observations, Control Streams,
 * Commands) do not have a `featureType` property and will return `null`.
 *
 * Checks the SOSA vocabulary first, then SSN, then SensorML.
 * Classification priority within SOSA/SSN: System > Deployment > Procedure > SamplingFeature.
 * This ordering ensures that featureType values shared between System and
 * Procedure schemas (per OGC spec) resolve as System.
 *
 * @param feature - A candidate GeoJSON Feature object (or any unknown value).
 * @returns The recognized Part 1 resource type name, or `null` if unrecognized.
 *
 * @see {@link https://www.w3.org/TR/vocab-ssn/ | SOSA/SSN Ontology} for featureType URIs
 */
export function getCSAPIResourceType(
  feature: unknown
): CSAPIResourceTypeName | null {
  const ft = getFeatureType(feature);
  if (ft === undefined) return null;

  // Try SOSA vocabulary first
  const sosaLocal = toSosaLocalName(ft);
  if (sosaLocal !== undefined) {
    if (SYSTEM_LOCAL_NAMES.has(sosaLocal)) return 'System';
    if (DEPLOYMENT_LOCAL_NAMES.has(sosaLocal)) return 'Deployment';
    if (PROCEDURE_LOCAL_NAMES.has(sosaLocal)) return 'Procedure';
    if (SAMPLING_FEATURE_LOCAL_NAMES.has(sosaLocal)) return 'SamplingFeature';
    return null;
  }

  // Try SSN vocabulary (shares local names with SOSA)
  const ssnLocal = toSsnLocalName(ft);
  if (ssnLocal !== undefined) {
    if (SYSTEM_LOCAL_NAMES.has(ssnLocal)) return 'System';
    if (DEPLOYMENT_LOCAL_NAMES.has(ssnLocal)) return 'Deployment';
    if (PROCEDURE_LOCAL_NAMES.has(ssnLocal)) return 'Procedure';
    if (SAMPLING_FEATURE_LOCAL_NAMES.has(ssnLocal)) return 'SamplingFeature';
    return null;
  }

  // Try SensorML vocabulary
  const smlLocal = toSensormlLocalName(ft);
  if (smlLocal !== undefined) {
    if (SENSORML_SAMPLING_FEATURE_LOCAL_NAMES.has(smlLocal))
      return 'SamplingFeature';
    return null;
  }

  return null;
}

// ========================================
// Parsing Helpers
// ========================================

/**
 * Parses a `validTime` value from server JSON into a {@link TimeInterval}.
 *
 * The OGC spec defines `timePeriod` as an array of two items, each being
 * either an ISO 8601 date-time string or the sentinel `"now"`.
 *
 * Example: `["2026-01-26T18:32:01.56Z", "now"]`
 *
 * This function accepts:
 * - Array format: `[startString, endString]` (spec-canonical)
 * - Object format: `{ start: string|Date, end?: string|Date }` (defensive)
 * - `null` or `undefined` → returns `undefined`
 *
 * The sentinel `"now"` for the end value maps to `end: undefined`.
 *
 * @param value - Raw validTime value from the server.
 * @returns Parsed TimeInterval, or `undefined` if the input is absent or invalid.
 */
export function parseValidTime(value: unknown): TimeInterval | undefined {
  if (value === null || value === undefined) return undefined;

  // Array format (spec-canonical): ["2026-01-26T18:32:01.56Z", "now"]
  if (Array.isArray(value) && value.length === 2) {
    const startStr = value[0];
    const endStr = value[1];

    if (typeof startStr !== 'string') return undefined;
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return undefined;

    let end: Date | undefined;
    if (typeof endStr === 'string' && endStr !== 'now') {
      end = new Date(endStr);
      if (isNaN(end.getTime())) return undefined;
    }

    return { start, end };
  }

  // Object format (defensive): { start: ..., end?: ... }
  if (typeof value === 'object' && 'start' in (value as object)) {
    const obj = value as Record<string, unknown>;
    const startVal = obj.start;

    if (startVal instanceof Date) {
      return {
        start: startVal,
        end: obj.end instanceof Date ? obj.end : undefined,
      };
    }

    if (typeof startVal === 'string') {
      const start = new Date(startVal);
      if (isNaN(start.getTime())) return undefined;

      let end: Date | undefined;
      if (typeof obj.end === 'string' && obj.end !== 'now') {
        end = new Date(obj.end);
        if (isNaN(end.getTime())) return undefined;
      }

      return { start, end };
    }
  }

  return undefined;
}

/**
 * Tests whether a value is a syntactically valid URI (has a scheme component).
 *
 * Checks for a non-empty scheme followed by `:` per RFC 3986.
 * Does not validate the complete URI grammar.
 *
 * @param value - The value to test.
 * @returns `true` if the value is a string with a URI scheme.
 */
export function isValidUri(value: unknown): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  // RFC 3986: scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
  return /^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(value);
}

// ========================================
// Extraction
// ========================================

/**
 * Extracts a typed CSAPI resource from a GeoJSON Feature representation.
 *
 * **Important limitations:**
 *
 * - **Only supports Part 1 resources** — Systems, Deployments, Procedures,
 *   and Sampling Features. Part 2 resources (DataStreams, Observations,
 *   Control Streams, Commands) are not GeoJSON Features and cannot be
 *   parsed by this function.
 *
 * - **Requires GeoJSON Feature format** — The input must be a GeoJSON
 *   Feature object with `properties.featureType` set to a recognized
 *   SOSA/SSN or SensorML type URI (e.g.,
 *   `http://www.w3.org/ns/sosa/Platform`). Raw SensorML/XML payloads
 *   will not parse correctly.
 *
 * - **Throws on unrecognized input** — If the `featureType` property is
 *   missing or does not map to a known Part 1 resource type, an Error
 *   is thrown with message "Cannot extract CSAPI feature: unrecognized
 *   or missing featureType".
 *
 * Uses {@link getCSAPIResourceType} for recognition, then parses
 * `validTime` from server format to {@link TimeInterval} and returns the
 * appropriately typed resource. Follows Postel's Law — extraction succeeds
 * for any recognized feature, regardless of missing optional or required
 * spec fields.
 *
 * @param feature - A GeoJSON Feature object with CSAPI Part 1 properties.
 *   Expected shape: `{ type: "Feature", properties: { featureType, uid, name,
 *   ... }, geometry, links }`
 * @returns A typed Part 1 resource: {@link System}, {@link Deployment},
 *   {@link Procedure}, or {@link SamplingFeature}
 * @throws {Error} If `featureType` is missing or not a recognized Part 1 type
 *
 * @example
 * ```typescript
 * // Works — GeoJSON Feature with SOSA featureType
 * const system = extractCSAPIFeature(geoJsonFeature); // → System
 *
 * // Fails — Part 2 resource (not a GeoJSON Feature)
 * extractCSAPIFeature(dataStreamObject); // → throws Error
 *
 * // Fails — SensorML XML response
 * extractCSAPIFeature(smlResponse); // → throws Error
 * ```
 *
 * @see {@link getCSAPIResourceType} for the type-detection logic
 * @see OGC 23-001r1 for the GeoJSON encoding of Connected Systems feature resources
 */

/**
 * Type guard for `@link` inline association objects.
 * Validates that the value is a non-null object with a string `href` property.
 */
function isCSAPIResourceRef(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).href === 'string'
  );
}

/**
 * Parse a raw `@link` object into a typed {@link CSAPIResourceRef}.
 * Only includes optional fields (`uid`, `title`, `rt`) when they are strings.
 *
 * OSH sends `type` (per OGC API / RFC 8288 conventions) rather than `rt` for
 * the media type field. This function accepts both: `rt` takes precedence, and
 * `type` is used as a fallback when `rt` is absent.
 */
function parseResourceRef(raw: Record<string, unknown>): CSAPIResourceRef {
  return {
    href: String(raw.href),
    ...(typeof raw.uid === 'string' ? { uid: raw.uid } : {}),
    ...(typeof raw.title === 'string' ? { title: raw.title } : {}),
    ...(typeof raw.rt === 'string'
      ? { rt: raw.rt }
      : typeof raw.type === 'string'
      ? { rt: raw.type }
      : {}),
  };
}

export function extractCSAPIFeature(
  feature: unknown
): System | Deployment | Procedure | SamplingFeature {
  const resourceType = getCSAPIResourceType(feature);
  if (resourceType === null) {
    throw new Error(
      'Cannot extract CSAPI feature: unrecognized or missing featureType'
    );
  }

  const f = feature as Record<string, unknown>;
  const p = f.properties as Record<string, unknown>;

  // Parse validTime if present
  const validTime = parseValidTime(p.validTime);

  // Build the base properties with explicit type so spreads carry string types
  const baseProperties: {
    featureType: string;
    uid: string;
    name: string;
    description?: string;
  } = {
    featureType: String(p.featureType ?? ''),
    uid: String(p.uid ?? ''),
    name: String(p.name ?? ''),
    ...(typeof p.description === 'string'
      ? { description: p.description }
      : {}),
  };

  const links = (Array.isArray(f.links) ? f.links : []) as ResourceLink[];
  const geometry = f.geometry as Geometry | undefined;

  switch (resourceType) {
    case 'System':
      return {
        id: String(f.id ?? ''),
        type: 'Feature',
        properties: {
          ...baseProperties,
          ...(typeof p.assetType === 'string'
            ? { assetType: p.assetType as System['properties']['assetType'] }
            : {}),
          ...(validTime !== undefined ? { validTime } : {}),
          ...(isCSAPIResourceRef(p['systemKind@link'])
            ? { systemKindLink: parseResourceRef(p['systemKind@link']) }
            : {}),
        },
        ...(geometry !== undefined ? { geometry } : {}),
        links,
      } satisfies System;

    case 'Deployment':
      return {
        id: String(f.id ?? ''),
        type: 'Feature',
        properties: {
          ...baseProperties,
          ...(validTime !== undefined ? { validTime } : {}),
          ...(isCSAPIResourceRef(p['platform@link'])
            ? { platformLink: parseResourceRef(p['platform@link']) }
            : {}),
          ...(Array.isArray(p['deployedSystems@link'])
            ? {
                deployedSystemsLink: (p['deployedSystems@link'] as unknown[])
                  .filter(isCSAPIResourceRef)
                  .map(parseResourceRef),
              }
            : {}),
        },
        ...(geometry !== undefined ? { geometry } : {}),
        links,
      } satisfies Deployment;

    case 'Procedure':
      return {
        id: String(f.id ?? ''),
        type: 'Feature',
        properties: baseProperties,
        geometry: null,
        links,
      } satisfies Procedure;

    case 'SamplingFeature':
      return {
        id: String(f.id ?? ''),
        type: 'Feature',
        properties: {
          ...baseProperties,
          ...(validTime !== undefined ? { validTime } : {}),
          ...(isCSAPIResourceRef(p['sampledFeature@link'])
            ? { sampledFeatureLink: parseResourceRef(p['sampledFeature@link']) }
            : {}),
        },
        ...(geometry !== undefined ? { geometry } : {}),
        links,
      } satisfies SamplingFeature;
  }
}
