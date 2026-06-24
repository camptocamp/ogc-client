/**
 * Endpoint-context classification fallback for CSAPI GeoJSON features.
 *
 * When a server (notably 52North) returns `featureType: null` in GeoJSON
 * responses, the pure {@link getCSAPIResourceType} function correctly
 * returns `null`. This module adds a fallback path: the response parser
 * can pass an endpoint URL hint so that the resource type is inferred
 * from the collection path segment (e.g., `/systems` → `'System'`).
 *
 * Design: the hint **never** overrides a valid featureType — it only
 * fills in when featureType-based classification fails.
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/50 — F41
 * @see https://docs.ogc.org/is/23-001/23-001.html — OGC API Connected Systems Part 1
 * @module
 */

import { getCSAPIResourceType } from './geojson.js';
import type { CSAPIResourceTypeName } from './geojson.js';

// ========================================
// Path Segment → Resource Type Mapping
// ========================================

/**
 * Maps CSAPI endpoint path segments to resource type names.
 *
 * Only Part 1 resource types that appear as GeoJSON features are
 * included. Part 2 resource types (datastreams, observations, etc.)
 * do not use featureType and are excluded.
 */
const PATH_SEGMENT_TO_TYPE: Readonly<Record<string, CSAPIResourceTypeName>> = {
  systems: 'System',
  deployments: 'Deployment',
  procedures: 'Procedure',
  samplingFeatures: 'SamplingFeature',
};

// ========================================
// Public API
// ========================================

/**
 * Infers a CSAPI resource type name from an endpoint URL path.
 *
 * Scans the URL path segments from **right to left** and returns the
 * resource type for the first recognized CSAPI collection segment.
 * This handles both canonical (`/api/systems`) and nested
 * (`/collections/{id}/systems`) URL patterns, as well as individual
 * resource URLs (`/api/systems/abc-123`).
 *
 * Query strings and fragments are stripped before scanning.
 *
 * @param endpointUrl - The CSAPI endpoint URL (absolute or path-only).
 * @returns The inferred resource type name, or `null` if no recognized
 *   path segment is found.
 *
 * @example
 * ```ts
 * inferResourceTypeFromPath('https://server.com/api/systems');
 * // → 'System'
 *
 * inferResourceTypeFromPath('/collections/weather/deployments?limit=10');
 * // → 'Deployment'
 * ```
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/50
 */
export function inferResourceTypeFromPath(
  endpointUrl: string
): CSAPIResourceTypeName | null {
  // Strip query string and fragment
  const pathOnly = endpointUrl.split(/[?#]/)[0];
  const segments = pathOnly.split('/').filter(Boolean);

  // Scan right-to-left for the first recognized collection segment
  for (let i = segments.length - 1; i >= 0; i--) {
    const type = PATH_SEGMENT_TO_TYPE[segments[i]];
    if (type !== undefined) return type;
  }
  return null;
}

/**
 * Classifies a GeoJSON feature with optional endpoint-context fallback.
 *
 * Resolution order:
 * 1. Tries featureType-based classification via
 *    {@link getCSAPIResourceType} (the pure function).
 * 2. If that returns `null` **and** a `hint` is provided, returns
 *    the hint.
 * 3. Without a hint, returns `null` — no guessing.
 *
 * The hint **never** overrides a valid featureType. This ensures that
 * spec-compliant servers are classified by their declared featureType,
 * while non-compliant servers (e.g., 52North with `featureType: null`)
 * can still be classified from endpoint context.
 *
 * @param feature - A candidate GeoJSON Feature object.
 * @param hint - Optional resource type hint, typically obtained via
 *   {@link inferResourceTypeFromPath}.
 * @returns The classified resource type name, or `null` if
 *   classification fails (no valid featureType and no hint).
 *
 * @example
 * ```ts
 * // 52North feature with featureType: null + endpoint hint
 * classifyFeature(nullFeatureTypeFeature, 'System');
 * // → 'System'
 *
 * // Spec-compliant feature — hint is ignored
 * classifyFeature(sensorFeature, 'Deployment');
 * // → 'System' (from featureType: 'sosa:Sensor')
 * ```
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/50 — F41
 */
export function classifyFeature(
  feature: unknown,
  hint?: CSAPIResourceTypeName | null
): CSAPIResourceTypeName | null {
  const fromFeatureType = getCSAPIResourceType(feature);
  if (fromFeatureType !== null) return fromFeatureType;
  return hint ?? null;
}
