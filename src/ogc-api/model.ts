import { Geometry } from 'geojson';
import { BoundingBox, CrsCode, MimeType } from '../shared/models.js';

export type ConformanceClass = string;

export interface OgcApiEndpointInfo {
  title: string;
  description?: string;
  attribution?: string;
}

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
export interface OgcApiRecordProperties {
  type: string;
  title: string;
  recordCreated?: Date;
  recordUpdated?: Date;
  providers?: string[];
  description?: string;
  externalId?: OgcApiItemExternalId[];
  themes?: OgcApiRecordTheme[];
  keywords?: string[];
  language?: string;
  contacts?: OgcApiRecordContact[];
  formats?: string[];
  license?: string;
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
