import { EndpointError } from '../shared/errors.js';
import { StacCatalog, StacCollection, StacItem, StacLink } from './model.js';
import { StacDocument } from './link-utils.js';

/**
 * Interface for the root/landing page document
 */
export interface StacRootDocument extends StacDocument {
  stac_version?: string;
  type?: string;
  id?: string;
  title?: string;
  description?: string;
  conformsTo?: string[];
}

/**
 * Interface for collections list response
 */
export interface StacCollectionsDocument extends StacDocument {
  collections: StacCollection[];
}

/**
 * Interface for items list response (GeoJSON FeatureCollection)
 */
export interface StacItemsDocument extends StacDocument {
  type: 'FeatureCollection';
  features: StacItem[];
  numberMatched?: number;
  numberReturned?: number;
}

/**
 * Basic catalog/endpoint information
 */
export interface StacEndpointInfo {
  id: string;
  title?: string;
  description: string;
  stacVersion: string;
  conformsTo?: string[];
}

/**
 * Parses the root/landing page document into endpoint info
 * @param rootDoc The root STAC document
 * @returns Endpoint information
 */
export function parseEndpointInfo(rootDoc: StacRootDocument): StacEndpointInfo {
  if (!rootDoc.id) {
    throw new EndpointError('Root document is missing required "id" field');
  }
  if (!rootDoc.description) {
    throw new EndpointError(
      'Root document is missing required "description" field'
    );
  }
  if (!rootDoc.stac_version) {
    throw new EndpointError(
      'Root document is missing required "stac_version" field'
    );
  }

  return {
    id: rootDoc.id,
    title: rootDoc.title,
    description: rootDoc.description,
    stacVersion: rootDoc.stac_version,
    conformsTo: rootDoc.conformsTo,
  };
}

/**
 * Parses a root document into a StacCatalog
 * @param doc The root document
 * @returns StacCatalog object
 */
export function parseStacCatalog(doc: StacRootDocument): StacCatalog {
  if (!doc.stac_version) {
    throw new EndpointError('Document is missing "stac_version" field');
  }
  if (doc.type !== 'Catalog') {
    throw new EndpointError(`Expected type "Catalog" but got "${doc.type}"`);
  }
  if (!doc.id) {
    throw new EndpointError('Document is missing "id" field');
  }
  if (!doc.description) {
    throw new EndpointError('Document is missing "description" field');
  }
  if (!doc.links || !Array.isArray(doc.links)) {
    throw new EndpointError('Document is missing "links" array');
  }

  return {
    stac_version: doc.stac_version as '1.0.0',
    stac_extensions: doc.stac_extensions as string[] | undefined,
    type: 'Catalog',
    id: doc.id,
    title: doc.title,
    description: doc.description,
    links: doc.links as StacLink[],
  };
}

/**
 * Parses a collection document into a StacCollection
 * @param doc The collection document
 * @returns StacCollection object
 */
export function parseStacCollection(doc: StacDocument): StacCollection {
  if (!doc.stac_version) {
    throw new EndpointError(
      'Collection document is missing "stac_version" field'
    );
  }
  if (doc.type !== 'Collection') {
    throw new EndpointError(`Expected type "Collection" but got "${doc.type}"`);
  }
  if (!doc.id) {
    throw new EndpointError('Collection document is missing "id" field');
  }
  if (!doc.description) {
    throw new EndpointError(
      'Collection document is missing "description" field'
    );
  }
  if (!doc.license) {
    throw new EndpointError('Collection document is missing "license" field');
  }
  if (!doc.extent) {
    throw new EndpointError('Collection document is missing "extent" field');
  }
  if (!doc.links || !Array.isArray(doc.links)) {
    throw new EndpointError('Collection document is missing "links" array');
  }

  // After validation, we know the document has the correct structure
  return doc as unknown as StacCollection;
}

/**
 * Parses an item document into a StacItem
 * @param doc The item document
 * @returns StacItem object
 */
export function parseStacItem(doc: StacDocument): StacItem {
  if (!doc.stac_version) {
    throw new EndpointError('Item document is missing "stac_version" field');
  }
  if (doc.type !== 'Feature') {
    throw new EndpointError(`Expected type "Feature" but got "${doc.type}"`);
  }
  if (!doc.id) {
    throw new EndpointError('Item document is missing "id" field');
  }
  if (!doc.properties) {
    throw new EndpointError('Item document is missing "properties" field');
  }
  if (!doc.links || !Array.isArray(doc.links)) {
    throw new EndpointError('Item document is missing "links" array');
  }
  if (!doc.assets) {
    throw new EndpointError('Item document is missing "assets" object');
  }

  // After validation, we know the document has the correct structure
  return doc as unknown as StacItem;
}

/**
 * Parses the /collections response to extract collection IDs
 * @param doc Collections list document
 * @returns Array of collection IDs
 */
export function parseCollectionsList(doc: StacCollectionsDocument): string[] {
  if (!doc.collections || !Array.isArray(doc.collections)) {
    throw new EndpointError('Document is missing "collections" array');
  }
  return doc.collections.map((col) => col.id);
}

/**
 * Parses conformance classes from a document
 * @param doc Document containing conformsTo array
 * @returns Array of conformance class URIs
 */
export function parseConformance(doc: StacDocument): string[] {
  if (!doc.conformsTo || !Array.isArray(doc.conformsTo)) {
    return [];
  }
  return doc.conformsTo as string[];
}

/**
 * Checks if the endpoint conforms to STAC API - Core
 * @param conformance Array of conformance classes
 * @returns True if STAC API - Core is supported
 */
export function checkStacCoreConformance(conformance: string[]): boolean {
  return conformance.some(
    (uri) =>
      (uri.includes('stac-api') || uri.includes('stacspec.org')) &&
      (uri.includes('/core') || uri.includes('/item-search'))
  );
}

/**
 * Checks if the endpoint conforms to OGC API - Features
 * @param conformance Array of conformance classes
 * @returns True if OGC API - Features is supported
 */
export function checkOgcFeaturesConformance(conformance: string[]): boolean {
  return conformance.some(
    (uri) =>
      uri.includes('ogcapi-features') ||
      uri === 'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core'
  );
}
