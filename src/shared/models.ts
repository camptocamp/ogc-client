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
