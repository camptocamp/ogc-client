import { Feature } from 'geojson';
import { BoundingBox, CrsCode } from '../shared/models';

export type ConformanceClass = string;

export interface OgcApiEndpointInfo {
  title: string;
  description?: string;
  attribution?: string;
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
}

export type OgcApiCollectionItem = Feature | unknown;

export type OgcApiDocument = {
  links: {
    rel: string;
    type: string;
    title: string;
    href: string;
  }[];
} & Record<string, unknown>;
