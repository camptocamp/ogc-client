/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems (CSAPI)
 * URL Builder Utilities (canonical endpoint patterns)
 *
 * Provides canonical URL construction helpers for all CSAPI resource collections.
 * Aligned with tests under __tests__/endpoints.part2.canonical.spec.ts.
 */

/**
 * Default API root URL for CSAPI endpoints.
 * Can be overridden via the CSAPI_API_ROOT environment variable.
 */
const DEFAULT_API_ROOT =
  process.env.CSAPI_API_ROOT ?? 'https://example.csapi.server';

/* -------------------------------------------------------------------------- */
/*                               Core Utilities                               */
/* -------------------------------------------------------------------------- */

/**
 * Builds a canonical CSAPI URL for a given collection and optional resource ID.
 * @param collection - The name of the CSAPI collection (e.g., 'systems', 'deployments')
 * @param apiRoot - The base URL of the CSAPI server (defaults to DEFAULT_API_ROOT)
 * @param id - Optional resource ID to append to the URL
 * @returns The constructed canonical URL
 * @example
 * buildCsapiUrl('systems', 'https://api.example.com')
 * // Returns: 'https://api.example.com/systems'
 * @example
 * buildCsapiUrl('systems', 'https://api.example.com', 'sys-001')
 * // Returns: 'https://api.example.com/systems/sys-001'
 */
export const buildCsapiUrl = (
  collection: string,
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
): string => {
  const path = id ? `/${collection}/${id}` : `/${collection}`;
  return `${apiRoot}${path}`;
};

/* -------------------------------------------------------------------------- */
/*                         Canonical Endpoint Exports                         */
/* -------------------------------------------------------------------------- */

/**
 * List of all canonical CSAPI endpoint names.
 * These correspond to the standard resource collections defined in OGC API - Connected Systems.
 * @see OGC 23-002 §7.4
 */
export const CANONICAL_ENDPOINTS = [
  'systems',
  'deployments',
  'procedures',
  'samplingFeatures',
  'properties',
  'datastreams',
  'observations',
  'controlStreams',
  'commands',
  'feasibility',
  'systemEvents',
  'systemHistory',
];

/**
 * Convenience wrappers (expected by tests)
 * e.g. getSystemsUrl(apiRoot?) → returns canonical /systems URL.
 */

/**
 * Returns the canonical URL for the /systems collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional system ID to get a specific system's URL
 * @returns The systems collection or specific system URL
 */
export const getSystemsUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('systems', apiRoot, id);

/**
 * Returns the canonical URL for the /deployments collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional deployment ID to get a specific deployment's URL
 * @returns The deployments collection or specific deployment URL
 */
export const getDeploymentsUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('deployments', apiRoot, id);

/**
 * Returns the canonical URL for the /procedures collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional procedure ID to get a specific procedure's URL
 * @returns The procedures collection or specific procedure URL
 */
export const getProceduresUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('procedures', apiRoot, id);

/**
 * Returns the canonical URL for the /samplingFeatures collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional sampling feature ID to get a specific feature's URL
 * @returns The samplingFeatures collection or specific feature URL
 */
export const getSamplingFeaturesUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('samplingFeatures', apiRoot, id);

/**
 * Returns the canonical URL for the /properties collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional property ID to get a specific property's URL
 * @returns The properties collection or specific property URL
 */
export const getPropertiesUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('properties', apiRoot, id);

/**
 * Returns the canonical URL for the /datastreams collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional datastream ID to get a specific datastream's URL
 * @returns The datastreams collection or specific datastream URL
 */
export const getDatastreamsUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('datastreams', apiRoot, id);

/**
 * Returns the canonical URL for a specific datastream by ID.
 * @param apiRoot - The base URL of the CSAPI server
 * @param datastreamId - The ID of the datastream
 * @returns The specific datastream URL
 */
export const getDatastreamByIdUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  datastreamId: string
) => buildCsapiUrl('datastreams', apiRoot, datastreamId);

/**
 * Returns the canonical URL for the /observations collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional observation ID to get a specific observation's URL
 * @returns The observations collection or specific observation URL
 */
export const getObservationsUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('observations', apiRoot, id);

/**
 * Returns the canonical URL for the /controlStreams collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional control stream ID to get a specific stream's URL
 * @returns The controlStreams collection or specific stream URL
 */
export const getControlStreamsUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('controlStreams', apiRoot, id);

/**
 * Returns the canonical URL for the /commands collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional command ID to get a specific command's URL
 * @returns The commands collection or specific command URL
 */
export const getCommandsUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('commands', apiRoot, id);

/**
 * Returns the canonical URL for the /feasibility collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional feasibility ID to get a specific feasibility item's URL
 * @returns The feasibility collection or specific item URL
 */
export const getFeasibilityUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('feasibility', apiRoot, id);

/**
 * Returns the canonical URL for the /systemEvents collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional system event ID to get a specific event's URL
 * @returns The systemEvents collection or specific event URL
 */
export const getSystemEventsUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('systemEvents', apiRoot, id);

/**
 * Returns the canonical URL for the /systemHistory collection.
 * @param apiRoot - The base URL of the CSAPI server
 * @param id - Optional revision ID to get a specific history entry's URL
 * @returns The systemHistory collection or specific entry URL
 */
export const getSystemHistoryUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  id?: string
) => buildCsapiUrl('systemHistory', apiRoot, id);

/**
 * Nested and alias helpers for tests that call e.g. getSystemEventsForSystemUrl()
 */

/**
 * Returns the canonical URL for system events nested under a specific system.
 * @param apiRoot - The base URL of the CSAPI server
 * @param systemId - The ID of the system to get events for
 * @returns The nested events URL (e.g., /systems/{systemId}/events)
 */
export const getSystemEventsForSystemUrl = (
  apiRoot: string = DEFAULT_API_ROOT,
  systemId: string
) => `${buildCsapiUrl('systems', apiRoot, systemId)}/events`;

/* -------------------------------------------------------------------------- */
/*                              Aggregate Helpers                             */
/* -------------------------------------------------------------------------- */

/**
 * Returns a copy of all canonical CSAPI collection names.
 * @returns Array of collection endpoint names
 */
export const allCsapiCollections = (): string[] => [...CANONICAL_ENDPOINTS];

/**
 * Returns an array of all canonical CSAPI collection URLs for a given API root.
 * @param apiRoot - The base URL of the CSAPI server
 * @returns Array of all collection URLs
 */
export const allCsapiUrls = (apiRoot: string = DEFAULT_API_ROOT): string[] =>
  CANONICAL_ENDPOINTS.map((c) => buildCsapiUrl(c, apiRoot));
