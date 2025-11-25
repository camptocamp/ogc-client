/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Advanced Filtering Helpers (B7)
 * Uses unified fixtures from examples/ directory.
 * Geometry filtering remains a placeholder.
 */
import { loadFixtureEnv } from './fixture_loader';

/**
 * Represents a System resource for filtering operations.
 * @see OGC 23-001 §8
 */
export interface System {
  /** Unique identifier for the system */
  id: string;
  /** Human-readable name of the system */
  name?: string;
  /** ID of the parent system (for subsystems) */
  parentId?: string;
  /** IDs of procedures associated with this system */
  procedureIds?: string[];
  /** IDs of features of interest associated with this system */
  foiIds?: string[];
  /** Properties observed by this system */
  observedProperties?: string[];
  /** Properties controlled by this system */
  controlledProperties?: string[];
}

/**
 * Represents a Deployment resource for filtering operations.
 * @see OGC 23-001 §9
 */
export interface Deployment {
  /** Unique identifier for the deployment */
  id: string;
  /** ID of the parent deployment (for sub-deployments) */
  parentId?: string;
  /** IDs of systems associated with this deployment */
  systemIds?: string[];
  /** IDs of features of interest associated with this deployment */
  foiIds?: string[];
  /** Properties observed during this deployment */
  observedProperties?: string[];
  /** Properties controlled during this deployment */
  controlledProperties?: string[];
}

/**
 * Represents a Procedure resource for filtering operations.
 * @see OGC 23-001 §10
 */
export interface Procedure {
  /** Unique identifier for the procedure */
  id: string;
  /** Properties observed by this procedure */
  observedProperties?: string[];
  /** Properties controlled by this procedure */
  controlledProperties?: string[];
}

/**
 * Represents a SamplingFeature resource for filtering operations.
 * @see OGC 23-001 §11
 */
export interface SamplingFeature {
  /** Unique identifier for the sampling feature */
  id: string;
  /** IDs of features of interest associated with this sampling feature */
  foiIds?: string[];
  /** Properties observed at this sampling feature */
  observedProperties?: string[];
  /** Properties controlled at this sampling feature */
  controlledProperties?: string[];
}

/**
 * Represents a Property Definition resource for filtering operations.
 * @see OGC 23-001 §12
 */
export interface PropertyDef {
  /** Unique identifier for the property definition */
  id: string;
  /** Base property that this property extends or specializes */
  baseProperty?: string;
  /** Types of objects this property applies to */
  objectTypes?: string[];
}

/**
 * Extracts an array from various fixture formats.
 * Supports FeatureCollection, member arrays, and direct arrays.
 * @template T - The type of items in the array
 * @param raw - The raw fixture data
 * @param pluralKey - The key name for the array in the fixture
 * @returns Array of extracted items
 */
function extractArray<T = any>(raw: any, pluralKey: string): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.features)) return raw.features;
  if (Array.isArray(raw.members)) return raw.members;
  if (raw[pluralKey] && Array.isArray(raw[pluralKey])) return raw[pluralKey];
  for (const v of Object.values(raw)) {
    if (Array.isArray(v)) return v as T[];
  }
  return [];
}

/**
 * Maps raw fixture data to System interface.
 * @param arr - Array of raw system features
 * @returns Array of mapped System objects
 */
function mapSystems(arr: any[]): System[] {
  return arr
    .map((f) => ({
      id: f.id,
      name: f.properties?.name,
      parentId: f.properties?.parentId,
      procedureIds: f.properties?.procedureIds,
      foiIds: f.properties?.foiIds,
      observedProperties: f.properties?.observedProperties,
      controlledProperties: f.properties?.controlledProperties,
    }))
    .filter((s) => !!s.id);
}

/**
 * Maps raw fixture data to Deployment interface.
 * @param arr - Array of raw deployment features
 * @returns Array of mapped Deployment objects
 */
function mapDeployments(arr: any[]): Deployment[] {
  return arr
    .map((f) => ({
      id: f.id,
      parentId: f.properties?.parentId,
      systemIds: f.properties?.systemIds,
      foiIds: f.properties?.foiIds,
      observedProperties: f.properties?.observedProperties,
      controlledProperties: f.properties?.controlledProperties,
    }))
    .filter((d) => !!d.id);
}

/**
 * Maps raw fixture data to Procedure interface.
 * @param arr - Array of raw procedure features
 * @returns Array of mapped Procedure objects
 */
function mapProcedures(arr: any[]): Procedure[] {
  return arr
    .map((f) => ({
      id: f.id,
      observedProperties: f.properties?.observedProperties,
      controlledProperties: f.properties?.controlledProperties,
    }))
    .filter((p) => !!p.id);
}

/**
 * Maps raw fixture data to SamplingFeature interface.
 * @param arr - Array of raw sampling feature data
 * @returns Array of mapped SamplingFeature objects
 */
function mapSamplingFeatures(arr: any[]): SamplingFeature[] {
  return arr
    .map((f) => ({
      id: f.id,
      foiIds: f.properties?.foiIds,
      observedProperties: f.properties?.observedProperties,
      controlledProperties: f.properties?.controlledProperties,
    }))
    .filter((sf) => !!sf.id);
}

/**
 * Maps raw fixture data to PropertyDef interface.
 * @param arr - Array of raw property definition data
 * @returns Array of mapped PropertyDef objects
 */
function mapPropertyDefs(arr: any[]): PropertyDef[] {
  return arr
    .map((f) => ({
      id: f.id,
      baseProperty: f.baseProperty || f.properties?.baseProperty,
      objectTypes: f.objectTypes || f.properties?.objectTypes,
    }))
    .filter((pd) => !!pd.id);
}

const systemsRaw = loadFixtureEnv('systems');
const deploymentsRaw = loadFixtureEnv('deployments');
const proceduresRaw = loadFixtureEnv('procedures');
const samplingFeaturesRaw = loadFixtureEnv('samplingFeatures');
const propertiesRaw = loadFixtureEnv('properties');

/** Pre-loaded and mapped systems from fixtures */
export const systems = mapSystems(extractArray(systemsRaw, 'systems'));
/** Pre-loaded and mapped deployments from fixtures */
export const deployments = mapDeployments(
  extractArray(deploymentsRaw, 'deployments')
);
/** Pre-loaded and mapped procedures from fixtures */
export const procedures = mapProcedures(
  extractArray(proceduresRaw, 'procedures')
);
/** Pre-loaded and mapped sampling features from fixtures */
export const samplingFeatures = mapSamplingFeatures(
  extractArray(samplingFeaturesRaw, 'samplingFeatures')
);
/** Pre-loaded and mapped property definitions from fixtures */
export const propertyDefs = mapPropertyDefs(
  extractArray(propertiesRaw, 'propertyDefs')
);

/** Type for ID pattern matching (supports wildcards with '*') */
type IdList = string[] | undefined;

/**
 * Matches an ID against a list of patterns (supports wildcard suffix '*').
 * @param id - The ID to match
 * @param patterns - Array of ID patterns (e.g., ['sys-001', 'sys-*'])
 * @returns True if the ID matches any pattern, or if patterns is empty/undefined
 */
function matchId(id: string, patterns: IdList): boolean {
  if (!patterns || patterns.length === 0) return true;
  return patterns.some((p) =>
    p.endsWith('*') ? id.startsWith(p.slice(0, -1)) : id === p
  );
}

/**
 * Checks if all required values are present in the values array.
 * @param values - Array of values to check against
 * @param required - Required values that must all be present
 * @returns True if all required values are in values, or if required is empty
 */
function matchList(
  values: string[] | undefined,
  required: string[] | undefined
): boolean {
  if (!required || required.length === 0) return true;
  if (!values) return false;
  return required.every((r) => values.includes(r));
}

/**
 * Checks if a single value is in the required list.
 * @param value - The value to check
 * @param required - List of acceptable values
 * @returns True if value is in required, or if required is empty
 */
function matchSingle(
  value: string | undefined,
  required: string[] | undefined
): boolean {
  if (!required || required.length === 0) return true;
  if (!value) return false;
  return required.includes(value);
}

/**
 * Performs case-insensitive keyword matching.
 * @param name - The string to search in
 * @param q - The keyword to search for
 * @returns True if name contains q (case-insensitive), or if q is empty
 */
function matchKeyword(
  name: string | undefined,
  q: string | undefined
): boolean {
  if (!q) return true;
  if (!name) return false;
  return name.toLowerCase().includes(q.toLowerCase());
}

/**
 * Filters systems based on provided criteria.
 * Implements /req/resource-filter requirements from OGC 23-001 §7.6.
 * @param p - Filter parameters
 * @param p.id - Filter by system ID patterns (supports wildcards)
 * @param p.parent - Filter by parent system IDs
 * @param p.procedure - Filter by associated procedure IDs
 * @param p.foi - Filter by feature of interest IDs
 * @param p.observedProperty - Filter by observed property URIs
 * @param p.controlledProperty - Filter by controlled property URIs
 * @param p.q - Keyword search in system name
 * @returns Array of systems matching all specified criteria
 */
export function filterSystems(p: {
  id?: string[];
  parent?: string[];
  procedure?: string[];
  foi?: string[];
  observedProperty?: string[];
  controlledProperty?: string[];
  q?: string;
}): System[] {
  return systems.filter(
    (s) =>
      matchId(s.id, p.id) &&
      matchSingle(s.parentId, p.parent) &&
      matchList(s.procedureIds, p.procedure) &&
      matchList(s.foiIds, p.foi) &&
      matchList(s.observedProperties, p.observedProperty) &&
      matchList(s.controlledProperties, p.controlledProperty) &&
      matchKeyword(s.name, p.q)
  );
}

/**
 * Filters deployments based on provided criteria.
 * Implements /req/resource-filter requirements from OGC 23-001 §7.6.
 * @param p - Filter parameters
 * @param p.id - Filter by deployment ID patterns (supports wildcards)
 * @param p.parent - Filter by parent deployment IDs
 * @param p.system - Filter by associated system IDs
 * @param p.foi - Filter by feature of interest IDs
 * @param p.observedProperty - Filter by observed property URIs
 * @param p.controlledProperty - Filter by controlled property URIs
 * @returns Array of deployments matching all specified criteria
 */
export function filterDeployments(p: {
  id?: string[];
  parent?: string[];
  system?: string[];
  foi?: string[];
  observedProperty?: string[];
  controlledProperty?: string[];
}): Deployment[] {
  return deployments.filter(
    (d) =>
      matchId(d.id, p.id) &&
      matchSingle(d.parentId, p.parent) &&
      matchList(d.systemIds, p.system) &&
      matchList(d.foiIds, p.foi) &&
      matchList(d.observedProperties, p.observedProperty) &&
      matchList(d.controlledProperties, p.controlledProperty)
  );
}

/**
 * Filters procedures based on provided criteria.
 * Implements /req/resource-filter requirements from OGC 23-001 §7.6.
 * @param p - Filter parameters
 * @param p.id - Filter by procedure ID patterns (supports wildcards)
 * @param p.observedProperty - Filter by observed property URIs
 * @param p.controlledProperty - Filter by controlled property URIs
 * @returns Array of procedures matching all specified criteria
 */
export function filterProcedures(p: {
  id?: string[];
  observedProperty?: string[];
  controlledProperty?: string[];
}): Procedure[] {
  return procedures.filter(
    (pr) =>
      matchId(pr.id, p.id) &&
      matchList(pr.observedProperties, p.observedProperty) &&
      matchList(pr.controlledProperties, p.controlledProperty)
  );
}

/**
 * Filters sampling features based on provided criteria.
 * Implements /req/resource-filter requirements from OGC 23-001 §7.6.
 * @param p - Filter parameters
 * @param p.id - Filter by sampling feature ID patterns (supports wildcards)
 * @param p.foi - Filter by feature of interest IDs
 * @param p.observedProperty - Filter by observed property URIs
 * @param p.controlledProperty - Filter by controlled property URIs
 * @returns Array of sampling features matching all specified criteria
 */
export function filterSamplingFeatures(p: {
  id?: string[];
  foi?: string[];
  observedProperty?: string[];
  controlledProperty?: string[];
}): SamplingFeature[] {
  return samplingFeatures.filter(
    (sf) =>
      matchId(sf.id, p.id) &&
      matchList(sf.foiIds, p.foi) &&
      matchList(sf.observedProperties, p.observedProperty) &&
      matchList(sf.controlledProperties, p.controlledProperty)
  );
}

/**
 * Filters property definitions based on provided criteria.
 * Implements /req/resource-filter requirements from OGC 23-001 §7.6.
 * @param p - Filter parameters
 * @param p.id - Filter by property definition ID patterns (supports wildcards)
 * @param p.baseProperty - Filter by base property URIs
 * @param p.objectType - Filter by object types this property applies to
 * @returns Array of property definitions matching all specified criteria
 */
export function filterPropertyDefs(p: {
  id?: string[];
  baseProperty?: string[];
  objectType?: string[];
}): PropertyDef[] {
  return propertyDefs.filter(
    (pd) =>
      matchId(pd.id, p.id) &&
      matchSingle(pd.baseProperty, p.baseProperty) &&
      matchList(pd.objectTypes, p.objectType)
  );
}

/**
 * Computes the intersection of two arrays based on ID.
 * @template T - Type with an 'id' property
 * @param a - First array
 * @param b - Second array
 * @returns Array of items from 'a' whose IDs are also in 'b'
 */
export function intersection<T extends { id: string }>(a: T[], b: T[]): T[] {
  const ids = new Set(b.map((x) => x.id));
  return a.filter((x) => ids.has(x.id));
}

/**
 * Placeholder for geometry-based filtering.
 * Currently returns items unchanged; geometry filtering is not yet implemented.
 * @template T - Type of items to filter
 * @param items - Array of items to filter
 * @param _geom - Geometry filter string (currently ignored)
 * @returns The input items unchanged
 */
export function geometryFilterPlaceholder<T>(items: T[], _geom?: string): T[] {
  return items;
}
