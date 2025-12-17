import type { BoundingBox, MetadataURL } from './models.js';

/**
 * Core properties common to all layer types.
 * This is the minimal contract that all layers must satisfy.
 */
export interface BaseLayerCore {
  /**
   * Unique identifier within the service.
   * Maps to:
   * - `name` for WMS, WFS, WMTS
   * - `id` for OGC API, STAC
   * - `title` for TMS (which lacks a separate ID)
   */
  id: string;

  /**
   * Human-readable title for the layer.
   */
  title?: string;

  /**
   * Detailed description of the layer.
   * Maps to:
   * - `abstract` for WMS, WFS, TMS
   * - `description` for OGC API, STAC
   */
  description?: string;
}

/**
 * Extended layer properties that most layers support.
 * Includes common metadata fields found across different services.
 */
export interface BaseLayerExtended extends BaseLayerCore {
  /**
   * Keywords/tags associated with the layer.
   * Used for search and categorization.
   */
  keywords?: string[];

  /**
   * Bounding box in WGS84 (EPSG:4326) coordinates.
   * Format: [minx, miny, maxx, maxy]
   *
   * This is normalized across services:
   * - WMS: Uses boundingBoxes['EPSG:4326'] or boundingBoxes['CRS:84']
   * - WFS: Uses boundingBox or latLonBoundingBox
   * - WMTS: Uses latLonBoundingBox
   * - OGC API: Uses extent.spatial.bbox[0]
   * - STAC: Uses extent.spatial.bbox[0]
   * - TMS: Uses boundingBox (may not be WGS84)
   */
  boundingBox?: BoundingBox;

  /**
   * Metadata URLs providing additional information about the layer.
   * Links to ISO metadata, FGDC records, etc.
   */
  metadata?: MetadataURL[];
}
