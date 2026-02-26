import { CSAPIResourceTypes } from './model.js';
import type { CSAPIResourceType, CsapiDateTimeParameter } from './model.js';
import type { BoundingBox } from '../../shared/models.js';

// ========================================
// Temporal Encoding
// ========================================

/**
 * Formats a {@link CsapiDateTimeParameter} as an ISO 8601 string suitable for
 * CSAPI temporal query parameters (`datetime`, `phenomenonTime`, `resultTime`,
 * `issueTime`, `executionTime`).
 *
 * - `'latest'` → `"latest"` (CSAPI Part 2 special value for `resultTime`)
 * - Single `Date` → `"2024-01-01T00:00:00.000Z"`
 * - Start only → `"2024-01-01T00:00:00.000Z/.."`
 * - End only → `"../2024-12-31T23:59:59.000Z"`
 * - Start and end → `"2024-01-01T00:00:00.000Z/2024-12-31T23:59:59.000Z"`
 *
 * @param param - A date instant, interval, or the `'latest'` keyword.
 * @returns ISO 8601 date or interval string, or `'latest'`.
 * @throws {Error} If `param` is not a valid `CsapiDateTimeParameter`.
 * @see https://docs.ogc.org/is/23-001/23-001.html
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */
export function formatDateTimeParameter(param: CsapiDateTimeParameter): string {
  if (param === 'latest') return 'latest';

  const format = (d: Date) => d.toISOString();

  if (param instanceof Date) {
    return format(param);
  }

  if ('start' in param && 'end' in param) {
    return `${format(param.start)}/${format(param.end)}`;
  }

  if ('start' in param) {
    return `${format(param.start)}/..`;
  }

  if ('end' in param) {
    return `../${format(param.end)}`;
  }

  throw new Error('Invalid CsapiDateTimeParameter');
}

// ========================================
// Resource Type Validation
// ========================================

/**
 * Checks whether a string is a valid {@link CSAPIResourceType}.
 *
 * @param value - The string to check.
 * @returns `true` if `value` is one of the 9 CSAPI resource types.
 * @see https://docs.ogc.org/is/23-001/23-001.html
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */
export function isValidResourceType(value: string): value is CSAPIResourceType {
  return (CSAPIResourceTypes as readonly string[]).includes(value);
}

/**
 * Asserts that a string is a valid {@link CSAPIResourceType}, throwing if not.
 *
 * @param value - The string to validate.
 * @throws {Error} If `value` is not a valid CSAPI resource type.
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */
export function assertValidResourceType(
  value: string
): asserts value is CSAPIResourceType {
  if (!isValidResourceType(value)) {
    throw new Error(
      `Invalid CSAPI resource type: "${value}". ` +
        `Valid types are: ${CSAPIResourceTypes.join(', ')}`
    );
  }
}

// ========================================
// URL Encoding
// ========================================

/**
 * Encodes a resource ID for use in a URL path segment.
 *
 * Uses `encodeURIComponent` to safely handle special characters
 * (spaces, slashes, colons, etc.) that may appear in resource identifiers.
 *
 * @param id - The resource identifier to encode.
 * @returns The percent-encoded string safe for URL path segments.
 */
export function encodeResourceId(id: string): string {
  return encodeURIComponent(id);
}

// ========================================
// Link Scanning
// ========================================

/**
 * Scans an array of link objects for CSAPI resource references and returns
 * a Map of resource type name → href.
 *
 * Recognizes three OGC link relation conventions, in priority order:
 *
 * 1. **`ogc-cs:` prefixed** — `rel: "ogc-cs:systems"` → resource `"systems"`
 * 2. **Plain resource name** — `rel: "systems"` where the value is a known
 *    {@link CSAPIResourceTypes} member
 * 3. **`items` with resource href** — `rel: "items"` where the `href` path
 *    ends with a known resource type name (query parameters are stripped
 *    before matching; the alias `featuresOfInterest` is normalized to
 *    `samplingFeatures`)
 *
 * **Note:** Servers that do not use any of these three conventions will
 * produce an empty map. In that case, consumers should supply explicit
 * resource URLs via the `resourceUrls` constructor parameter of
 * {@link CSAPIQueryBuilder}.
 *
 * @param links - Array of link objects (e.g., from a collection or root document).
 * @returns Map of resource type name → href string. Empty if no CSAPI links found.
 * @see {@link CSAPIQueryBuilder} constructor for the `resourceUrls` workaround
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */
export function scanCsapiLinks(
  links: Array<{ rel?: string; href?: string }>
): Map<string, string> {
  const result = new Map<string, string>();

  if (!Array.isArray(links)) {
    return result;
  }

  const knownTypes: ReadonlySet<string> = new Set(CSAPIResourceTypes);

  for (const link of links) {
    const rel = link.rel;
    const href = link.href;
    if (typeof rel !== 'string') continue;

    // Convention 1: ogc-cs: prefixed (e.g., rel: "ogc-cs:systems")
    const match = rel.match(/^ogc-cs:(.+)$/);
    if (match) {
      result.set(match[1], typeof href === 'string' ? href : '');
      continue;
    }

    // Convention 2: plain resource name (e.g., rel: "systems")
    if (knownTypes.has(rel)) {
      result.set(rel, typeof href === 'string' ? href : '');
      continue;
    }

    // Convention 3: rel: "items" with resource type in href
    if (rel === 'items' && typeof href === 'string') {
      const segment = href.split('?')[0].replace(/\/+$/, '').split('/').pop();
      // Normalize known server naming variants to spec resource type names
      const normalized =
        segment === 'featuresOfInterest' ? 'samplingFeatures' : segment;
      if (normalized && knownTypes.has(normalized)) {
        result.set(normalized, href);
      }
    }
  }

  return result;
}

// ========================================
// Parameter Validation
// ========================================

/**
 * Validates a `limit` query parameter value.
 *
 * The limit must be a positive integer (≥ 1).
 *
 * @param limit - The limit value to validate.
 * @throws {Error} If `limit` is not a positive integer.
 */
export function validateLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(
      `Invalid limit: ${limit}. Must be a positive integer (≥ 1).`
    );
  }
}

/**
 * Validates a `bbox` query parameter value.
 *
 * A valid bounding box is a 4-element array `[minx, miny, maxx, maxy]` where
 * all elements are finite numbers and `minx ≤ maxx`, `miny ≤ maxy`.
 *
 * @param bbox - The bounding box to validate.
 * @throws {Error} If the bounding box is invalid.
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */
export function validateBbox(bbox: BoundingBox): void {
  if (bbox.length !== 4) {
    throw new Error(
      `Invalid bbox: expected 4 coordinates [minx, miny, maxx, maxy], got ${bbox.length}.`
    );
  }

  if (!bbox.every((v) => Number.isFinite(v))) {
    throw new Error('Invalid bbox: all coordinates must be finite numbers.');
  }

  const [minx, miny, maxx, maxy] = bbox;
  if (minx > maxx) {
    throw new Error(`Invalid bbox: minx (${minx}) must be ≤ maxx (${maxx}).`);
  }
  if (miny > maxy) {
    throw new Error(`Invalid bbox: miny (${miny}) must be ≤ maxy (${maxy}).`);
  }
}

// ========================================
// (End of module — feature-level validators removed per Issue #52)
// ========================================
