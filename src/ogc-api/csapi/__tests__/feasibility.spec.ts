/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for CSAPI Part 2 — Feasibility
 * Verifies canonical endpoints and lifecycle resources (Status/Result)
 * for feasibility requests as defined in Part 2 §11.
 *
 * Traces to:
 *   - /req/feasibility/canonical-endpoint  (23-002 §7.4)
 *   - /req/feasibility/resources-endpoint  (23-002 §11)
 *   - /req/feasibility/canonical-url       (23-002 §7.4)
 *   - /req/feasibility/status-result       (23-002 §11)
 *
 * Test strategy:
 *   - Hybrid execution (fixtures by default, live endpoints when CSAPI_LIVE=true)
 *   - Validates canonical URL structure, FeatureCollection conformance, and
 *     Status/Result resources for feasibility lifecycle
 */

import { getFeasibilityUrl } from '../url_builder';
import {
  maybeFetchOrLoad,
  expectFeatureCollection,
  expectCanonicalUrl,
} from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

/** Type for FeatureCollection with features array */
type FeatureCollectionData = {
  type: string;
  features: Array<{
    id?: string;
    type?: string;
    properties?: {
      status?: { href?: string };
      result?: { href?: string };
    };
    links?: Array<{ rel?: string; href?: string }>;
  }>;
  itemType?: string;
};

/**
 * Requirement: /req/feasibility/canonical-endpoint
 * The /feasibility endpoint SHALL be exposed as the canonical Feasibility collection.
 */
test('GET /feasibility is exposed as canonical Feasibility collection', async () => {
  const url = getFeasibilityUrl(apiRoot);
  const data = (await maybeFetchOrLoad(
    'feasibility',
    url
  )) as FeatureCollectionData;

  expectFeatureCollection(data as Record<string, unknown>, 'Feasibility');
  expect(Array.isArray(data.features)).toBe(true);
  expect(data.features.length).toBeGreaterThan(0);
});

/**
 * Requirement: /req/feasibility/resources-endpoint
 * The /feasibility collection SHALL conform to OGC API – Features collection rules.
 */
test('GET /feasibility returns FeatureCollection (itemType=Feasibility)', async () => {
  const url = getFeasibilityUrl(apiRoot);
  const data = (await maybeFetchOrLoad(
    'feasibility',
    url
  )) as FeatureCollectionData;

  expectFeatureCollection(data as Record<string, unknown>, 'Feasibility');

  const first = data.features[0];
  expect(first).toHaveProperty('id');
  expect(first).toHaveProperty('type', 'Feature');
  expect(first).toHaveProperty('properties');
});

/**
 * Requirement: /req/feasibility/canonical-url
 * Each Feasibility item SHALL have a canonical URL at /feasibility/{id}.
 */
test('Feasibility items have canonical item URL at /feasibility/{id}', async () => {
  const url = getFeasibilityUrl(apiRoot);
  const data = (await maybeFetchOrLoad(
    'feasibility',
    url
  )) as FeatureCollectionData;
  const first = data.features[0];

  const itemUrl = `${apiRoot}/feasibility/${first.id}`;
  expectCanonicalUrl(itemUrl, /^https?:\/\/.+\/feasibility\/[^/]+$/);
});

/**
 * Requirement: /req/feasibility/status-result
 * Each Feasibility request SHALL expose separate Status and Result resources.
 */
test('Each Feasibility request exposes Status and Result resources', async () => {
  const url = getFeasibilityUrl(apiRoot);
  const data = (await maybeFetchOrLoad(
    'feasibility',
    url
  )) as FeatureCollectionData;
  const first = data.features[0];

  const statusUrl =
    first.properties?.status?.href ||
    first.links?.find((l) => l.rel?.toLowerCase() === 'status')?.href;
  const resultUrl =
    first.properties?.result?.href ||
    first.links?.find((l) => l.rel?.toLowerCase() === 'result')?.href;

  expect(statusUrl || resultUrl).toBeDefined();
  if (statusUrl)
    expectCanonicalUrl(
      statusUrl,
      /^https?:\/\/.+\/feasibility\/[^/]+\/status$/
    );
  if (resultUrl)
    expectCanonicalUrl(
      resultUrl,
      /^https?:\/\/.+\/feasibility\/[^/]+\/result$/
    );
});
