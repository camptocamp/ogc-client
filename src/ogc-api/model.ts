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

export interface OgcApiCollectionInfo {
  title: string;
  description: string;
  id: string;
  itemType: 'feature' | 'record';
  formats: MimeType[]; // these formats are accessible through the /items API
  bulkDownloadLinks: Record<string, MimeType>; // map between formats and bulk download links (no filtering, pagination etc.)
  crs: CrsCode[];
  storageCrs?: CrsCode;
  itemCount: number;
  keywords?: string[];
  language?: string; // ISO2
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

export interface OgcApiDocumentLinks {
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
  links: OgcApiDocumentLinks[];
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
  links: OgcApiDocumentLinks[];
  conformsTo?: string[];
};

export type OgcApiCollectionItem = OgcApiRecord;
