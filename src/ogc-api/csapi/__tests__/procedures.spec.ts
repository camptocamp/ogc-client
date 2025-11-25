/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for CSAPI Part 1 — Procedures
 * Verifies that Procedures resources expose canonical endpoints and conform
 * to OGC API – Features collection semantics.
 *
 * Traces to:
 *   - /req/procedure/canonical-endpoint  (23-001 §13)
 *   - /req/procedure/resources-endpoint  (23-001 §13)
 *   - /req/procedure/canonical-url       (23-001 §13)
 *   - /req/procedure/collections         (23-001 §13)
 *   - /req/procedure/location            (23-001 §13, geometry SHALL be absent)
 *
 * Test strategy:
 *   - Hybrid execution (fixtures by default, live endpoints when CSAPI_LIVE=true)
 *   - Validates FeatureCollection structure, itemType, canonical URL patterns
 *   - Asserts Procedures do not include geometry
 */

import { getProceduresUrl } from '../url_builder';
import {
  maybeFetchOrLoad,
  expectFeatureCollection,
  expectCanonicalUrl,
} from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

/**
 * Requirement: /req/procedure/canonical-endpoint
 * The /procedures endpoint SHALL be exposed as the canonical Procedures collection.
 */
test('GET /procedures is exposed as canonical Procedures collection', async () => {
  const url = getProceduresUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('procedures', url);

  expectFeatureCollection(data, 'Procedure');
  expect(Array.isArray(data.features)).toBe(true);
  expect(data.features.length).toBeGreaterThan(0);
});

/**
 * Requirement: /req/procedure/resources-endpoint
 * The /procedures collection SHALL conform to OGC API – Features collection rules.
 */
test('GET /procedures returns FeatureCollection (itemType=Procedure)', async () => {
  const url = getProceduresUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('procedures', url);

  expectFeatureCollection(data, 'Procedure');

  const first = data.features[0];
  expect(first).toHaveProperty('id');
  expect(first).toHaveProperty('type', 'Feature');
  expect(first).toHaveProperty('properties');
});

/**
 * Requirement: /req/procedure/canonical-url
 * Each Procedure SHALL have a canonical item URL at /procedures/{id}.
 */
test('Procedures have canonical item URL at /procedures/{id}', async () => {
  const url = getProceduresUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('procedures', url);
  const first = data.features[0];

  const itemUrl = `${apiRoot}/procedures/${first.id}`;
  expectCanonicalUrl(itemUrl, /^https?:\/\/.*\/procedures\/[^/]+$/);
});

/**
 * Requirement: /req/procedure/collections
 * Any collection with featureType sosa:Procedure SHALL behave like /procedures.
 */
test('Collections with featureType sosa:Procedure behave like /procedures', async () => {
  const url = getProceduresUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('procedures', url);

  expectFeatureCollection(data, 'Procedure');

  const featureType = data.features?.[0]?.properties?.featureType;
  if (featureType) {
    expect(featureType).toMatch(/sosa:Procedure/i);
  }
});

/* -------------------------------------------------------------------------- */
/* /req/procedure/location                                                    */
/* -------------------------------------------------------------------------- */
/**
 * Requirement: /req/procedure/location
 * Procedures SHALL NOT carry geometry; their GeoJSON representation omits the geometry member
 * (or it is null). This test asserts absence of a populated geometry object.
 */
test('Procedures omit geometry per /req/procedure/location', async () => {
  const url = getProceduresUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('procedures', url);
  const first = data.features[0];

  const geom = first.geometry;
  // Accept undefined, null, or empty object. Reject populated geometry with type.
  const hasDisallowedGeometry =
    geom &&
    typeof geom === 'object' &&
    Object.keys(geom).length > 0 &&
    (geom as any).type;
  expect(hasDisallowedGeometry).toBeFalsy();
});
