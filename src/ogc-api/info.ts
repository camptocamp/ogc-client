import {
  CollectionParameter,
  CollectionParameterType,
  CollectionParameterTypes,
  ConformanceClass,
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
    assertHasLinks(rootDoc, [
      'data',
      'http://www.opengis.net/def/rel/ogc/1.0/data',
    ]);
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
    collections.some((collection) => collection.itemType === 'feature')
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

/**
 * This does not include queryables and sortables!
 */
export function parseBaseCollectionInfo(
  doc: OgcApiDocument
): OgcApiCollectionInfo {
  const { links, ...props } = doc;
  const itemFormats = links
    .filter((link) => link.rel === 'items')
    .map((link) => link.type);
  const bulkDownloadLinks = links
    .filter((link) => link.rel === 'enclosure')
    .reduce((acc, link) => {
      acc[link.type] = link.href;
      return acc;
    }, {});
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
  return (doc.collections as OgcApiCollectionInfo[]).map((collection) => {
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