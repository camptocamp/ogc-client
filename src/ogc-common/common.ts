import { parseDataQueries } from "../ogc-edr/info.js";
import { OgcApiCollectionInfo, OgcApiDocument } from "./model.js";



export type DataQueryTypes =
  | 'items'
  | 'locations'
  | 'cube'
  | 'area'
  | 'trajectory'
  | 'radius'
  | 'corridor'
  | 'position'
  | 'instances';

// Reflect it as an array:
export const DataQueryTypesArray = [
  'items',
  'locations',
  'cube',
  'area',
  'trajectory',
  'radius',
  'corridor',
  'position',
  'instances',
] as DataQueryTypes[];

export function parseCollections(doc: OgcApiDocument, checkDataQueries = false): Array<{
  name: string;
  hasRecords?: boolean;
  hasFeatures?: boolean;
  hasVectorTiles?: boolean;
  hasMapTiles?: boolean;
  dataQueries?: DataQueryTypes[];
}> {
  return (doc.collections as OgcApiCollectionInfo[]).map((collection) => {
    const result: {
      name: string;
      hasRecords?: boolean;
      hasFeatures?: boolean;
      hasVectorTiles?: boolean;
      hasMapTiles?: boolean;
      dataQueries?: DataQueryTypes[];
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

    if (checkDataQueries) {
      result.dataQueries = parseDataQueries(collection);
    }

    return result;
  });
}