import { BoundingBox, CrsCode, MimeType } from '../shared/models.js';

export type WfsVersion = '1.0.0' | '1.1.0' | '2.0.0';

export type WfsFeatureTypeInternal = {
  name: string;
  title?: string;
  abstract?: string;
  defaultCrs: CrsCode;
  otherCrs: CrsCode[];
  outputFormats: MimeType[];
  latLonBoundingBox?: BoundingBox;
  keywords?: string[];
};

export type FeaturePropertyType = string | number | boolean;

export type FeatureGeometryType =
  | 'linestring'
  | 'polygon'
  | 'point'
  | 'multilinestring'
  | 'multipolygon'
  | 'multipoint'
  | 'unknown';

export type WfsFeatureTypeBrief = {
  name: string;
  title?: string;
  abstract?: string;
  /**
   * Expressed in latitudes and longitudes
   */
  boundingBox?: BoundingBox;
};

export type WfsFeatureTypeSummary = {
  name: string;
  title?: string;
  abstract?: string;
  /**
   * Expressed in latitudes and longitudes
   */
  boundingBox?: BoundingBox;
  defaultCrs: CrsCode;
  otherCrs: CrsCode[];
  outputFormats: MimeType[];
  keywords?: string[];
};

export type WfsFeatureTypeFull = {
  name: string;
  title?: string;
  abstract?: string;
  /**
   * Expressed in latitudes and longitudes
   */
  boundingBox?: BoundingBox;
  defaultCrs: CrsCode;
  otherCrs: CrsCode[];
  outputFormats: MimeType[];
  /**
   * These properties will *not* include the feature geometry
   */
  properties: Record<string, FeaturePropertyType>;
  /**
   * Not defined if no geometry present
   */
  geometryName?: string;
  /**
   * Not defined if no geometry present
   */
  geometryType?: FeatureGeometryType;
  /**
   * Not defined if object count could not be determined
   */
  objectCount?: number;
  keywords?: string[];
};

export type WfsFeatureWithProps = {
  /**
   * Feature id
   */
  id: string;
  /**
   * Feature properties
   */
  properties: Record<string, FeaturePropertyType>;
};

export type WfsFeatureTypeUniqueValue = {
  value: number | boolean | string;
  count: number;
};

export type WfsFeatureTypePropDetails = {
  uniqueValues: WfsFeatureTypeUniqueValue[];
};

export type WfsFeatureTypePropsDetails = Record<
  string,
  WfsFeatureTypePropDetails
>;
