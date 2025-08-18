import { Geometry } from 'geojson';
import { BoundingBox, CrsCode, MimeType } from '../shared/models.js';
export type ConformanceClass = string;

export interface OgcApiEndpointInfo {
  title: string;
  description?: string;
  attribution?: string;
}

export const DataQueryTypes = [
  'items',
  'locations',
  'cube',
  'area',
  'trajectory',
  'radius',
  'corridor',
  'position',
  'instances',
] as const;

export type DataQueryType = (typeof DataQueryTypes)[number];

export const CollectionParameterTypes = [
  'string',
  'number',
  'integer',
  'date',
  'point',
  'linestring',
  'polygon',
  'geometry',
] as const;
export type CollectionParameterType = (typeof CollectionParameterTypes)[number];
export interface CollectionParameter {
  name: string;
  title?: string;
  type: CollectionParameterType;
}

/**
 * Contains all necessary information about a collection of items
 * @property title
 * @property description
 * @property id
 * @property itemType
 * @property itemFormats These mime types are available through the `/items` endpoint;
 *  use the `getCollectionItemsUrl` function to generate a URL using one of those formats
 * @property bulkDownloadLinks Map between formats and bulk download links (no filtering, pagination etc.)
 * @property jsonDownloadLink Link to the first bulk download link using JSON-FG or GeoJSON; null if no link found
 * @property crs
 * @property storageCrs
 * @property itemCount
 * @property keywords
 * @property language Language is Iso 2-letter code (e.g. 'en')
 * @property updated
 * @property extent
 * @property publisher
 * @property license
 * @property queryables
 * @property sortables
 */
export interface OgcApiCollectionInfo {
  links: any;
  title: string;
  description: string;
  id: string;
  itemType: 'feature' | 'record';
  itemFormats: MimeType[];
  bulkDownloadLinks: Record<string, MimeType>;
  jsonDownloadLink: string;
  crs: CrsCode[];
  storageCrs?: CrsCode;
  itemCount: number;
  keywords?: string[];
  language?: string;
  updated?: Date;
  extent?: BoundingBox;
  publisher?: {
    individualName: string;
    organizationName: string;
    positionName: string;
    contactInfo: {
      phone: string;
      email: {
        work: string;
      };
    };
  };
  license?: string;
  queryables: CollectionParameter[];
  sortables: CollectionParameter[];
  // will be empty if the endpoint does not support tiles
  mapTileFormats: MimeType[];
  vectorTileFormats: MimeType[];
  supportedTileMatrixSets: string[]; // identifiers

  data_queries?: {
    [K in DataQueryType]?: {
      link: {
        href: string;
        rel: string;
      };
    };
  };
}

export interface OgcApiDocumentLink {
  rel: string;
  type: string;
  title: string;
  href: string;
}

export type OgcApiDocument = {
  links: {
    rel: string;
    type: string;
    title: string;
    href: string;
  }[];
  tilesets?: {
    title: string;
    tileMatrixSetURI: string;
    crs: string;
    dataType: string;
    links: OgcApiDocumentLink[];
  }[];
} & Record<string, unknown>;

interface OgcApiItemExternalId {
  scheme: string;
  value: string;
}
interface OgcApiRecordThemeConcept {
  id: string;
}

interface OgcApiRecordTheme {
  concepts: OgcApiRecordThemeConcept[];
  scheme: string;
}
interface OgcApiTime {
  date?: string;
  timestamp?: string;
  interval?: [string, string];
  resolution?: string;
}
export interface OgcApiRecordContact {
  name: string;
  links: OgcApiDocumentLink[];
  contactInstructions: string;
  roles: string[];
}
export interface OgcApiRecordLanguage {
  code: string;
  name?: string;
  alternate?: string;
  dir: 'ltr' | 'rtl' | 'ttb' | 'btt';
}

export interface OgcApiRecordProperties {
  created?: Date;
  updated?: Date;
  type: string;
  title: string;
  description?: string;
  keywords?: string[];
  themes?: OgcApiRecordTheme[];
  language?: OgcApiRecordLanguage;
  languages?: OgcApiRecordLanguage[];
  resourceLanguages?: OgcApiRecordLanguage[];
  externalIds?: OgcApiItemExternalId[];
  formats?: string[];
  contacts?: OgcApiRecordContact[];
  license?: string;
  rights?: string;
  providers?: string[];
}

export type OgcApiRecord = {
  id: string;
  type: string;
  time: OgcApiTime;
  geometry: Geometry;
  properties: OgcApiRecordProperties;
  links: OgcApiDocumentLink[];
  conformsTo?: string[];
};

export type OgcApiCollectionItem = OgcApiRecord;

export interface TileMatrixSet {
  id: string;
  uri: string;
}

export type StyleItem = {
  title: string;
  id: string;
  links?: OgcApiDocumentLink[];
  formats?: string[];
};

export type OgcStyleFull = {
  stylesheetFormats: string[];
} & OgcApiStyleMetadata;

export type OgcStyleBrief = {
  id: string;
  title?: string;
  formats?: string[];
};

export type OgcApiStylesDocument = {
  styles: StyleItem[];
  links: OgcApiDocumentLink[];
};

export type OgcApiStyleRecord = {
  title: string;
  id: string;
};

export type OgcApiStylesheet = {
  link: OgcApiDocumentLink;
  title?: string;
  version?: string;
  specification?: string;
  native?: boolean;
};

export type OgcApiStyleMetadata = {
  id: string;
  title?: string;
  description?: string;
  keywords?: string[];
  pointOfContact?: string;
  license?: string;
  created?: string;
  updated?: string;
  scope?: 'style';
  version?: string;
  stylesheets?: OgcApiStylesheet[];
  layers?: {
    id: string;
    description?: string;
    dataType?: 'vector' | 'map' | 'coverage' | 'model';
    geometryType?: 'points' | 'lines' | 'polygons' | 'solids' | 'any';
    propertiesSchema?: any; // https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/schemas/v3.0/schema.json#/definitions/Schema
    sampleData?: OgcApiDocumentLink;
  }[];
  links?: OgcApiDocumentLink[];
};
