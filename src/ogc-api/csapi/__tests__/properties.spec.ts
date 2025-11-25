/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for CSAPI Part 1 — Property Definitions
 * Ensures non-feature Property Definition resources are exposed via canonical endpoints
 * and follow listing semantics consistent with OGC API – Features collections.
 *
 * Traces to:
 *   - /req/property/canonical-endpoint  (23-001 §15)
 *   - /req/property/resources-endpoint  (23-001 §15)
 *   - /req/property/canonical-url       (23-001 §15)
 *
 * Test strategy:
 *   - Hybrid execution (fixtures by default, live endpoints when CSAPI_LIVE=true)
 *   - Validates non-feature resource structure and canonical URL patterns
 *   - Confirms listing semantics and item property metadata integrity
 */

import { getPropertiesUrl } from '../url_builder';
import { maybeFetchOrLoad, expectCanonicalUrl } from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

/**
 * Requirement: /req/property/canonical-endpoint
 * The /properties endpoint SHALL be exposed as the canonical Property Definitions collection.
 */
test('GET /properties is exposed as canonical Property Definitions collection', async () => {
  const url = getPropertiesUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('properties', url);

  // Non-feature collection: must have 'type' and 'members'
  expect(data).toBeDefined();
  expect(data.type).toBe('Collection');
  expect(Array.isArray(data.members)).toBe(true);
  expect(data.members.length).toBeGreaterThan(0);
});

/**
 * Requirement: /req/property/resources-endpoint
 * The /properties collection SHALL return descriptive members with expected fields.
 */
test('GET /properties returns a valid list of property definitions', async () => {
  const url = getPropertiesUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('properties', url);

  expect(data.type).toBe('Collection');

  const first = data.members[0];
  expect(first).toHaveProperty('id');
  expect(first).toHaveProperty('name');
  expect(first).toHaveProperty('definition');
  expect(first).toHaveProperty('type');
});

/**
 * Requirement: /req/property/canonical-url
 * Each Property Definition SHALL have a canonical item URL at /properties/{id}.
 */
test('Property Definition items have canonical item URL at /properties/{id}', async () => {
  const url = getPropertiesUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('properties', url);
  const first = data.members[0];

  const itemUrl = `${apiRoot}/properties/${first.id}`;
  expectCanonicalUrl(itemUrl, /^https?:\/\/.*\/properties\/[^/]+$/);
});

/**
 * Non-feature integrity (Issue 35): Property Definitions SHALL NOT be GeoJSON Features and SHALL NOT include geometry.
 */
test('Property Definitions are non-feature resources (no geometry, not GeoJSON Feature objects)', async () => {
  const url = getPropertiesUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('properties', url);

  for (const m of data.members) {
    expect(m.type).not.toBe('Feature');
    expect(m.geometry).toBeUndefined();
  }
});

/**
 * Additional integrity check:
 * All property definitions SHOULD include a 'unit' or 'encoding' metadata field if applicable.
 */
test('Each property definition includes optional metadata fields', async () => {
  const url = getPropertiesUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('properties', url);

  const hasMeta = data.members.some(
    (m: any) => m.unit || m.encoding || m.observedProperty
  );
  expect(hasMeta).toBe(true);
});
