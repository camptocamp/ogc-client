/**
 * Expressed as minx, miny, maxx, maxy
 */
type BoundingBox = [number, number, number, number];
type CrsCode = string;
type MimeType = string;
type GenericEndpointInfo = {
    name: string;
    title: string;
    abstract: string;
    fees: string;
    constraints: string;
    keywords: string[];
    outputFormats?: string[];
};
