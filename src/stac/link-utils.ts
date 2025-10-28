/**
 * STAC link utilities - thin wrapper around OGC API link utilities
 * STAC API is based on OGC API Features, so we reuse the OGC API utilities
 */

import {
  fetchDocument as ogcFetchDocument,
  fetchRoot as ogcFetchRoot,
  getLinks as ogcGetLinks,
  getLinkUrl as ogcGetLinkUrl,
} from '../ogc-api/link-utils.js';
import { OgcApiDocumentLink } from '../ogc-api/model.js';
import { EndpointError } from '../shared/errors.js';

/**
 * STAC Document type - base interface for all STAC documents
 * Uses structural typing with index signature to allow STAC-specific properties
 */
export interface StacDocument {
  links?: Array<{
    rel: string;
    href: string;
    type?: string;
    title?: string;
    method?: string;
    headers?: Record<string, string | string[]>;
    body?: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Fetches a STAC document from a URL and returns it as JSON
 * STAC API uses the same document structure as OGC API
 */
export function fetchStacDocument<T extends StacDocument>(
  url: string
): Promise<T> {
  return ogcFetchDocument(url) as Promise<T>;
}

/**
 * Fetches the root/landing page of a STAC API
 * Includes smart root detection by navigating up the path if needed
 */
export function fetchRoot(url: string): Promise<StacDocument> {
  return ogcFetchRoot(url) as Promise<StacDocument>;
}

/**
 * Checks if a document has links with specific rel types
 * When given an array, returns true only if ALL specified rel types exist (AND logic)
 */
export function hasLinks(
  doc: StacDocument,
  relTypes: string | string[]
): boolean {
  const types = Array.isArray(relTypes) ? relTypes : [relTypes];
  // Check that ALL specified rel types exist
  return types.every((relType) =>
    doc.links?.some((link) => link.rel === relType)
  );
}

/**
 * Gets all links from a document matching a specific rel type
 */
export function getLinks(
  doc: StacDocument,
  relType: string | string[],
  mimeType?: string,
  assertPresence?: boolean
): OgcApiDocumentLink[] {
  return ogcGetLinks(doc as any, relType, mimeType, assertPresence);
}

/**
 * Gets the URL from a link with a specific rel type
 */
export function getLinkUrl(
  doc: StacDocument,
  relType: string | string[],
  baseUrl?: string,
  mimeType?: string,
  assertPresence?: boolean
): string | null {
  return ogcGetLinkUrl(doc as any, relType, baseUrl, mimeType, assertPresence);
}

/**
 * Fetches a document by following a link relation
 */
export async function fetchLink<T extends StacDocument>(
  doc: StacDocument,
  relType: string | string[],
  baseUrl: string,
  mimeType?: string
): Promise<T> {
  const url = getLinkUrl(doc, relType, baseUrl, mimeType);
  if (!url) {
    const relStr = Array.isArray(relType) ? relType.join(', ') : relType;
    throw new EndpointError(
      `No link found with rel type: ${relStr}${
        mimeType ? ` and mime type: ${mimeType}` : ''
      }`
    );
  }
  return fetchStacDocument<T>(url);
}

/**
 * Asserts that a document has required links, throws an error if not
 */
export function assertHasLinks(
  doc: StacDocument,
  relTypes: string | string[]
): void {
  const relArray = Array.isArray(relTypes) ? relTypes : [relTypes];
  const missingRels = relArray.filter((rel) => !hasLinks(doc, rel));
  if (missingRels.length > 0) {
    throw new EndpointError(
      `Document is missing required links with rel types: ${missingRels.join(
        ', '
      )}`
    );
  }
}
