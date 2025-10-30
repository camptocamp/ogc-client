import { BoundingBox } from './models.js';

/**
 * Clamps a bounding box to valid WGS84 bounds
 * Ensures longitude stays within [-180, 180] and latitude within [-90, 90]
 * @param bbox The input bounding box [minx, miny, maxx, maxy]
 * @returns A new bounding box clamped to valid WGS84 bounds
 */
export function clampBoundingBox(bbox: BoundingBox): BoundingBox {
  return [
    Math.max(-180, Math.min(180, bbox[0])), // minX (longitude)
    Math.max(-90, Math.min(90, bbox[1])),   // minY (latitude)
    Math.max(-180, Math.min(180, bbox[2])), // maxX (longitude)
    Math.max(-90, Math.min(90, bbox[3])),   // maxY (latitude)
  ];
}
