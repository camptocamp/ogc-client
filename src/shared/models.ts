/**
 * Expressed as minx, miny, maxx, maxy
 */
export type BoundingBox = [number, number, number, number];

export type CrsCode = string;

export type GenericEndpointInfo = {
  name: string;
  title: string;
  abstract: string;
  fees: string;
  constraints: string;
  keywords: string[];
  outputFormats?: MimeType[];
};

export type MimeType = string;

export interface FetchOptions {
  headers?: Record<string, string>;
  mode?: 'same-origin' | 'cors' | 'no-cors';
  credentials?: 'same-origin' | 'include' | 'omit';
  redirect?: 'follow' | 'error';
  referrer?: string;
  integrity?: string;
}

export interface LayerStyle {
  name: string;
  title: string;
  abstract: string;
  /**
   * May not be defined; a GetLegendGraphic operation should work in any case
   */
  legendUrl?: string;
}
