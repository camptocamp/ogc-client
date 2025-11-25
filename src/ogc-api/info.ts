import {
  CollectionParameter,
  CollectionParameterType,
  CollectionParameterTypes,
  ConformanceClass,
  CSAPICapabilities,
  OgcApiCollectionInfo,
  OgcApiDocument,
  OgcApiEndpointInfo,
  OgcApiStyleMetadata,
  OgcApiStylesDocument,
  OgcStyleBrief,
  OgcStyleFull,
  TileMatrixSet,
} from './model.js';
import { assertHasLinks } from './link-utils.js';
import { EndpointError } from '../shared/errors.js';
import {
  isMimeTypeGeoJson,
  isMimeTypeJson,
  isMimeTypeJsonFg,
} from '../shared/mime-type.js';

export function parseEndpointInfo(rootDoc: OgcApiDocument): OgcApiEndpointInfo {
  try {
    assertHasLinks(rootDoc, ['service-doc', 'service-desc']);
    assertHasLinks(rootDoc, [
      'conformance',
      'http://www.opengis.net/def/rel/ogc/1.0/conformance',
    ]);
  } catch (e) {
    throw new EndpointError(`The endpoint appears non-conforming, the following error was encountered:
${e.message}`);
  }
  return {
    title: rootDoc.title as string,
    description: rootDoc.description as string,
    attribution: rootDoc.attribution as string,
  };
}

export function parseConformance(doc: OgcApiDocument): ConformanceClass[] {
  return doc.conformsTo as string[];
}

export function checkTileConformance(conformance: ConformanceClass[]) {
  return (
    conformance.indexOf(
      'http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/core'
    ) > -1
  );
}

export function checkStyleConformance(conformance: ConformanceClass[]) {
  return (
    conformance.indexOf(
      'http://www.opengis.net/spec/ogcapi-styles-1/0.0/conf/core'
    ) > -1 ||
    conformance.indexOf(
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/core'
    ) > -1
  );
}

export function checkHasRecords([collections, conformance]: [
  OgcApiCollectionInfo[],
  ConformanceClass[]
]) {
  const classes = [
    'http://www.opengis.net/spec/ogcapi-records-1/1.0/conf/record-core',
    'http://www.opengis.net/spec/ogcapi-records-1/1.0/conf/record-collection',
    'http://www.opengis.net/spec/ogcapi-records-1/1.0/conf/record-api',
  ];
  return (
    (classes.every((confClass) => conformance.indexOf(confClass) > -1) ||
      conformance.indexOf(
        'http://www.opengis.net/spec/ogcapi-records-1/1.0/conf/core'
      ) > -1) &&
    collections.some((collection) => collection.itemType === 'record')
  );
}

export function checkHasFeatures([collections, conformance]: [
  OgcApiCollectionInfo[],
  ConformanceClass[]
]) {
  return (
    conformance.indexOf(
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core'
    ) > -1 &&
    collections.some(
      (collection) => collection.itemType === 'feature' || !collection.itemType
    )
  );
}

export function checkHasEnvironmentalDataRetrieval([conformance]: [
  ConformanceClass[]
]) {
  return (
    conformance.indexOf(
      'http://www.opengis.net/spec/ogcapi-edr-1/1.0/conf/core'
    ) > -1
  );
}

// -----------------------------------------------------------------------------
// Connected Systems API — Conformance Detection
// Mirrors checkHasEnvironmentalDataRetrieval pattern
// -----------------------------------------------------------------------------
export function checkHasConnectedSystemsApi([conformance]: [
  ConformanceClass[]
]) {
  if (!conformance || !Array.isArray(conformance)) return false;

  return conformance.some(
    (uri) =>
      typeof uri === 'string' &&
      (uri.includes('ogcapi-connected-systems-1/1.0/conf/core') ||
        uri.includes('ogcapi-connected-systems-2/1.0/conf/dynamic-data'))
  );
}

/**
 * Checks for CSAPI resource availability based on root document links and collections.
 * Returns granular capabilities for each CSAPI resource type.
 */
export function parseCSAPICapabilities(
  rootDoc: OgcApiDocument | null,
  dataDoc: OgcApiDocument | null,
  conformance: ConformanceClass[]
): CSAPICapabilities {
  // Default all capabilities to false
  const capabilities: CSAPICapabilities = {
    hasSystems: false,
    hasDatastreams: false,
    hasObservations: false,
    hasDeployments: false,
    hasProcedures: false,
    hasSamplingFeatures: false,
    hasProperties: false,
    hasCommands: false,
    hasControlStreams: false,
    hasSystemEvents: false,
    hasSystemHistory: false,
    hasFeasibility: false,
  };

  // Check if CSAPI is supported at all
  if (!checkHasConnectedSystemsApi([conformance])) {
    return capabilities;
  }

  // Helper to check if a resource link exists in root document
  const hasLinkToResource = (resourceName: string): boolean => {
    if (!rootDoc?.links) return false;
    return rootDoc.links.some(
      (link) =>
        link.href?.toLowerCase().includes(`/${resourceName.toLowerCase()}`) ||
        link.rel?.toLowerCase().includes(resourceName.toLowerCase())
    );
  };

  // Helper to check if a collection exists
  const hasCollection = (collectionName: string): boolean => {
    if (!dataDoc?.collections) return false;
    return dataDoc.collections.some(
      (col) => col.id?.toLowerCase() === collectionName.toLowerCase()
    );
  };

  // Check each resource type via links or collections
  // Resource names from CSAPI spec
  const resourceChecks: [keyof CSAPICapabilities, string][] = [
    ['hasSystems', 'systems'],
    ['hasDatastreams', 'datastreams'],
    ['hasObservations', 'observations'],
    ['hasDeployments', 'deployments'],
    ['hasProcedures', 'procedures'],
    ['hasSamplingFeatures', 'samplingFeatures'],
    ['hasProperties', 'properties'],
    ['hasCommands', 'commands'],
    ['hasControlStreams', 'controlStreams'],
    ['hasSystemEvents', 'systemEvents'],
    ['hasSystemHistory', 'systemHistory'],
    ['hasFeasibility', 'feasibility'],
  ];

  for (const [capabilityKey, resourceName] of resourceChecks) {
    capabilities[capabilityKey] =
      hasLinkToResource(resourceName) || hasCollection(resourceName);
  }

  return capabilities;
}

/**
 * This does not include queryables and sortables!
 */
export function parseBaseCollectionInfo(
  doc: OgcApiDocument | OgcApiCollectionInfo
): OgcApiCollectionInfo {
  const { links, ...props } = doc;
  const itemFormats = links
    .filter((link) => link.rel === 'items')
    .map((link) => link.type);
  const enclosureLinks = links
    .filter((link) => link.rel === 'enclosure')
    .reduce((acc, link) => {
      acc[link.type] = link.href;
      return acc;
    }, {});
  const itemsLinks = links
    .filter((link) => link.rel === 'items' && link.type !== 'text/html')
    .map((link) => {
      const url = new URL(link.href);
      url.searchParams.set('limit', '10000');
      return {
        ...link,
        href: url.toString(),
      };
    })
    .reduce((acc, link) => {
      acc[link.type] = link.href;
      return acc;
    }, {});
  const bulkDownloadLinks = { ...itemsLinks, ...enclosureLinks };
  const mimeTypes = Object.keys(bulkDownloadLinks);
  const jsonMimeType =
    mimeTypes.find(isMimeTypeJsonFg) ||
    mimeTypes.find(isMimeTypeGeoJson) ||
    mimeTypes.find(isMimeTypeJson);
  const jsonDownloadLink = jsonMimeType
    ? bulkDownloadLinks[jsonMimeType]
    : null;
  return {
    itemFormats: itemFormats,
    bulkDownloadLinks,
    jsonDownloadLink,
    ...props,
  } as OgcApiCollectionInfo;
}

export function parseCollectionParameters(
  doc: OgcApiDocument
): CollectionParameter[] {
  if ('properties' in doc && typeof doc.properties === 'object') {
    return Object.keys(doc.properties).map((name) => {
      const prop = doc.properties[name];
      let type: CollectionParameterType = 'string';
      if (typeof prop.$ref === 'string') {
        const schemaRef = prop.$ref.toLowerCase();
        if (schemaRef.indexOf('point') > -1) type = 'point';
        else if (schemaRef.indexOf('linestring') > -1) type = 'linestring';
        else if (schemaRef.indexOf('polygon') > -1) type = 'polygon';
        else if (schemaRef.indexOf('geometry') > -1) type = 'geometry';
      } else if (
        typeof prop.type === 'string' &&
        CollectionParameterTypes.indexOf(prop.type.toLowerCase()) > -1
      ) {
        type = prop.type.toLowerCase();
      }
      return {
        name,
        type,
        ...(typeof prop.title === 'string' && { title: prop.title }),
      };
    });
  }
  if (Array.isArray(doc)) {
    return doc.map((prop) => ({
      name: prop,
      type: 'string',
    }));
  }
  return [];
}

export function parseTileMatrixSets(doc: OgcApiDocument): TileMatrixSet[] {
  if (Array.isArray(doc.tileMatrixSets)) {
    return doc.tileMatrixSets.map((set) => {
      return {
        id: set.id,
        uri: set.uri,
      };
    });
  }
  return [];
}

export function parseBasicStyleInfo(doc: OgcApiStyleMetadata): OgcStyleBrief {
  const formats = doc.links
    .filter((link) => link.rel === 'stylesheet')
    .map((link) => link.type)
    .filter((type) => type !== 'text/html');
  return {
    formats,
    id: doc.id,
    ...(doc.title && { title: doc.title }),
  };
}

export function parseStylesAsList(): (doc: OgcApiStylesDocument) => string[] {
  return (doc: OgcApiStylesDocument) =>
    doc?.styles?.map((style) => style.id as string);
}

export function parseFullStyleInfo(doc: OgcApiStyleMetadata): OgcStyleFull {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { stylesheets, links, ...props } = doc;
  const stylesheetFormats = stylesheets
    ?.filter((stylesheet) => stylesheet.link.rel === 'stylesheet')
    ?.map((stylesheet) => stylesheet.link.type);
  return {
    ...(stylesheetFormats && { stylesheetFormats }),
    ...(stylesheets && { stylesheets }),
    ...props,
  } as OgcStyleFull;
}

export function parseCollections(doc: OgcApiDocument): Array<{
  name: string;
  hasRecords?: boolean;
  hasFeatures?: boolean;
  hasVectorTiles?: boolean;
  hasMapTiles?: boolean;
  hasDataQueries?: boolean;
}> {
  return doc.collections.map((collection) => {
    const result: {
      name: string;
      hasRecords?: boolean;
      hasFeatures?: boolean;
      hasVectorTiles?: boolean;
      hasMapTiles?: boolean;
      hasDataQueries?: boolean;
    } = {
      name: collection.id as string,
    };
    if (collection.itemType === 'record') {
      result.hasRecords = true;
    }
    if (collection.itemType === 'feature' || !collection.itemType) {
      result.hasFeatures = true;
    }
    if (
      collection.links.some(
        (link) =>
          link.rel === 'http://www.opengis.net/def/rel/ogc/1.0/tilesets-vector'
      )
    ) {
      result.hasVectorTiles = true;
    }
    if (
      collection.links.some(
        (link) =>
          link.rel === 'http://www.opengis.net/def/rel/ogc/1.0/tilesets-map'
      )
    ) {
      result.hasMapTiles = true;
    }

    if (collection.data_queries) {
      result.hasDataQueries = true;
    }

    return result;
  });
}
