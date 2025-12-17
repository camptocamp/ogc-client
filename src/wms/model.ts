import {
  BoundingBox,
  CrsCode,
  LayerStyle,
  type MetadataURL,
} from '../shared/models.js';
import { BaseLayerCore } from '../shared/base-layer';

export type WmsLayerAttribution = {
  title?: string;
  url?: string;
  logoUrl?: string;
};

export interface WmsLayerSummary extends BaseLayerCore {
  /**
   * Not defined if the layer is a leaf in the tree
   */
  children?: WmsLayerSummary[];
}

export interface WmsLayerFull extends Exclude<WmsLayerSummary, 'children'> {
  /**
   * The layer is renderable if defined
   */
  availableCrs: CrsCode[];
  styles: LayerStyle[];
  /**
   * Dict of bounding boxes where keys are CRS codes
   */
  boundingBoxes: Record<CrsCode, BoundingBox>;
  queryable: boolean;
  opaque: boolean;
  maxScaleDenominator?: number;
  minScaleDenominator?: number;
  attribution?: WmsLayerAttribution;
  keywords?: string[];
  metadata?: MetadataURL[];
  /**
   * Not defined if the layer is a leaf in the tree
   */
  children?: WmsLayerFull[];
}

export type WmsVersion = '1.1.0' | '1.1.1' | '1.3.0';
