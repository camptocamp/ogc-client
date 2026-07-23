export interface NcwmsLayerDetails {
  scaleRange: [number, number];
  palettes: string[];
  defaultPalette?: string;
  supportedStyles: string[];
  units: string;
  bbox: BoundingBox;
}

export interface NcwmsMinMax {
  min: number;
  max: number;
}
