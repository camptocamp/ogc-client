import { OgcApiCollectionInfo, OgcApiDocument } from "../ogc-api/model.js";

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

export interface OgcEDRCollectionInfo extends OgcApiCollectionInfo {
  data_queries?: {
    [K in DataQueryTypes]?: {
      link: {
        href: string;
        rel: string;
      };
    };
  };
}

export interface OgcEDRDocument extends OgcApiDocument {
  collections: OgcEDRCollectionInfo[];
}
