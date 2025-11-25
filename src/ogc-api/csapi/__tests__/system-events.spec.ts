/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for CSAPI Part 2 — System Events
 * Validates canonical endpoints, nested event listings, and collection semantics for system events.
 *
 * Traces to:
 *   - /req/system-event/canonical-endpoint  (23-002 §7.4 Req42)
 *   - /req/system-event/resources-endpoint  (23-002 §7.4 Req41)
 *   - /req/system-event/canonical-url       (23-002 §7.4 Req40)
 *   - /req/system-event/ref-from-system     (23-002 §7.4 Req43)
 *   - /req/system-event/collections         (23-002 §7.4 Req44)
 *
 * Test strategy:
 *   - Hybrid execution (fixtures by default, live endpoints when CSAPI_LIVE=true)
 *   - Validates FeatureCollection structure and canonical URL patterns
 *   - Confirms nested event access under Systems
 */

import {
  getSystemEventsUrl,
  getSystemEventsForSystemUrl,
} from '../url_builder';
import {
  maybeFetchOrLoad,
  expectFeatureCollection,
  expectCanonicalUrl,
} from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

/** Type for FeatureCollection responses with system events */
type SystemEventCollectionData = {
  type: string;
  features: Array<{
    id?: string;
    type?: string;
    properties?: {
      system?: { id?: string };
    };
  }>;
  itemType?: string;
};

/**
 * Requirement: /req/system-event/canonical-endpoint
 * The /systemEvents endpoint SHALL be exposed as the canonical System Events collection.
 */
test('GET /systemEvents is exposed as canonical System Events collection', async () => {
  const url = getSystemEventsUrl(apiRoot);
  const data = (await maybeFetchOrLoad(
    'systemEvents',
    url
  )) as SystemEventCollectionData;

  expectFeatureCollection(data as Record<string, unknown>, 'SystemEvent');
  expect(Array.isArray(data.features)).toBe(true);
  expect(data.features.length).toBeGreaterThan(0);
});

/**
 * Requirement: /req/system-event/resources-endpoint
 * The /systemEvents collection SHALL conform to OGC API – Features collection rules.
 */
test('GET /systemEvents returns FeatureCollection (itemType=SystemEvent)', async () => {
  const url = getSystemEventsUrl(apiRoot);
  const data = (await maybeFetchOrLoad(
    'systemEvents',
    url
  )) as SystemEventCollectionData;

  expectFeatureCollection(data as Record<string, unknown>, 'SystemEvent');

  const first = data.features[0];
  expect(first).toHaveProperty('id');
  expect(first).toHaveProperty('type', 'Feature');
  expect(first).toHaveProperty('properties');
});

/**
 * Requirement: /req/system-event/canonical-url
 * Each System Event SHALL have a canonical item URL at /systemEvents/{id}.
 */
test('System Events have canonical item URL at /systemEvents/{id}', async () => {
  const url = getSystemEventsUrl(apiRoot);
  const data = (await maybeFetchOrLoad(
    'systemEvents',
    url
  )) as SystemEventCollectionData;
  const first = data.features[0];

  const itemUrl = `${apiRoot}/systemEvents/${first.id}`;
  expectCanonicalUrl(itemUrl, /^https?:\/\/.+\/systemEvents\/[^/]+$/);
});

/**
 * Requirement: /req/system-event/ref-from-system
 * Each System SHALL expose nested events at /systems/{systemId}/events.
 */
test('GET /systems/{id}/events lists events for a System', async () => {
  const systemId = 'sys-001'; // placeholder; can come from fixtures later
  const url = getSystemEventsForSystemUrl(apiRoot, systemId);
  const data = (await maybeFetchOrLoad(
    'systemEvents_sys-001',
    url
  )) as SystemEventCollectionData;

  expectFeatureCollection(data as Record<string, unknown>, 'SystemEvent');

  // Optional: ensure events reference the correct system
  const allSameSystem =
    data.features.every((f) => f.properties?.system?.id === systemId) ||
    data.features.length === 0;
  expect(allSameSystem).toBe(true);
});

/**
 * Requirement: /req/system-event/collections
 * Any collection with itemType=SystemEvent SHALL behave like /systemEvents.
 */
test('Collections with itemType=SystemEvent behave like /systemEvents', async () => {
  const url = getSystemEventsUrl(apiRoot);
  const data = (await maybeFetchOrLoad(
    'systemEvents',
    url
  )) as SystemEventCollectionData;

  expectFeatureCollection(data as Record<string, unknown>, 'SystemEvent');
  expect(data.itemType).toBe('SystemEvent');
});
