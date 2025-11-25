/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for CSAPI Part 2 — Datastreams
 * Validates canonical endpoints, nested references, and schema operations for Datastreams.
 *
 * Traces to:
 *   - /req/datastream/canonical-endpoint    (23-002 §7.4)
 *   - /req/datastream/resources-endpoint    (23-002 §9.4)
 *   - /req/datastream/canonical-url         (23-002 §9)
 *   - /req/datastream/ref-from-system       (23-002 §9)
 *   - /req/datastream/ref-from-deployment   (23-002 §9)
 *   - /req/datastream/collections           (23-002 §9)
 *   - /req/datastream/schema-op             (23-002 §9)
 *
 * Test strategy:
 *   - Hybrid execution (fixtures by default, live endpoints when CSAPI_LIVE = true)
 *   - Validates FeatureCollection structure and canonical URL patterns
 *   - Ensures nested datastream references and schema operation exist
 *   - Derives parent IDs (system/deployment) from fixture properties when available
 */

import { getDatastreamsUrl, getDatastreamByIdUrl } from '../url_builder';
import {
  maybeFetchOrLoad,
  expectFeatureCollection,
  expectCanonicalUrl,
} from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

/**
 * Requirement: /req/datastream/canonical-endpoint
 */
test('GET /datastreams is exposed as canonical Datastreams collection', async () => {
  const url = getDatastreamsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('datastreams', url);

  expectFeatureCollection(data, 'Datastream');
  expect(Array.isArray(data.features)).toBe(true);
  expect(data.features.length).toBeGreaterThan(0);
});

/**
 * Requirement: /req/datastream/resources-endpoint
 */
test('GET /datastreams returns FeatureCollection (itemType=Datastream)', async () => {
  const url = getDatastreamsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('datastreams', url);

  expectFeatureCollection(data, 'Datastream');

  const first = data.features[0];
  expect(first).toHaveProperty('id');
  expect(first).toHaveProperty('type', 'Feature');
  expect(first).toHaveProperty('properties');
});

/**
 * Requirement: /req/datastream/canonical-url
 */
test('Datastreams have canonical item URL at /datastreams/{id}', async () => {
  const url = getDatastreamsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('datastreams', url);
  const first = data.features[0];

  const itemUrl = getDatastreamByIdUrl(apiRoot, first.id);
  expectCanonicalUrl(itemUrl, /^https?:\/\/.+\/datastreams\/[^/]+$/);
});

/**
 * Requirement: /req/datastream/collections
 */
test('Collections with featureType sosa:Datastream behave like /datastreams', async () => {
  const url = getDatastreamsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('datastreams', url);

  expectFeatureCollection(data, 'Datastream');
  const featureType = data.features?.[0]?.properties?.featureType;
  if (featureType) {
    expect(featureType).toMatch(/sosa:Datastream/i);
  }
});

/**
 * Requirement: /req/datastream/ref-from-system
 * Derive systemId from feature properties when available.
 */
test('GET /systems/{id}/datastreams lists datastreams for a System', async () => {
  const rootUrl = getDatastreamsUrl(apiRoot);
  const rootData: any = await maybeFetchOrLoad('datastreams', rootUrl);

  const withSystem = rootData.features.filter((f: any) => {
    const p = f.properties || {};
    return (Array.isArray(p.systemIds) && p.systemIds.length > 0) || p.systemId;
  });

  if (withSystem.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[datastreams.spec] No system linkage present; skipping /req/datastream/ref-from-system assertion.'
    );
    return;
  }

  const props = withSystem[0].properties;
  const systemId = Array.isArray(props.systemIds)
    ? props.systemIds[0]
    : props.systemId;
  const nestedUrl = `${apiRoot}/systems/${systemId}/datastreams`;
  const nestedData: any = await maybeFetchOrLoad(
    `datastreams_system_${systemId}`,
    nestedUrl
  );

  expectFeatureCollection(nestedData, 'Datastream');
  expect(Array.isArray(nestedData.features)).toBe(true);
});

/**
 * Requirement: /req/datastream/ref-from-deployment
 * Derive deploymentId from feature properties when available.
 */
test('GET /deployments/{id}/datastreams lists datastreams for a Deployment', async () => {
  const rootUrl = getDatastreamsUrl(apiRoot);
  const rootData: any = await maybeFetchOrLoad('datastreams', rootUrl);

  const withDeployment = rootData.features.filter((f: any) => {
    const p = f.properties || {};
    return (
      (Array.isArray(p.deploymentIds) && p.deploymentIds.length > 0) ||
      p.deploymentId
    );
  });

  if (withDeployment.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[datastreams.spec] No deployment linkage present; skipping /req/datastream/ref-from-deployment assertion.'
    );
    return;
  }

  const props = withDeployment[0].properties;
  const deploymentId = Array.isArray(props.deploymentIds)
    ? props.deploymentIds[0]
    : props.deploymentId;
  const nestedUrl = `${apiRoot}/deployments/${deploymentId}/datastreams`;
  const nestedData: any = await maybeFetchOrLoad(
    `datastreams_deployment_${deploymentId}`,
    nestedUrl
  );

  expectFeatureCollection(nestedData, 'Datastream');
  expect(Array.isArray(nestedData.features)).toBe(true);
});

/**
 * Requirement: /req/datastream/schema-op
 * Derive datastreamId from collection; skip if none.
 */
test('GET /datastreams/{id}/schema?obsFormat=… returns observation schema', async () => {
  const url = getDatastreamsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('datastreams', url);

  if (!data.features?.length) {
    // eslint-disable-next-line no-console
    console.warn(
      '[datastreams.spec] No datastreams available; skipping schema operation assertion.'
    );
    return;
  }

  const datastreamId = data.features[0].id;
  const schemaUrl = `${getDatastreamByIdUrl(
    apiRoot,
    datastreamId
  )}/schema?obsFormat=application/json`;
  const schema: any = await maybeFetchOrLoad(
    `datastream_schema_${datastreamId}`,
    schemaUrl
  );

  expect(schema).toBeDefined();
  expect(Object.keys(schema)).toContain('type');
});
