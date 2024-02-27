import {
  BoundingBox,
  CrsCode,
  GenericEndpointInfo,
  LayerStyle,
  MimeType,
} from '../shared/models';

export interface WmtsEndpointInfo extends GenericEndpointInfo {
  getTileUrls: {
    kvp?: string;
    rest?: string;
  };
}

export interface TileMatrix {
  identifier: string;
  scaleDenominator: number;
  resolution?: number; // FOR OL??? or computeResolution?
  /**
   * coordinates of the top left origin of the tile matrix
   */
  topLeft: [number, number];
  /**
   * width in pixels
   */
  tileWidth: number;
  /**
   * height in pixels
   */
  tileHeight: number;
  /**
   * horizontal tile count
   */
  matrixWidth: number;
  /**
   * vertical tile count
   */
  matrixHeight: number;
}

export interface WmtsMatrixSet {
  identifier: string;
  wellKnownScaleSet?: string; // from fixed list?
  crs: CrsCode;
  boundingBox?: BoundingBox;
  tileMatrices: TileMatrix[];
}

export interface MatrixSetLink {
  identifier: string;
  crs: string;
  limits: MatrixSetLimit[];
}

export interface MatrixSetLimit {
  tileMatrix: string;
  minTileRow: number;
  maxTileRow: number;
  minTileCol: number;
  maxTileCol: number;
}

export interface WmtsLayerResourceLink {
  url: string;
  encoding: WmtsRequestEncoding;
  format: MimeType;
}

export type WmtsLayerDimensionValue = string;

export interface LayerDimension {
  identifier: string;
  defaultValue: WmtsLayerDimensionValue;
  values: WmtsLayerDimensionValue[];
}

export interface WmtsLayer {
  name: string;
  resourceLinks: WmtsLayerResourceLink[];
  styles: LayerStyle[];
  defaultStyle: string;
  matrixSets: MatrixSetLink[];
  latLonBoundingBox?: BoundingBox;
  dimensions?: LayerDimension[];
}

export type WmtsRequestEncoding = 'KVP' | 'REST';
