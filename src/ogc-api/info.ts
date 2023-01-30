import {
  ConformanceClass,
  OgcApiCollectionInfo,
  OgcApiDocument,
  OgcApiEndpointInfo,
} from './model';

export function parseEndpointInfo(rootDoc: OgcApiDocument): OgcApiEndpointInfo {
  return {
    title: rootDoc.title as string,
    description: rootDoc.description as string,
    attribution: rootDoc.attribution as string,
  };
}

export function parseConformance(doc: OgcApiDocument): ConformanceClass[] {
  return doc.conformsTo as string[];
}

export function parseCollections(
  itemType: 'record' | 'feature' | null = null
): (doc: OgcApiDocument) => ConformanceClass[] {
  return (doc: OgcApiDocument) =>
    (doc.collections as OgcApiCollectionInfo[])
      .filter(
        (collection) => itemType === null || collection.itemType === itemType
      )
      .map((collection) => collection.id as string);
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

export function parseCollectionInfo(doc: OgcApiDocument): OgcApiCollectionInfo {
  const { links, ...props } = doc;
  return (props as unknown) as OgcApiCollectionInfo;
}
