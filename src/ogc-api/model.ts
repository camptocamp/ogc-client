import { Feature } from 'geojson';
import { BoundingBox, CrsCode } from '../shared/models';

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
  crs: ['#/crs'];
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

export type OgcApiCollectionItem = Feature | unknown;

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
export interface OgcApiRecordContact {
  name: string;
  links: OgcApiDocumentLinks[];
  contactInstructions: string;
  roles: string[];
}
export interface OgcApiRecordProperties {
  recordCreated: Date;
  recordUpdated: Date;
  providers: string[];
  type: string;
  title: string;
  description: string;
  externalId: OgcApiItemExternalId[];
  themes: OgcApiRecordTheme[];
  keywords: string[];
  language: string;
  contacts: OgcApiRecordContact[];
  formats: string[];
  license: string;
}

export type OgcRecord = Feature<OgcApiRecordProperties> & {
  links: OgcApiDocumentLinks[];
};
