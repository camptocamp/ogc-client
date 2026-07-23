import { BoundingBox } from '../../shared/models.js';

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

export interface NcwmsDatesWithData {
  [year: string]: {
    [month: string]: number[];
  };
}

export interface NcwmsDetailsResponse {
  units?: string;
  bbox?: [string | number, string | number, string | number, string | number];
  scaleRange?: [string | number, string | number];
  numColorBands?: number;
  supportedStyles?: string[];
  zaxis?: {
    units: string;
    positive: boolean;
    values: number[];
  };
  datesWithData?: {
    [year: string]: {
      [month: string]: number[];
    };
  };
  nearestTimeIso?: string;
  timeAxisUnits?: string;
  moreInfo?: string;
  copyright?: string;
  palettes?: string[];
  defaultPalette?: string;
  logScaling?: boolean;
}
