import {
  BoundingBox,
  CrsCode,
  MetadataURL,
  MimeType,
} from '../shared/models.js';

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
  metadata?: MetadataURL[];
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
  metadata?: MetadataURL[];
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

export type WfsGetFeatureOptions = {
  /**
   * No limit if undefined
   */
  maxFeatures?: number;
  /**
   * if true, will ask for GeoJSON; will throw if the service does not support it
   */
  asJson?: boolean;
  /**
   * a supported output format (overridden by `asJson`)
   */
  outputFormat?: MimeType;
  /**
   * if unspecified, this will be the data native projection
   */
  outputCrs?: CrsCode;
  /**
   * an extent to restrict returned objects
   */
  extent?: BoundingBox;
  /**
   * if unspecified, `extent` should be in the data native projection
   */
  extentCrs?: CrsCode;
  /**
   * if the service supports it, this will be the index of the first feature to return
   */
  startIndex?: number;
  /**
   * if not defined, all attributes will be included; note that the fact
   * that these attributes exist or not will not be checked!
   */
  attributes?: string[];
  /**
   * if true, will not return feature data, only hit count
   * note: this might not work for WFS version < 2
   */
  hitsOnly?: boolean;
};
