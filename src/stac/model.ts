import { Feature, Geometry } from 'geojson';

/**
 * STAC specification version 1.0.0
 */
export type StacVersion = '1.0.0';

/**
 * Bounding box in format [minx, miny, maxx, maxy] for 2D
 * or [minx, miny, minz, maxx, maxy, maxz] for 3D
 */
export type StacBBox =
  | [number, number, number, number]
  | [number, number, number, number, number, number];

/**
 * Link object used to reference related resources
 */
export interface StacLink {
  /**
   * Relationship type
   */
  rel: string;
  /**
   * URI or URL to the linked resource
   */
  href: string;
  /**
   * Media type of the linked resource
   */
  type?: string;
  /**
   * Human-readable title for the link
   */
  title?: string;
  /**
   * HTTP method for the request (default: GET)
   */
  method?: string;
  /**
   * Additional headers to include in the request
   */
  headers?: Record<string, string | string[]>;
  /**
   * Request body for POST requests
   */
  body?: unknown;
}

/**
 * Provider of STAC data - organization or individual
 */
export interface StacProvider {
  /**
   * Name of the organization or individual
   */
  name: string;
  /**
   * Description of what the provider does
   */
  description?: string;
  /**
   * Roles of the provider (producer, licensor, processor, host)
   */
  roles?: ('producer' | 'licensor' | 'processor' | 'host')[];
  /**
   * Homepage URL
   */
  url?: string;
}

/**
 * Band information for assets
 */
export interface StacBand {
  /**
   * Name of the band
   */
  name?: string;
  /**
   * Description of the band using CommonMark syntax
   */
  description?: string;
  /**
   * Center wavelength of the band in micrometers
   */
  center_wavelength?: number;
  /**
   * Full width at half maximum of the band in micrometers
   */
  full_width_half_max?: number;
}

/**
 * Statistics for data values
 */
export interface StacStatistics {
  /**
   * Minimum value
   */
  minimum?: number;
  /**
   * Maximum value
   */
  maximum?: number;
  /**
   * Mean value
   */
  mean?: number;
  /**
   * Standard deviation
   */
  stddev?: number;
  /**
   * Number of values used for statistics
   */
  count?: number;
}

/**
 * Common metadata fields used across STAC objects
 */
export interface CommonMetadata {
  /**
   * Human-readable title
   */
  title?: string;
  /**
   * Detailed description using CommonMark syntax
   */
  description?: string;
  /**
   * List of keywords describing the entity
   */
  keywords?: string[];
  /**
   * SPDX License identifier, SPDX expression, or 'other'
   */
  license?: string;
  /**
   * Organizations or individuals who captured, processed, or hosted the data
   */
  providers?: StacProvider[];
  /**
   * Creation date and time in UTC (ISO 8601)
   */
  created?: string;
  /**
   * Last update date and time in UTC (ISO 8601)
   */
  updated?: string;
  /**
   * Unique name of the platform (satellite, aircraft, etc.)
   */
  platform?: string;
  /**
   * List of instrument names
   */
  instruments?: string[];
  /**
   * Name of the constellation to which the platform belongs
   */
  constellation?: string;
  /**
   * Name of the mission or campaign
   */
  mission?: string;
  /**
   * Ground Sample Distance in meters
   */
  gsd?: number;
}

/**
 * Asset object containing a link to data and metadata about that data
 */
export interface StacAsset extends Partial<CommonMetadata> {
  /**
   * URI to the asset object (required)
   */
  href: string;
  /**
   * Human-readable title
   */
  title?: string;
  /**
   * Description of the asset
   */
  description?: string;
  /**
   * Media type of the asset
   */
  type?: string;
  /**
   * Semantic roles of the asset
   */
  roles?: string[];
  /**
   * Information about bands in the asset
   */
  bands?: StacBand[];
  /**
   * Value representing no data or invalid data
   */
  nodata?: number | string;
  /**
   * Data type of the values (e.g., uint8, float32)
   */
  data_type?: string;
  /**
   * Statistics about data values
   */
  statistics?: StacStatistics;
  /**
   * Unit of measurement (UCUM or UDUNITS-2)
   */
  unit?: string;
}

/**
 * Spatial extent with one or more bounding boxes
 */
export interface StacSpatialExtent {
  /**
   * Array of bounding boxes (at least one required)
   */
  bbox: StacBBox[];
}

/**
 * Temporal extent with one or more time intervals
 */
export interface StacTemporalExtent {
  /**
   * Array of time intervals, each with start and end times (ISO 8601)
   * null indicates open-ended interval
   */
  interval: [string | null, string | null][];
}

/**
 * Extent object containing spatial and temporal extents
 */
export interface StacExtent {
  /**
   * Spatial extent
   */
  spatial: StacSpatialExtent;
  /**
   * Temporal extent
   */
  temporal: StacTemporalExtent;
}

/**
 * Properties object for STAC Item
 */
export interface StacItemProperties extends Partial<CommonMetadata> {
  /**
   * Date and time in UTC (ISO 8601)
   * Either datetime OR both start_datetime and end_datetime are required
   */
  datetime: string | null;
  /**
   * Start date and time for a time range in UTC (ISO 8601)
   */
  start_datetime?: string;
  /**
   * End date and time for a time range in UTC (ISO 8601)
   */
  end_datetime?: string;
  /**
   * Additional properties are allowed
   */
  [key: string]: unknown;
}

/**
 * STAC Item - a GeoJSON Feature with additional STAC metadata
 * Represents a single spatiotemporal asset
 */
export interface StacItem extends Feature {
  /**
   * STAC version (optional - may be inherited from collection/API level)
   */
  stac_version?: StacVersion;
  /**
   * List of extension identifiers
   */
  stac_extensions?: string[];
  /**
   * Provider identifier (unique within the collection)
   */
  id: string;
  /**
   * Type must be "Feature" (from GeoJSON)
   */
  type: 'Feature';
  /**
   * GeoJSON Geometry object or null
   */
  geometry: Geometry | null;
  /**
   * Bounding box (required if geometry is not null)
   */
  bbox?: StacBBox;
  /**
   * Properties object containing metadata
   */
  properties: StacItemProperties;
  /**
   * Links to related resources
   */
  links: StacLink[];
  /**
   * Dictionary of asset objects (optional - some APIs may omit)
   */
  assets?: Record<string, StacAsset>;
  /**
   * Collection ID (required if a "collection" link exists)
   */
  collection?: string;
}

/**
 * STAC Catalog - a simple linking structure for organizing STAC Items
 */
export interface StacCatalog {
  /**
   * STAC version
   */
  stac_version: StacVersion;
  /**
   * List of extension identifiers
   */
  stac_extensions?: string[];
  /**
   * Type must be "Catalog"
   */
  type: 'Catalog';
  /**
   * Identifier for the catalog
   */
  id: string;
  /**
   * Human-readable title
   */
  title?: string;
  /**
   * Detailed description
   */
  description: string;
  /**
   * Links to related resources
   */
  links: StacLink[];
}

/**
 * STAC Collection - represents a collection of STAC Items with additional metadata
 */
export interface StacCollection {
  /**
   * STAC version
   */
  stac_version: StacVersion;
  /**
   * List of extension identifiers
   */
  stac_extensions?: string[];
  /**
   * Type must be "Collection"
   */
  type: 'Collection';
  /**
   * Identifier for the collection
   */
  id: string;
  /**
   * Human-readable title
   */
  title?: string;
  /**
   * Detailed description
   */
  description: string;
  /**
   * List of keywords
   */
  keywords?: string[];
  /**
   * Collection license (SPDX identifier or 'other')
   */
  license: string;
  /**
   * Organizations or individuals who provided the data
   */
  providers?: StacProvider[];
  /**
   * Spatial and temporal extents
   */
  extent: StacExtent;
  /**
   * Links to related resources
   */
  links: StacLink[];
  /**
   * Dictionary of asset objects (at collection level)
   */
  assets?: Record<string, StacAsset>;
  /**
   * Summaries of properties across all items in the collection
   */
  summaries?: Record<string, unknown>;
  /**
   * Common metadata inherited by all items
   */
  properties?: Partial<CommonMetadata>;
}
