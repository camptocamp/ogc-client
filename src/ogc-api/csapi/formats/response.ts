/**
 * Response envelope normalization for CSAPI collection responses.
 *
 * CSAPI servers use two envelope formats for collection responses:
 *
 * 1. **GeoJSON FeatureCollection** — standard RFC 7946 envelope with
 *    `{ type: "FeatureCollection", features: [...] }`.
 * 2. **Items envelope** — used by OpenSensorHub (and OGC CSAPI Part 2)
 *    with `{ items: [...], links: [...] }`.
 *
 * Some servers (notably OpenSensorHub) use the `items` format even for
 * Part 1 GeoJSON resources. The `parseCollectionResponse` function
 * normalizes both formats into a single consistent representation.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html — OGC API Connected Systems Part 1
 * @see https://docs.ogc.org/is/23-002/23-002.html — OGC API Connected Systems Part 2
 * @see https://tools.ietf.org/html/rfc7946 — GeoJSON (FeatureCollection)
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/36 — Smoke Test Finding F3
 * @module
 */

import type { ResourceLink } from '../model.js';

// ========================================
// Types
// ========================================

/**
 * Normalized collection response produced by {@link parseCollectionResponse}.
 *
 * Contains the item array, optional pagination metadata, links, and an
 * optional timestamp — regardless of whether the server returned a
 * `FeatureCollection` envelope or an `items` envelope.
 */
export interface CollectionResponse<T> {
  /** The items in the collection. */
  items: T[];

  /** HATEOAS navigation links, if present in the response. */
  links: ResourceLink[];

  /**
   * Total number of items matching the query, if the server provided it.
   * Absent when the server omits pagination metadata.
   */
  numberMatched?: number;

  /**
   * Number of items returned in this page, if the server provided it.
   * Absent when the server omits pagination metadata.
   */
  numberReturned?: number;

  /** Server-provided timestamp for the response, if present. */
  timeStamp?: string;
}

// ========================================
// Parser
// ========================================

/**
 * Normalizes a raw CSAPI collection response into a consistent
 * {@link CollectionResponse} structure.
 *
 * Handles two envelope formats:
 *
 * - **FeatureCollection** — `{ type: "FeatureCollection", features: [...] }`
 *   as defined by RFC 7946 and OGC API Part 1.
 * - **Items envelope** — `{ items: [...] }` as used by OpenSensorHub and
 *   OGC API Part 2 resources.
 *
 * The `type: "FeatureCollection"` discriminator is accepted but not required.
 * Pagination metadata (`numberMatched`, `numberReturned`) defaults to
 * `undefined` when absent.
 *
 * @typeParam T - The type of individual items in the collection.
 * @param body - The raw JSON response body (already parsed from JSON).
 * @returns A normalized {@link CollectionResponse} with the items array,
 *   links, and optional pagination metadata.
 * @throws {Error} If the response contains neither `features` nor `items`.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html — Part 1 FeatureCollection
 * @see https://docs.ogc.org/is/23-002/23-002.html — Part 2 ItemCollection
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/36 — Finding F3
 */
export function parseCollectionResponse<T>(body: unknown): CollectionResponse<T> {
  if (typeof body !== 'object' || body === null) {
    throw new Error(
      'Invalid collection response: expected an object'
    );
  }

  const obj = body as Record<string, unknown>;

  // Determine the items array: prefer `features` (GeoJSON), fall back to `items`
  let items: T[];
  if (Array.isArray(obj.features)) {
    items = obj.features as T[];
  } else if (Array.isArray(obj.items)) {
    items = obj.items as T[];
  } else {
    throw new Error(
      'Invalid collection response: missing both "features" and "items" arrays'
    );
  }

  // Extract links — always an array, default to empty
  const links: ResourceLink[] = Array.isArray(obj.links)
    ? (obj.links as ResourceLink[])
    : [];

  // Extract optional pagination metadata
  const numberMatched =
    typeof obj.numberMatched === 'number' ? obj.numberMatched : undefined;
  const numberReturned =
    typeof obj.numberReturned === 'number' ? obj.numberReturned : undefined;

  // Extract optional timestamp
  const timeStamp =
    typeof obj.timeStamp === 'string' ? obj.timeStamp : undefined;

  return {
    items,
    links,
    numberMatched,
    numberReturned,
    timeStamp,
  };
}
