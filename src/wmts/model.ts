import {
  BoundingBox,
  CrsCode,
  GenericEndpointInfo,
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

export interface LayerStyle {
  name: string;
  title: string;
  legendUrl?: string;
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

export interface LayerResourceUrl {
  url: string;
  encoding: WmtsRequestEncoding;
  format: MimeType;
}

export type LayerDimensionValue = string;

export interface LayerDimension {
  identifier: string;
  defaultValue: LayerDimensionValue;
  values: LayerDimensionValue[];
}

export interface WmtsLayer {
  name: string;
  resourceUrls: LayerResourceUrl[];
  styles: LayerStyle[];
  defaultStyle: string;
  matrixSets: MatrixSetLink[];
  latLonBoundingBox?: BoundingBox;
  dimensions?: LayerDimension[];
}

export interface WmtsTileGrid {
  minZoom: number;
  /**
   * for these arrays the index is the zoom value, so items with an index lower than minZoom are undefined
   */
  origins: [number, number][];
  sizes: [number, number][];
  tileSizes: [number, number][];
}

export type WmtsRequestEncoding = 'KVP' | 'REST';
