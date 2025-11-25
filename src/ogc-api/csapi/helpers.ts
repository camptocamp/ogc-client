/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

import { CSAPIParameter } from './model';
import * as fs from 'fs';
import * as path from 'path';
import { loadFixtureEnv } from './fixture_loader';

/* -------------------------------------------------------------------------- */
/*                Core Parameter Extraction Utility (Unchanged)               */
/* -------------------------------------------------------------------------- */

/**
 * Extracts CSAPIParameter definitions from a parameter block.
 * Retained from original implementation.
 */
export function extractParameters(
  parameterBlock: Record<string, unknown> | null | undefined
): CSAPIParameter[] {
  if (!parameterBlock || typeof parameterBlock !== 'object') {
    return [];
  }
  return Object.values(parameterBlock) as CSAPIParameter[];
}

/* -------------------------------------------------------------------------- */
/*                         CSAPI Normalized Fetch Helper                      */
/* -------------------------------------------------------------------------- */

/**
 * Normalized fetch wrapper for CSAPI live mode.
 * Conformance-neutral: enforces OGC API media types only.
 * @see OGC 23-001 §7.3, 23-002 §7.4
 */
export async function csapiFetch(
  url: string,
  options: RequestInit = {}
): Promise<unknown> {
  const headers = {
    Accept: 'application/json,application/schema+json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const msg = `[CSAPI] Fetch failed: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  return response.json();
}

/* -------------------------------------------------------------------------- */
/*         Hybrid Fixture / Live / Client Integration Helper Functions        */
/* -------------------------------------------------------------------------- */

/**
 * OGC API – Connected Systems Helpers
 * Provides hybrid data-access utilities for tests and client modules.
 * Modes:
 *   - Default: load from local unified fixtures (examples/)
 *   - CSAPI_LIVE=true: fetch from live remote endpoint
 *   - CSAPI_CLIENT_MODE=true: call actual CSAPI client modules
 */

/* -------------------------------------------------------------------------- */
/*                               JSON Fetching                                */
/* -------------------------------------------------------------------------- */

/**
 * Fetch JSON from a live CSAPI endpoint.
 */
export async function fetchCollection(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/* -------------------------------------------------------------------------- */
/*                           Fixture Loading Utility                          */
/* -------------------------------------------------------------------------- */

/**
 * Unified fixture loader.
 * Loads fixtures from the unified examples directory.
 */
export function loadFixture(fixtureName: string): unknown {
  return loadFixtureEnv(fixtureName);
}

/* -------------------------------------------------------------------------- */
/*                          Hybrid Accessor / Mode Switch                     */
/* -------------------------------------------------------------------------- */

/**
 * maybeFetchOrLoad
 * Unified entry point for test data.
 *
 * Resolution order:
 *   1. If CSAPI_CLIENT_MODE=true → dynamic client invocation
 *   2. Else if CSAPI_LIVE=true → fetch from remote URL
 *   3. Else → load local fixture JSON from unified examples/
 *
 * **Type Safety in Tests**
 *
 * Since this function returns `Promise<unknown>`, callers must apply type
 * assertions or guards before accessing properties. Recommended patterns:
 *
 * Pattern 1: Type Assertion (when shape is known)
 * ```typescript
 * type FeatureCollectionData = { type: string; features: Array<{...}> };
 * const data = (await maybeFetchOrLoad('fixture', url)) as FeatureCollectionData;
 * expect(data.features.length).toBeGreaterThan(0);
 * ```
 *
 * Pattern 2: Double Cast for Helpers (when passing to typed functions)
 * ```typescript
 * const data = await maybeFetchOrLoad('fixture', url);
 * expectFeatureCollection(data as Record<string, unknown>);
 * ```
 *
 * Pattern 3: Runtime Guard (when shape may vary)
 * ```typescript
 * const data = await maybeFetchOrLoad('fixture', url);
 * if (typeof data === 'object' && data !== null && 'features' in data) {
 *   const features = (data as { features: any[] }).features;
 *   expect(Array.isArray(features)).toBe(true);
 * }
 * ```
 */
export async function maybeFetchOrLoad(
  fixtureName: string,
  liveUrl?: string
): Promise<unknown> {
  const USE_CLIENT_MODE = process.env.CSAPI_CLIENT_MODE === 'true';
  const USE_LIVE_MODE = process.env.CSAPI_LIVE === 'true';

  // --- Mode 1: Dynamic client invocation ---
  if (USE_CLIENT_MODE) {
    try {
      const module: Record<string, any> = await import('./index');

      // Normalize fixture name (e.g., endpoint_systemEvents → SystemEventsClient)
      const base = fixtureName.replace(/^endpoint_/, '');
      const parts = base.split(/[^a-zA-Z0-9]/).filter(Boolean);
      const clientKey = parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('');
      const clientName = `${clientKey}Client`;

      const client = module[clientName];
      const apiRoot =
        process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

      if (typeof client?.list === 'function') {
        return await client.list(apiRoot);
      }
      if (typeof client?.get === 'function') {
        return await client.get(apiRoot);
      }

      console.warn(
        `[csapi:helpers] No callable client found for ${clientName}`
      );
    } catch (err) {
      if (err instanceof Error) {
        console.error(
          `[csapi:helpers] Client invocation failed: ${err.message}`
        );
      } else {
        console.error('[csapi:helpers] Unknown client invocation error');
      }
    }
  }

  // --- Mode 2: Live fetch mode ---
  if (USE_LIVE_MODE && liveUrl) {
    return csapiFetch(liveUrl);
  }

  // --- Mode 3: Fixture fallback (profile-aware) ---
  return loadFixture(fixtureName);
}

/* -------------------------------------------------------------------------- */
/*                              Assertion Helpers                             */
/* -------------------------------------------------------------------------- */

/**
 * Validates that an object conforms to OGC FeatureCollection semantics.
 */
export function expectFeatureCollection(
  data: Record<string, unknown>,
  itemType?: string
): void {
  expect(data).toBeDefined();
  expect(data.type).toBe('FeatureCollection');
  expect(Array.isArray((data as any).features)).toBe(true);
  if (itemType) expect((data as any).itemType).toBe(itemType);
}

/**
 * Validates that a URL matches a canonical CSAPI pattern.
 */
export function expectCanonicalUrl(
  url: string,
  pattern: string | RegExp
): void {
  expect(url).toMatch(pattern);
}

/* -------------------------------------------------------------------------- */
/*                         GeoJSON B8 Assertion Helpers                       */
/* -------------------------------------------------------------------------- */

/**
 * Validates that an object is a valid GeoJSON Feature.
 */
export function expectGeoJSONFeature(
  feature: Record<string, unknown>,
  options: { requireGeometry?: boolean; requireProperties?: boolean } = {}
): void {
  const { requireGeometry = false, requireProperties = true } = options;
  expect(feature).toBeDefined();
  expect(feature.type).toBe('Feature');
  expect(feature).toHaveProperty('id');
  if (requireProperties) {
    expect(feature).toHaveProperty('properties');
    expect(typeof feature.properties).toBe('object');
  }
  if (requireGeometry) {
    expect(feature).toHaveProperty('geometry');
    expect(feature.geometry).not.toBeNull();
    expect(typeof feature.geometry).toBe('object');
  }
}

/**
 * Validates that an object is a valid GeoJSON FeatureCollection.
 */
export function expectGeoJSONFeatureCollection(
  collection: Record<string, unknown>,
  itemType?: string
): void {
  expect(collection).toBeDefined();
  expect(collection.type).toBe('FeatureCollection');
  expect(Array.isArray((collection as any).features)).toBe(true);
  if (itemType) expect((collection as any).itemType).toBe(itemType);
  const features = (collection as any).features;
  if (features.length > 0) {
    features.forEach((feature: any) => {
      expect(feature.type).toBe('Feature');
      expect(feature).toHaveProperty('id');
    });
  }
}

/**
 * Validates that a feature has expected link relations.
 */
export function expectLinkRelations(
  feature: Record<string, unknown>,
  expectedRels: string[]
): void {
  expect(feature).toHaveProperty('links');
  expect(Array.isArray((feature as any).links)).toBe(true);
  const links = (feature as any).links;
  const actualRels = links.map((link: any) => link.rel);
  expectedRels.forEach((expectedRel) => {
    expect(actualRels).toContain(expectedRel);
  });
  links.forEach((link: any) => {
    expect(link).toHaveProperty('rel');
    expect(link).toHaveProperty('href');
    expect(typeof link.href).toBe('string');
  });
}

/**
 * Validates that feature properties include expected attribute mappings.
 */
export function expectFeatureAttributeMapping(
  feature: Record<string, unknown>,
  requiredAttributes: string[]
): void {
  expect(feature).toHaveProperty('properties');
  const properties = (feature as any).properties;
  expect(typeof properties).toBe('object');
  requiredAttributes.forEach((attr) => {
    expect(properties).toHaveProperty(attr);
  });
}
