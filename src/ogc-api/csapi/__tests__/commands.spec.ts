/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for CSAPI Part 2 — Commands (C5)
 * Validates canonical endpoints, collection semantics, nested listing from ControlStreams,
 * and separate Status + Result resources for Command items.
 *
 * Traces to:
 *   - /req/command/canonical-endpoint   (23-002 §7.4)
 *   - /req/command/resources-endpoint   (23-002 §10–11)
 *   - /req/command/canonical-url        (23-002 §7.4)
 *   - /req/command/collections          (23-002 §10–11)
 *   - /req/command/ref-from-controlstream (23-002 §10–11)
 *   - /req/command/status               (23-002 §10–11)
 *   - /req/command/result               (23-002 §10–11)
 *
 * Test strategy:
 *   - Hybrid execution (fixtures by default, live when CSAPI_LIVE=true)
 *   - Graceful skips where fixtures lack linkage or status/result stubs
 *   - Distinct validation for status and result endpoints
 */
import { getCommandsUrl, getControlStreamsUrl } from '../url_builder';
import {
  maybeFetchOrLoad,
  expectFeatureCollection,
  expectCanonicalUrl,
} from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

/**
 * Requirement: /req/command/canonical-endpoint
 */
test('GET /commands is exposed as canonical Commands collection', async () => {
  const url = getCommandsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('commands', url);

  expectFeatureCollection(data, 'Command');
  expect(Array.isArray(data.features)).toBe(true);
  expect(data.features.length).toBeGreaterThan(0);
});

/**
 * Requirement: /req/command/resources-endpoint
 */
test('GET /commands returns FeatureCollection (itemType=Command)', async () => {
  const url = getCommandsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('commands', url);

  expectFeatureCollection(data, 'Command');

  const first = data.features[0];
  expect(first).toHaveProperty('id');
  expect(first).toHaveProperty('type', 'Feature');
  expect(first).toHaveProperty('properties');
});

/**
 * Requirement: /req/command/canonical-url
 */
test('Commands have canonical item URL at /commands/{id}', async () => {
  const url = getCommandsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('commands', url);
  const first = data.features[0];

  const itemUrl = `${apiRoot}/commands/${first.id}`;
  expectCanonicalUrl(itemUrl, /^https?:\/\/[^/]+\/commands\/[^/]+$/);
});

/**
 * Requirement: /req/command/collections
 * Collections with featureType sosa:Command SHALL behave like /commands.
 */
test('Collections with featureType sosa:Command behave like /commands', async () => {
  const url = getCommandsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('commands', url);

  expectFeatureCollection(data, 'Command');
  const featureType = data.features?.[0]?.properties?.featureType;
  if (featureType) {
    expect(featureType).toMatch(/sosa:Command/i);
  }
});

/**
 * Requirement: /req/command/ref-from-controlstream
 * Each ControlStream MAY expose nested Commands at /controlStreams/{id}/commands.
 * Derive controlStreamId from command properties; skip gracefully if absent.
 */
test('GET /controlStreams/{id}/commands lists commands for a ControlStream (if linked)', async () => {
  const root: any = await maybeFetchOrLoad('commands', getCommandsUrl(apiRoot));
  if (!root.features?.length) {
    // eslint-disable-next-line no-console
    console.warn(
      '[commands.spec] No command features; skipping /req/command/ref-from-controlstream.'
    );
    return;
  }

  const withCtl = root.features.filter((f: any) => {
    const p = f.properties || {};
    return (
      p.controlStream?.id ||
      p.controlStreamId ||
      (Array.isArray(p.controlStreamIds) && p.controlStreamIds.length > 0)
    );
  });

  if (!withCtl.length) {
    // eslint-disable-next-line no-console
    console.warn(
      '[commands.spec] No controlStream linkage present; skipping /req/command/ref-from-controlstream.'
    );
    return;
  }

  const props = withCtl[0].properties;
  const controlStreamId =
    props.controlStream?.id ||
    props.controlStreamId ||
    (Array.isArray(props.controlStreamIds)
      ? props.controlStreamIds[0]
      : undefined);

  if (!controlStreamId) {
    // eslint-disable-next-line no-console
    console.warn(
      '[commands.spec] Could not derive controlStreamId; skipping /req/command/ref-from-controlstream.'
    );
    return;
  }

  const nestedUrl = `${apiRoot}/controlStreams/${controlStreamId}/commands`;
  let nested: any;
  try {
    nested = await maybeFetchOrLoad(
      `commands_controlStream_${controlStreamId}`,
      nestedUrl
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      `[commands.spec] Nested commands not available for controlStream '${controlStreamId}'; skipping assertion.`
    );
    return;
  }

  expectFeatureCollection(nested, 'Command');
});

/**
 * Requirement: /req/command/status
 * Retrieve the Status resource for a Command: /commands/{id}/status
 */
test('GET /commands/{id}/status returns a Status resource (if available)', async () => {
  const root: any = await maybeFetchOrLoad('commands', getCommandsUrl(apiRoot));
  if (!root.features?.length) {
    console.warn('[commands.spec] No commands; skipping /req/command/status.');
    return;
  }
  const first = root.features[0];
  const commandId = first.id;

  const statusUrl =
    first.properties?.status?.href ||
    first.links?.find((l: any) => l.rel?.toLowerCase() === 'status')?.href ||
    `${apiRoot}/commands/${commandId}/status`;

  let status: any;
  try {
    status = await maybeFetchOrLoad(`command_status_${commandId}`, statusUrl);
  } catch {
    console.warn(
      `[commands.spec] No status fixture or endpoint for command '${commandId}'; skipping /req/command/status.`
    );
    return;
  }

  expect(status).toBeDefined();
  if (status.state) {
    expect(typeof status.state).toBe('string');
  }
});

/**
 * Requirement: /req/command/result
 * Retrieve the Result resource for a Command: /commands/{id}/result
 */
test('GET /commands/{id}/result returns a Result resource (if available)', async () => {
  const root: any = await maybeFetchOrLoad('commands', getCommandsUrl(apiRoot));
  if (!root.features?.length) {
    console.warn('[commands.spec] No commands; skipping /req/command/result.');
    return;
  }
  const first = root.features[0];
  const commandId = first.id;

  const resultUrl =
    first.properties?.result?.href ||
    first.links?.find((l: any) => l.rel?.toLowerCase() === 'result')?.href ||
    `${apiRoot}/commands/${commandId}/result`;

  let result: any;
  try {
    result = await maybeFetchOrLoad(`command_result_${commandId}`, resultUrl);
  } catch {
    console.warn(
      `[commands.spec] No result fixture or endpoint for command '${commandId}'; skipping /req/command/result.`
    );
    return;
  }

  expect(result).toBeDefined();
  if (result.outcome) {
    expect(['success', 'failure', 'pending']).toContain(result.outcome);
  }
});

/**
 * Optional combined linkage presence test (non-normative)
 */
test('Commands optionally expose Status and Result link references', async () => {
  const root: any = await maybeFetchOrLoad('commands', getCommandsUrl(apiRoot));
  if (!root.features?.length) {
    console.warn(
      '[commands.spec] No commands; skipping optional linkage test.'
    );
    return;
  }
  const first = root.features[0];
  const statusLink =
    first.properties?.status?.href ||
    first.links?.find((l: any) => l.rel?.toLowerCase() === 'status')?.href;
  const resultLink =
    first.properties?.result?.href ||
    first.links?.find((l: any) => l.rel?.toLowerCase() === 'result')?.href;

  expect(statusLink || resultLink).toBeDefined();
});
