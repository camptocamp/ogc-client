import { BoundingBox, CrsCode } from '../shared/models';

export type LayerStyle = {
  name: string;
  title: string;
  /**
   * May not be defined; a GetLegendGraphic operation should work in any case
   */
  legendUrl?: string;
};

export type LayerAttribution = {
  title?: string;
  url?: string;
  logoUrl?: string;
};

export type WmsLayerSummary = {
  /**
   * The layer is renderable if defined
   */
  name?: string;
  title: string;
  abstract?: string;
  /**
   * Not defined if the layer is a leaf in the tree
   */
  children?: WmsLayerSummary[];
};

export type WmsLayerFull = {
  /**
   * The layer is renderable if defined
   */
  name?: string;
  title: string;
  abstract?: string;
  availableCrs: CrsCode[];
  styles: LayerStyle[];
  /**
   * Dict of bounding boxes where keys are CRS codes
   */
  boundingBoxes: Record<CrsCode, BoundingBox>;
  attribution?: LayerAttribution;
  /**
   * Not defined if the layer is a leaf in the tree
   */
  children?: WmsLayerFull[];
};

export type WmsVersion = '1.1.0' | '1.1.1' | '1.3.0';
