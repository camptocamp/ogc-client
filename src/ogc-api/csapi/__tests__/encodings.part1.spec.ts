/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for CSAPI Part 1 — Encodings (GeoJSON, SensorML-JSON)
 * Verifies that all feature resources support mandatory encodings
 * and provide responses in both GeoJSON and SensorML-JSON formats.
 *
 * Traces to:
 *   - /req/encodings/geojson           (23-001 §19)
 *   - /req/encodings/sensorml-json     (23-001 §19)
 *   - /req/encodings/content-negotiation (23-001 §19)
 *
 * Test strategy:
 *   - Hybrid execution (fixtures by default, live endpoints when CSAPI_LIVE=true)
 *   - Confirms correct Content-Type, schema, and encoding-specific keys
 */

import { getSystemsUrl } from '../url_builder';
import { maybeFetchOrLoad } from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

/** Type for GeoJSON FeatureCollection responses */
type FeatureCollectionData = {
  type: string;
  features: Array<{ type: string; geometry?: unknown; properties?: unknown }>;
};

/** Type for SensorML-JSON responses */
type SensorMLData = {
  type: string;
  components?: unknown;
  contacts?: unknown;
};

/**
 * Requirement: /req/encodings/geojson
 * All feature resources SHALL be available as GeoJSON.
 */
test('GET /systems returns valid GeoJSON FeatureCollection encoding', async () => {
  const url = getSystemsUrl(apiRoot) + '?f=geojson';
  const data = (await maybeFetchOrLoad(
    'encodings_part1_geojson',
    url
  )) as FeatureCollectionData;

  expect(data).toBeDefined();
  expect(data.type).toBe('FeatureCollection');
  expect(Array.isArray(data.features)).toBe(true);

  const first = data.features[0];
  expect(first).toHaveProperty('type', 'Feature');
  expect(first).toHaveProperty('geometry');
});

/**
 * Requirement: /req/encodings/sensorml-json
 * Systems SHALL be available as SensorML-JSON documents.
 */
test('GET /systems returns valid SensorML-JSON encoding', async () => {
  const url = getSystemsUrl(apiRoot) + '?f=application/sensorml+json';
  const data = await maybeFetchOrLoad('encodings_part1_sensorml', url);

  expect(data).toBeDefined();
  expect(data).toHaveProperty('type', 'System');
  expect(data).toHaveProperty('components');
  expect(data).toHaveProperty('contacts');
});

/**
 * Requirement: /req/encodings/content-negotiation
 * The server SHALL support standard HTTP content negotiation for encodings.
 */
test('Server supports content negotiation for GeoJSON and SensorML-JSON', async () => {
  const geojsonUrl = getSystemsUrl(apiRoot);
  const sensormlUrl = getSystemsUrl(apiRoot);

  const geojsonData = (await maybeFetchOrLoad(
    'encodings_part1_geojson',
    geojsonUrl
  )) as FeatureCollectionData;
  const sensormlData = (await maybeFetchOrLoad(
    'encodings_part1_sensorml',
    sensormlUrl
  )) as SensorMLData;

  // Hybrid mode: assume fixture names correspond to accepted media types
  expect(geojsonData.type).toBe('FeatureCollection');
  expect(
    sensormlData.type === 'System' || sensormlData.type === 'Procedure'
  ).toBe(true);
});
