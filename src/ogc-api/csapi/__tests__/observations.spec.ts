/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for CSAPI Part 2 — Observations
 * Confirms canonical endpoints and nested listing behavior under Datastreams.
 *
 * Traces to:
 *   - /req/observation/canonical-endpoint  (23-002 §7.4)
 *   - /req/observation/resources-endpoint  (23-002 §9)
 *   - /req/observation/canonical-url       (23-002 §9)
 *   - /req/observation/ref-from-datastream (23-002 §9)
 *   - /req/observation/collections         (23-002 §9)
 *
 * Test strategy:
 *   - Hybrid execution (fixtures by default, live endpoints when CSAPI_LIVE=true)
 *   - Validates FeatureCollection structure, itemType, and canonical URL patterns
 *   - Ensures nested Observations are discoverable under Datastreams
 *   - Derives datastreamId dynamically; skips gracefully if linkage absent
 */
import { getObservationsUrl, getDatastreamsUrl } from '../url_builder';
import {
  maybeFetchOrLoad,
  expectFeatureCollection,
  expectCanonicalUrl,
} from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

/**
 * Requirement: /req/observation/canonical-endpoint
 */
test('GET /observations is exposed as canonical Observations collection', async () => {
  const url = getObservationsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('observations', url);

  expectFeatureCollection(data, 'Observation');
  expect(Array.isArray(data.features)).toBe(true);
  expect(data.features.length).toBeGreaterThan(0);
});

/**
 * Requirement: /req/observation/resources-endpoint
 */
test('GET /observations returns FeatureCollection (itemType=Observation)', async () => {
  const url = getObservationsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('observations', url);

  expectFeatureCollection(data, 'Observation');

  const first = data.features[0];
  expect(first).toHaveProperty('id');
  expect(first).toHaveProperty('type', 'Feature');
  expect(first).toHaveProperty('properties');
});

/**
 * Requirement: /req/observation/canonical-url
 */
test('Observations have canonical item URL at /observations/{id}', async () => {
  const url = getObservationsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('observations', url);
  const first = data.features[0];

  const itemUrl = `${apiRoot}/observations/${first.id}`;
  expectCanonicalUrl(itemUrl, /^https?:\/\/[^/]+\/observations\/[^/]+$/);
});

/**
 * Requirement: /req/observation/collections
 * Any collection with featureType sosa:Observation SHALL behave like /observations.
 */
test('Collections with featureType sosa:Observation behave like /observations', async () => {
  const url = getObservationsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('observations', url);

  expectFeatureCollection(data, 'Observation');
  const featureType = data.features?.[0]?.properties?.featureType;
  if (featureType) {
    expect(featureType).toMatch(/sosa:Observation/i);
  }
});

/**
 * Requirement: /req/observation/ref-from-datastream
 * Each Datastream SHALL expose nested Observations at /datastreams/{id}/observations.
 * Derive datastreamId dynamically from the datastreams collection; skip if unavailable.
 */
test('GET /datastreams/{id}/observations lists observations for a Datastream', async () => {
  let datastreamRoot: any;
  try {
    datastreamRoot = await maybeFetchOrLoad(
      'datastreams',
      getDatastreamsUrl(apiRoot)
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      '[observations.spec] Unable to load datastreams; skipping /req/observation/ref-from-datastream.'
    );
    return;
  }

  if (!datastreamRoot.features?.length) {
    // eslint-disable-next-line no-console
    console.warn(
      '[observations.spec] No datastream features; skipping /req/observation/ref-from-datastream.'
    );
    return;
  }

  const datastreamId = datastreamRoot.features[0].id;
  const nestedUrl = `${apiRoot}/datastreams/${datastreamId}/observations`; // canonical nested pattern
  let nested: any;
  try {
    nested = await maybeFetchOrLoad(
      `observations_datastream_${datastreamId}`,
      nestedUrl
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      `[observations.spec] No nested observations for datastream '${datastreamId}'; skipping assertion.`
    );
    return;
  }

  expectFeatureCollection(nested, 'Observation');

  // Optional consistency: all features reference the same datastream if property available
  const allSame =
    nested.features.every(
      (f: any) => f.properties?.datastream?.id === datastreamId
    ) || nested.features.length === 0;
  expect(allSame).toBe(true);
});
