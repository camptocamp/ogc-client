/**
 * Format constants for OGC API — Connected Systems (CSAPI).
 *
 * Defines media type constants, SOSA/SSN resource type URI constants,
 * vocabulary namespace URIs, and asset type enumerations used across
 * all CSAPI format handlers.
 *
 * Constants use `as const` assertions for literal type inference and
 * grouped arrays for iteration in format detection logic.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html — OGC API Connected Systems Part 1
 * @see https://docs.ogc.org/is/23-002/23-002.html — OGC API Connected Systems Part 2
 * @see https://www.w3.org/TR/vocab-ssn/ — SOSA/SSN Ontology
 * @module
 */

import type { CSAPIResourceType } from '../model.js';

// ========================================
// Media Type Constants
// ========================================

/**
 * GeoJSON media type for Part 1 resource encoding.
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */
export const MEDIA_TYPE_GEOJSON = 'application/geo+json' as const;

/**
 * Generic JSON media type.
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */
export const MEDIA_TYPE_JSON = 'application/json' as const;

/**
 * SensorML 3.0 JSON media type for rich system/procedure descriptions.
 * @see https://docs.ogc.org/is/23-000/23-000.html
 */
export const MEDIA_TYPE_SENSORML_JSON = 'application/sml+json' as const;

/**
 * SWE Common 3.0 JSON encoding for observation/command data.
 * @see https://docs.ogc.org/is/24-014/24-014.html
 */
export const MEDIA_TYPE_SWE_JSON = 'application/swe+json' as const;

/**
 * SWE Common 3.0 text encoding for observation/command data.
 * @see https://docs.ogc.org/is/24-014/24-014.html
 */
export const MEDIA_TYPE_SWE_TEXT = 'application/swe+text' as const;

/**
 * SWE Common 3.0 CSV encoding for observation/command data.
 * @see https://docs.ogc.org/is/24-014/24-014.html
 */
export const MEDIA_TYPE_SWE_CSV = 'application/swe+csv' as const;

/**
 * SWE Common 3.0 binary encoding for high-throughput data.
 * @see https://docs.ogc.org/is/24-014/24-014.html
 */
export const MEDIA_TYPE_SWE_BINARY = 'application/swe+binary' as const;

/**
 * All CSAPI media types as a grouped array for format detection iteration.
 *
 * Includes Part 1 media types (GeoJSON, JSON, SensorML) and
 * Part 2 media types (SWE Common encodings).
 */
export const CSAPI_MEDIA_TYPES = [
  MEDIA_TYPE_GEOJSON,
  MEDIA_TYPE_JSON,
  MEDIA_TYPE_SENSORML_JSON,
  MEDIA_TYPE_SWE_JSON,
  MEDIA_TYPE_SWE_TEXT,
  MEDIA_TYPE_SWE_CSV,
  MEDIA_TYPE_SWE_BINARY,
] as const;

/** Union type of all CSAPI media type strings. */
export type CSAPIMediaType = (typeof CSAPI_MEDIA_TYPES)[number];

// ========================================
// Resource Type URI Constants — SOSA Ontology
// ========================================

/**
 * SOSA ontology namespace URI.
 *
 * CSAPI `featureType` values use either the full URI form
 * (e.g., `http://www.w3.org/ns/sosa/Sensor`) or the compact
 * CURIE prefix form (e.g., `sosa:Sensor`). Both are equivalent.
 *
 * @see https://www.w3.org/TR/vocab-ssn/
 */
export const SOSA_NS = 'http://www.w3.org/ns/sosa/' as const;

/**
 * Compact CURIE prefix for SOSA ontology terms.
 *
 * Used in `featureType` values as a shorthand for the full
 * {@link SOSA_NS} namespace URI.
 */
export const SOSA_PREFIX = 'sosa:' as const;

// ----------------------------------------
// System Type URIs
// ----------------------------------------

/**
 * SOSA/SSN `featureType` discriminator URIs for System resources.
 *
 * Includes both compact CURIE (`sosa:Sensor`) and full URI
 * (`http://www.w3.org/ns/sosa/Sensor`) forms for each type.
 *
 * @see https://www.w3.org/TR/vocab-ssn/#SOSASensor
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */
export const SystemTypeUris = [
  'sosa:Sensor',
  'http://www.w3.org/ns/sosa/Sensor',
  'sosa:Platform',
  'http://www.w3.org/ns/sosa/Platform',
  'sosa:Actuator',
  'http://www.w3.org/ns/sosa/Actuator',
  'sosa:Sampler',
  'http://www.w3.org/ns/sosa/Sampler',
  'sosa:System',
  'http://www.w3.org/ns/sosa/System',
] as const;

/** Union type of System `featureType` discriminator URIs. */
export type SystemTypeUri = (typeof SystemTypeUris)[number];

// ----------------------------------------
// Deployment Type URIs
// ----------------------------------------

/**
 * SOSA `featureType` discriminator URIs for Deployment resources.
 *
 * @see https://www.w3.org/TR/vocab-ssn/#SOSADeployment
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */
export const DeploymentTypeUris = [
  'sosa:Deployment',
  'http://www.w3.org/ns/sosa/Deployment',
] as const;

/** Union type of Deployment `featureType` discriminator URIs. */
export type DeploymentTypeUri = (typeof DeploymentTypeUris)[number];

// ----------------------------------------
// Procedure Type URIs
// ----------------------------------------

/**
 * SOSA `featureType` discriminator URIs for Procedure resources.
 *
 * @see https://www.w3.org/TR/vocab-ssn/#SOSAProcedure
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */
export const ProcedureTypeUris = [
  'sosa:Procedure',
  'http://www.w3.org/ns/sosa/Procedure',
  'sosa:ObservingProcedure',
  'http://www.w3.org/ns/sosa/ObservingProcedure',
  'sosa:SamplingProcedure',
  'http://www.w3.org/ns/sosa/SamplingProcedure',
  'sosa:ActuatingProcedure',
  'http://www.w3.org/ns/sosa/ActuatingProcedure',
] as const;

/** Union type of Procedure `featureType` discriminator URIs. */
export type ProcedureTypeUri = (typeof ProcedureTypeUris)[number];

// ----------------------------------------
// Sampling Feature Type URIs
// ----------------------------------------

/**
 * SOSA `featureType` discriminator URIs for SamplingFeature resources.
 *
 * @see https://www.w3.org/TR/vocab-ssn/#SOSASample
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */
export const SamplingFeatureTypeUris = [
  'sosa:SamplingFeature',
  'http://www.w3.org/ns/sosa/SamplingFeature',
] as const;

/** Union type of SamplingFeature `featureType` discriminator URIs. */
export type SamplingFeatureTypeUri = (typeof SamplingFeatureTypeUris)[number];

// ----------------------------------------
// Property Type URIs
// ----------------------------------------

/**
 * SOSA `featureType` discriminator URIs for Property resources.
 *
 * @see https://www.w3.org/TR/vocab-ssn/#SOSAObservableProperty
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */
export const PropertyTypeUris = [
  'sosa:ObservableProperty',
  'http://www.w3.org/ns/sosa/ObservableProperty',
  'sosa:ActuatableProperty',
  'http://www.w3.org/ns/sosa/ActuatableProperty',
] as const;

/** Union type of Property `featureType` discriminator URIs. */
export type PropertyTypeUri = (typeof PropertyTypeUris)[number];

// ----------------------------------------
// Part 2 Resource Type URIs
// ----------------------------------------

/**
 * SOSA type URIs for Part 2 Observation resources.
 *
 * @see https://www.w3.org/TR/vocab-ssn/#SOSAObservation
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */
export const ObservationTypeUris = [
  'sosa:Observation',
  'http://www.w3.org/ns/sosa/Observation',
  'sosa:ObservationCollection',
  'http://www.w3.org/ns/sosa/ObservationCollection',
] as const;

/** Union type of Observation type URIs. */
export type ObservationTypeUri = (typeof ObservationTypeUris)[number];

// ========================================
// Vocabulary Namespace Constants
// ========================================

/**
 * SSN (Semantic Sensor Network) ontology namespace URI.
 * @see https://www.w3.org/TR/vocab-ssn/
 */
export const SSN_NS = 'http://www.w3.org/ns/ssn/' as const;

/**
 * QUDT (Quantities, Units, Dimensions and Types) unit vocabulary namespace.
 * Used for `uom` (unit of measure) references in SWE Common components.
 * @see http://qudt.org/vocab/unit/
 */
export const QUDT_NS = 'http://qudt.org/vocab/unit/' as const;

/**
 * UCUM (Unified Code for Units of Measure) namespace.
 * Alternative unit vocabulary used in SWE Common `uom` fields.
 * @see http://unitsofmeasure.org/
 */
export const UCUM_NS = 'http://unitsofmeasure.org/' as const;

/**
 * CF (Climate and Forecast) Standard Names vocabulary namespace.
 * Used for observable property definitions.
 * @see http://vocab.nerc.ac.uk/standard_name/
 */
export const CF_NS = 'http://vocab.nerc.ac.uk/standard_name/' as const;

// ========================================
// Asset Type Constants
// ========================================

/**
 * Allowed values for the `assetType` property on System resources.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html
 */
export const AssetTypes = [
  'Equipment',
  'Human',
  'LivingThing',
  'Simulation',
  'Process',
  'Group',
  'Other',
] as const;

/** Union type of System `assetType` values. */
export type AssetType = (typeof AssetTypes)[number];

// ========================================
// Content-Type Map for Write Operations
// ========================================

/**
 * Maps each CSAPI resource type to the required `Content-Type` header
 * for write operations (POST/PUT).
 *
 * Part 1 resources (OGC 23-001r1 §7–§11) are GeoJSON Features and
 * require `application/geo+json`. Part 2 resources (OGC 23-002r1
 * §7–§10) use plain JSON encoding and require `application/json`.
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html — Part 1 (GeoJSON encoding)
 * @see https://docs.ogc.org/is/23-002/23-002.html — Part 2 (JSON encoding)
 */
export const CSAPI_CONTENT_TYPES: Record<CSAPIResourceType, string> = {
  // Part 1 resources — GeoJSON Features (OGC 23-001r1)
  systems: MEDIA_TYPE_GEOJSON,
  deployments: MEDIA_TYPE_GEOJSON,
  procedures: MEDIA_TYPE_GEOJSON,
  samplingFeatures: MEDIA_TYPE_GEOJSON,
  properties: MEDIA_TYPE_GEOJSON,
  // Part 2 resources — plain JSON (OGC 23-002r1)
  datastreams: MEDIA_TYPE_JSON,
  observations: MEDIA_TYPE_JSON,
  controlStreams: MEDIA_TYPE_JSON,
  commands: MEDIA_TYPE_JSON,
} as const;

/**
 * Returns the required `Content-Type` header for write operations (POST/PUT)
 * against the given CSAPI resource type.
 *
 * Part 1 resources (systems, deployments, procedures, samplingFeatures,
 * properties) require `application/geo+json`. Part 2 resources (datastreams,
 * observations, controlStreams, commands) require `application/json`.
 *
 * @param resourceType - A CSAPI resource type string.
 * @returns The Content-Type string, defaulting to `application/json` for unrecognized types.
 * @see https://docs.ogc.org/is/23-001/23-001.html — Part 1 (GeoJSON encoding)
 * @see https://docs.ogc.org/is/23-002/23-002.html — Part 2 (JSON encoding)
 */
export function getContentTypeForResource(resourceType: string): string {
  return (
    CSAPI_CONTENT_TYPES[resourceType as CSAPIResourceType] ?? MEDIA_TYPE_JSON
  );
}
