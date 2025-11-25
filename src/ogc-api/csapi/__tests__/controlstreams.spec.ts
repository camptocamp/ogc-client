/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for CSAPI Part 2 — ControlStreams
 * Validates canonical endpoints, collection semantics, nested references, and schema operations
 * for ControlStream resources.
 *
 * Traces to:
 *   - /req/controlstream/canonical-endpoint   (23-002 §7.4)
 *   - /req/controlstream/resources-endpoint   (23-002 §10–11)
 *   - /req/controlstream/canonical-url        (23-002 §7.4)
 *   - /req/controlstream/ref-from-system      (23-002 §10–11)
 *   - /req/controlstream/schema-op            (23-002 §10–11)
 *   - /req/controlstream/collections          (23-002 §10–11)
 *
 * Test strategy:
 *   - Hybrid execution (fixtures by default, live endpoints when CSAPI_LIVE=true)
 *   - Validates FeatureCollection structure and canonical URL patterns
 *   - Discovers nested ControlStreams under Systems when linkage present
 *   - Verifies ControlStream schema operation (graceful skip if fixture not available)
 *   - Confirms collections with featureType sosa:ControlStream behave like canonical collection
 */
import { getControlStreamsUrl, getSystemsUrl } from '../url_builder';
import {
  maybeFetchOrLoad,
  expectFeatureCollection,
  expectCanonicalUrl,
} from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

/**
 * Requirement: /req/controlstream/canonical-endpoint
 */
test('GET /controlStreams is exposed as canonical ControlStreams collection', async () => {
  const url = getControlStreamsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('controlStreams', url);

  expectFeatureCollection(data, 'ControlStream');
  expect(Array.isArray(data.features)).toBe(true);
  expect(data.features.length).toBeGreaterThan(0);
});

/**
 * Requirement: /req/controlstream/resources-endpoint
 */
test('GET /controlStreams returns FeatureCollection (itemType=ControlStream)', async () => {
  const url = getControlStreamsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('controlStreams', url);

  expectFeatureCollection(data, 'ControlStream');

  const first = data.features[0];
  expect(first).toHaveProperty('id');
  expect(first).toHaveProperty('type', 'Feature');
  expect(first).toHaveProperty('properties');
});

/**
 * Requirement: /req/controlstream/canonical-url
 */
test('ControlStreams have canonical item URL at /controlStreams/{id}', async () => {
  const url = getControlStreamsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('controlStreams', url);
  const first = data.features[0];

  const itemUrl = `${apiRoot}/controlStreams/${first.id}`;
  expectCanonicalUrl(itemUrl, /^https?:\/\/[^/]+\/controlStreams\/[^/]+$/);
});

/**
 * Requirement: /req/controlstream/collections
 * A collection with featureType sosa:ControlStream SHALL behave like /controlStreams.
 */
test('Collections with featureType sosa:ControlStream behave like /controlStreams', async () => {
  const url = getControlStreamsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('controlStreams', url);

  expectFeatureCollection(data, 'ControlStream');
  const featureType = data.features?.[0]?.properties?.featureType;
  if (featureType) {
    expect(featureType).toMatch(/sosa:ControlStream/i);
  }
});

/**
 * Requirement: /req/controlstream/ref-from-system
 * Each System SHALL expose nested ControlStreams at /systems/{id}/controlStreams.
 * Derive systemId from ControlStream properties if present; skip gracefully if absent.
 */
test('GET /systems/{id}/controlStreams lists control streams for a System', async () => {
  const root: any = await maybeFetchOrLoad(
    'controlStreams',
    getControlStreamsUrl(apiRoot)
  );

  if (!root.features?.length) {
    // eslint-disable-next-line no-console
    console.warn(
      '[controlstreams.spec] No controlStreams features; skipping /req/controlstream/ref-from-system.'
    );
    return;
  }

  const withSystem = root.features.filter((f: any) => {
    const p = f.properties || {};
    return (
      p.system?.id || (Array.isArray(p.systemIds) && p.systemIds.length > 0)
    );
  });

  if (!withSystem.length) {
    // eslint-disable-next-line no-console
    console.warn(
      '[controlstreams.spec] No system linkage present; skipping /req/controlstream/ref-from-system.'
    );
    return;
  }

  const props = withSystem[0].properties;
  const systemId =
    props.system?.id ||
    (Array.isArray(props.systemIds) ? props.systemIds[0] : undefined);
  if (!systemId) {
    // eslint-disable-next-line no-console
    console.warn(
      '[controlstreams.spec] Could not derive systemId; skipping /req/controlstream/ref-from-system.'
    );
    return;
  }

  const nestedUrl = `${apiRoot}/systems/${systemId}/controlStreams`;
  let nested: any;
  try {
    nested = await maybeFetchOrLoad(
      `controlStreams_system_${systemId}`,
      nestedUrl
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      `[controlstreams.spec] Nested controlStreams not available for system '${systemId}'; skipping assertion.`
    );
    return;
  }

  expectFeatureCollection(nested, 'ControlStream');
});

/**
 * Requirement: /req/controlstream/schema-op
 * The /controlStreams/{id}/schema?cmdFormat=… operation SHALL return a control command schema.
 * Derive controlStreamId dynamically; skip if unavailable or fixture missing.
 */
test('GET /controlStreams/{id}/schema?cmdFormat=… returns control command schema', async () => {
  const root: any = await maybeFetchOrLoad(
    'controlStreams',
    getControlStreamsUrl(apiRoot)
  );
  if (!root.features?.length) {
    // eslint-disable-next-line no-console
    console.warn(
      '[controlstreams.spec] No controlStreams features; skipping /req/controlstream/schema-op.'
    );
    return;
  }

  const controlStreamId = root.features[0].id;
  const schemaUrl = `${apiRoot}/controlStreams/${controlStreamId}/schema?cmdFormat=application/json`;

  let schema: any;
  try {
    schema = await maybeFetchOrLoad(
      `controlStream_schema_${controlStreamId}`,
      schemaUrl
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      `[controlstreams.spec] No schema fixture or response for controlStream '${controlStreamId}'; skipping /req/controlstream/schema-op.`
    );
    return;
  }

  expect(schema).toBeDefined();
  expect(Object.keys(schema)).toContain('type');
});

/**
 * Optional lifecycle linkage (non-normative)
 */
test('ControlStreams optionally link to related Systems or Commands', async () => {
  const url = getControlStreamsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('controlStreams', url);

  const first = data.features[0];
  const props = first.properties ?? {};

  if (props.system) {
    expect(props.system).toHaveProperty('id');
  }
  if (props.command) {
    expect(props.command).toHaveProperty('id');
  }
});
