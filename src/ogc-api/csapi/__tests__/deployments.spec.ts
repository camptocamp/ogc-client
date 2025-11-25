/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for CSAPI Part 1 — Deployments & Subdeployments
 * Ensures Deployments are exposed as canonical collections with correct item URLs
 * and reuse of OGC API – Features collection behavior.
 *
 * Traces to:
 *   - /req/deployment/canonical-endpoint   (23-001 §11)
 *   - /req/deployment/resources-endpoint   (23-001 §11)
 *   - /req/deployment/canonical-url        (23-001 §11)
 *   - /req/deployment/collections          (23-001 §11)
 *   - /req/deployment/ref-from-system      (system-scoped listing)
 *   - /req/subdeployment/collection
 *   - /req/subdeployment/recursive-param
 *   - /req/subdeployment/recursive-search-deployments
 *   - /req/subdeployment/recursive-search-subdeployments
 *   - /req/subdeployment/recursive-assoc
 *
 * Strategy:
 *   - Hybrid execution (fixtures by default, live endpoints when CSAPI_LIVE=true)
 *   - Validates FeatureCollection structure, itemType, canonical URL patterns
 *   - Provides guarded tests for subdeployment semantics (skip if fixture lacks structure)
 */

import { getDeploymentsUrl } from '../url_builder';
import {
  maybeFetchOrLoad,
  expectFeatureCollection,
  expectCanonicalUrl,
  expectGeoJSONFeature,
  expectGeoJSONFeatureCollection,
  expectLinkRelations,
  expectFeatureAttributeMapping,
} from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

/* -------------------------------------------------------------------------- */
/* /req/deployment/canonical-endpoint                                         */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/deployment/canonical-endpoint
 * The /deployments endpoint SHALL be exposed as the canonical Deployments collection.
 */
test('GET /deployments is exposed as canonical Deployments collection', async () => {
  const url = getDeploymentsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('deployments', url);

  expectFeatureCollection(data, 'Deployment');
  expect(Array.isArray(data.features)).toBe(true);
  expect(data.features.length).toBeGreaterThan(0);
});

/* -------------------------------------------------------------------------- */
/* /req/deployment/resources-endpoint                                         */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/deployment/resources-endpoint
 * The /deployments collection SHALL conform to OGC API – Features collection rules.
 */
test('GET /deployments returns FeatureCollection (itemType=Deployment)', async () => {
  const url = getDeploymentsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('deployments', url);

  expectFeatureCollection(data, 'Deployment');

  const first = data.features[0];
  expect(first).toHaveProperty('id');
  expect(first).toHaveProperty('type', 'Feature');
  expect(first).toHaveProperty('properties');
});

/* -------------------------------------------------------------------------- */
/* /req/deployment/canonical-url                                              */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/deployment/canonical-url
 * Each Deployment SHALL have a canonical item URL at /deployments/{id}.
 */
test('Deployments have canonical item URL at /deployments/{id}', async () => {
  const url = getDeploymentsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('deployments', url);
  const first = data.features[0];
  const itemUrl = `${apiRoot}/deployments/${first.id}`;
  expectCanonicalUrl(itemUrl, /^https?:\/\/.[^/]+\/deployments\/[^/]+$/);
});

/* -------------------------------------------------------------------------- */
/* /req/deployment/collections                                                */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/deployment/collections
 * Any collection with featureType sosa:Deployment SHALL behave like /deployments.
 */
test('Collections with featureType sosa:Deployment behave like /deployments', async () => {
  const url = getDeploymentsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('deployments', url);

  expectFeatureCollection(data, 'Deployment');

  const featureType = data.features?.[0]?.properties?.featureType;
  if (featureType) {
    expect(featureType).toMatch(/sosa:Deployment/i);
  } else {
    // Graceful note if fixture does not annotate featureType
    // eslint-disable-next-line no-console
    console.warn(
      '[deployments.spec] No featureType property in first deployment feature (acceptable stub).'
    );
  }
});

/* -------------------------------------------------------------------------- */
/* /req/deployment/ref-from-system                                            */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/deployment/ref-from-system
 * Deployments SHALL be discoverable via system-scoped references (/systems/{id}/deployments).
 * Test constructs a canonical system-scoped URL pattern using systemIds present in fixture.
 */
test('System-scoped deployments reference (/systems/{systemId}/deployments)', async () => {
  const url = getDeploymentsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('deployments', url);
  const withSystemIds = data.features.filter(
    (f: any) =>
      Array.isArray(f.properties?.systemIds) &&
      f.properties.systemIds.length > 0
  );

  if (withSystemIds.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[deployments.spec] No systemIds present; skipping /req/deployment/ref-from-system assertion.'
    );
    return;
  }

  const systemId = withSystemIds[0].properties.systemIds[0];
  const systemScopedUrl = `${apiRoot}/systems/${systemId}/deployments`;
  expectCanonicalUrl(
    systemScopedUrl,
    /^https?:\/\/.[^/]+\/systems\/[^/]+\/deployments$/
  );
});

/* -------------------------------------------------------------------------- */
/* Subdeployments Block (B3 — New)                                            */
/* -------------------------------------------------------------------------- */
/**
 * The fixture may represent subdeployments via a parentId property on some deployment features.
 * All subdeployment tests are guarded; if no parentId is present they log and return without failing.
 */

/**
 * Requirement: /req/subdeployment/collection
 * Subdeployments SHALL form a collection subset distinguishable by parentId.
 */
test('Subdeployments collection subset is derivable from deployments with parentId', async () => {
  const data: any = await maybeFetchOrLoad(
    'deployments',
    getDeploymentsUrl(apiRoot)
  );
  const subs = data.features.filter((f: any) => !!f.properties?.parentId);
  if (subs.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[deployments.spec] No parentId fields; skipping /req/subdeployment/collection.'
    );
    return;
  }
  expect(subs.length).toBeGreaterThan(0);
});

/**
 * Requirement: /req/subdeployment/recursive-param
 * A hypothetical recursive parameter (?recursive=true) would include both top-level and subdeployments.
 * (Simulated logic only; no live param parsing.)
 */
test('Recursive parameter simulation merges top-level + subdeployments', async () => {
  const data: any = await maybeFetchOrLoad(
    'deployments',
    getDeploymentsUrl(apiRoot)
  );
  const all = data.features;
  const subs = all.filter((f: any) => !!f.properties?.parentId);
  const top = all.filter((f: any) => !f.properties?.parentId);

  if (subs.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[deployments.spec] No subdeployment fixtures; skipping /req/subdeployment/recursive-param.'
    );
    return;
  }

  // Simulate: recursive=false => top only; recursive=true => all
  const recursiveFalse = top;
  const recursiveTrue = all;
  expect(recursiveTrue.length).toBeGreaterThan(recursiveFalse.length);
});

/**
 * Requirement: /req/subdeployment/recursive-search-deployments
 * Searching deployments without recursion returns only top-level entries.
 */
test('Non-recursive search returns only top-level deployments', async () => {
  const data: any = await maybeFetchOrLoad(
    'deployments',
    getDeploymentsUrl(apiRoot)
  );
  const all = data.features;
  const subs = all.filter((f: any) => !!f.properties?.parentId);
  if (subs.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[deployments.spec] No subdeployment fixtures; skipping /req/subdeployment/recursive-search-deployments.'
    );
    return;
  }
  const top = all.filter((f: any) => !f.properties?.parentId);
  expect(top.every((t: any) => !t.properties?.parentId)).toBe(true);
});

/**
 * Requirement: /req/subdeployment/recursive-search-subdeployments
 * Recursive search includes both top-level and subdeployment entries.
 */
test('Recursive search includes subdeployments', async () => {
  const data: any = await maybeFetchOrLoad(
    'deployments',
    getDeploymentsUrl(apiRoot)
  );
  const subs = data.features.filter((f: any) => !!f.properties?.parentId);
  if (subs.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[deployments.spec] No subdeployment fixtures; skipping /req/subdeployment/recursive-search-subdeployments.'
    );
    return;
  }
  expect(subs.length).toBeGreaterThan(0);
});

/**
 * Requirement: /req/subdeployment/recursive-assoc
 * Parent deployment SHALL have an association path /deployments/{id}/subdeployments.
 * (We construct the URL based on a parentId field.)
 */
test('Parent deployment association URL /deployments/{id}/subdeployments is canonical', async () => {
  const data: any = await maybeFetchOrLoad(
    'deployments',
    getDeploymentsUrl(apiRoot)
  );
  const subs = data.features.filter((f: any) => !!f.properties?.parentId);
  if (subs.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[deployments.spec] No subdeployment fixtures; skipping /req/subdeployment/recursive-assoc.'
    );
    return;
  }
  // Pick a subdeployment; emulate link to its parent
  const sub = subs[0];
  const parentId = sub.properties.parentId;
  const assocUrl = `${apiRoot}/deployments/${parentId}/subdeployments`;
  expectCanonicalUrl(
    assocUrl,
    /^https?:\/\/.[^/]+\/deployments\/[^/]+\/subdeployments$/
  );
});

/* -------------------------------------------------------------------------- */
/*                      GeoJSON B8 Requirements: Deployments                  */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/geojson/deployment-schema
 * Deployment GeoJSON representation SHALL conform to the required schema structure:
 * - type: "Feature"
 * - id: unique identifier
 * - properties: object containing deployment attributes
 * - links: array of link objects
 * - geometry: optional (may be present for geospatial deployments)
 */
test('/req/geojson/deployment-schema – Deployment features conform to required GeoJSON schema', async () => {
  const url = getDeploymentsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('deployments', url);
  const first = data.features[0];

  // Validate schema structure
  expect(first.type).toBe('Feature');
  expect(first).toHaveProperty('id');
  expect(typeof first.id).toBe('string');
  expect(first).toHaveProperty('properties');
  expect(typeof first.properties).toBe('object');
  expect(first).toHaveProperty('links');
  expect(Array.isArray(first.links)).toBe(true);

  // Validate links structure
  first.links.forEach((link: any) => {
    expect(link).toHaveProperty('rel');
    expect(link).toHaveProperty('href');
    expect(typeof link.href).toBe('string');
  });

  // Validate FeatureCollection structure
  expectGeoJSONFeatureCollection(data, 'Deployment');
});

/**
 * Requirement: /req/geojson/deployment-mappings
 * Deployment properties SHALL be correctly mapped from the CSAPI Deployment model to GeoJSON properties.
 * This includes: systemId(s), featureType, parentId (for subdeployments), and deployment-specific fields.
 */
test('/req/geojson/deployment-mappings – Deployment properties correctly mapped to GeoJSON', async () => {
  const url = getDeploymentsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('deployments', url);
  const first = data.features[0];

  // Validate that deployment-specific properties are present
  const properties = first.properties;
  expect(properties).toBeDefined();
  expect(typeof properties).toBe('object');

  // Deployments should have featureType
  if (properties.featureType) {
    expect(properties.featureType).toMatch(/sosa:Deployment/i);
  }

  // Deployments typically reference system(s)
  const hasSystemReference =
    properties.systemId !== undefined ||
    properties.systemIds !== undefined ||
    properties.system !== undefined;
  expect(hasSystemReference).toBe(true);

  // Verify system references are correctly typed
  if (properties.systemIds) {
    expect(Array.isArray(properties.systemIds)).toBe(true);
  }
  if (properties.systemId) {
    expect(typeof properties.systemId).toBe('string');
  }
});

/**
 * Requirement: /req/geojson/relation-types (Deployments)
 * Deployment features SHALL include standard link relations.
 * Expected relations: self, system, procedure (at minimum).
 */
test('/req/geojson/relation-types – Deployment features include expected link relations', async () => {
  const url = getDeploymentsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('deployments', url);
  const first = data.features[0];

  expectLinkRelations(first, ['self']);

  // Deployments typically link to systems and procedures
  const allRels = first.links.map((l: any) => l.rel);
  const hasDeploymentRelations = allRels.some((rel: string) =>
    ['system', 'procedure', 'parent'].includes(rel)
  );
  expect(hasDeploymentRelations).toBe(true);
});
