/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for CSAPI Part 2 — Encodings (Dynamic Data)
 * Validates that dynamic data resources (Datastreams, Observations)
 * support encodings based on SWE Common 3.0, as required by Part 2 Table 1.
 *
 * Traces to CSAPI Test Design Matrix v2.4:
 *   - Location: docs/csapi/_tests_/CSAPI_Test_Design_Matrix_v2.4.md
 *   - Row: "Part 2 encodings" (Section D - Encodings)
 *   - Requirements:
 *     • /req/encodings/swe-common        (23-002 Table 1)
 *     • /req/encodings/observations-json (23-002 § 7.4)
 *     • /req/encodings/content-negotiation (23-002 § 7.4)
 *
 * Test strategy:
 *   - Hybrid execution (fixtures by default, live endpoints when CSAPI_LIVE=true)
 *   - Validates SWE Common encoding structures (DataRecord, DataArray, uom, values)
 *   - Validates OM-JSON Observation fields (phenomenonTime, resultTime, result, observedProperty)
 *   - Confirms content negotiation for different encoding formats
 *   - All encoding patterns are tested via comprehensive fixture coverage
 *
 * Coverage:
 *   ✓ SWE Common 3.0 JSON encoding with DataRecord and DataArray structures
 *   ✓ OM-JSON Observation encoding with required temporal and result fields
 *   ✓ Content negotiation between SWE-JSON and OM-JSON formats
 *   ✓ Unit of measure (uom) encoding
 *   ✓ Observation result structures for both single values and arrays
 */

import { getDatastreamsUrl, getObservationsUrl } from '../url_builder';
import { maybeFetchOrLoad } from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

/**
 * Requirement: /req/encodings/swe-common
 * Datastreams SHALL advertise and provide data encodings conforming to SWE Common 3.0.
 *
 * This test validates:
 *   - Datastream resource structure includes encoding metadata
 *   - Encoding field references SWE Common 3.0
 *   - Result schema includes SWE Common DataRecord structure
 *   - Fields contain proper type definitions (Time, Quantity)
 *   - Units of measure (uom) are properly encoded
 */
test('GET /datastreams advertises SWE Common 3.0 encodings', async () => {
  const url = getDatastreamsUrl(apiRoot) + '?f=application/swe+json';
  const data: any = await maybeFetchOrLoad('encodings_part2_swecommon', url);

  // Validate basic Datastream structure
  expect(data).toBeDefined();
  expect(data).toHaveProperty('type', 'Datastream');
  expect(data).toHaveProperty('id');
  expect(data).toHaveProperty('encoding');
  expect(data.encoding).toMatch(/swe|SWE/i);

  // Validate SWE Common schema structure
  expect(data).toHaveProperty('resultSchema');
  expect(data.resultSchema).toHaveProperty('type');
  expect(data.resultSchema.type).toMatch(/^(DataRecord|DataArray)$/i);

  // Validate SWE Common fields structure
  expect(data.resultSchema).toHaveProperty('fields');
  expect(Array.isArray(data.resultSchema.fields)).toBe(true);
  expect(data.resultSchema.fields.length).toBeGreaterThan(0);

  // Validate field has required SWE Common properties
  const firstField = data.resultSchema.fields[0];
  expect(firstField).toHaveProperty('name');
  expect(firstField).toHaveProperty('type');
  expect(firstField).toHaveProperty('uom');
  expect(firstField.uom).toHaveProperty('code');
});

/**
 * Requirement: /req/encodings/observations-json
 * Observations SHALL be retrievable as JSON using SWE Common schemas.
 *
 * This test validates:
 *   - Observations returned as FeatureCollection
 *   - Features contain SWE Common result structures (DataRecord, DataArray)
 *   - Required temporal fields (phenomenonTime, resultTime) are present
 *   - Result includes proper SWE Common type definitions
 *   - DataArray encoding includes elementType, encoding, and values
 *   - Units of measure properly encoded in result structures
 */
test('GET /observations returns SWE Common JSON representation', async () => {
  const url = getObservationsUrl(apiRoot) + '?f=application/swe+json';
  const data: any = await maybeFetchOrLoad(
    'encodings_part2_observations_swe',
    url
  );

  // Validate collection structure
  expect(data).toBeDefined();
  expect(data.type).toBe('FeatureCollection');
  expect(data.itemType).toBe('Observation');
  expect(Array.isArray(data.features)).toBe(true);
  expect(data.features.length).toBeGreaterThan(0);

  // Validate first observation (DataRecord result)
  const first = data.features[0];
  expect(first).toHaveProperty('type', 'Feature');
  expect(first).toHaveProperty('id');
  expect(first).toHaveProperty('properties');

  // Validate required temporal fields
  expect(first.properties).toHaveProperty('phenomenonTime');
  expect(first.properties).toHaveProperty('resultTime');
  expect(first.properties).toHaveProperty('observedProperty');
  expect(first.properties).toHaveProperty('procedure');

  // Validate SWE Common result structure
  expect(first.properties).toHaveProperty('result');
  const result = first.properties.result;
  expect(result).toHaveProperty('type');

  // For DataRecord: validate fields with uom
  if (result.type === 'DataRecord') {
    expect(result).toHaveProperty('fields');
    expect(Array.isArray(result.fields)).toBe(true);
    const firstField = result.fields[0];
    expect(firstField).toHaveProperty('uom');
    expect(firstField.uom).toHaveProperty('code');
    expect(firstField).toHaveProperty('value');
  }

  // Validate second observation if it exists (DataArray result)
  if (data.features.length > 1) {
    const second = data.features[1];
    const arrayResult = second.properties.result;

    // For DataArray: validate encoding structure
    if (arrayResult.type === 'DataArray') {
      expect(arrayResult).toHaveProperty('elementCount');
      expect(arrayResult).toHaveProperty('elementType');
      expect(arrayResult).toHaveProperty('encoding');
      expect(arrayResult).toHaveProperty('values');

      // Validate encoding metadata
      expect(arrayResult.encoding).toHaveProperty('type');
      expect(arrayResult.encoding.type).toMatch(
        /^(TextEncoding|BinaryEncoding)$/i
      );

      // Validate elementType has uom
      expect(arrayResult.elementType).toHaveProperty('uom');
      expect(arrayResult.elementType.uom).toHaveProperty('code');
    }
  }
});

/**
 * Requirement: /req/encodings/content-negotiation
 * The server SHALL support standard HTTP content negotiation for dynamic data encodings.
 *
 * This test validates:
 *   - Both SWE-JSON and OM-JSON encodings are available
 *   - Observations can be retrieved in both formats
 *   - OM-JSON includes required Observation model fields
 *   - Content negotiation properly distinguishes between formats
 *   - OM-JSON specific fields (phenomenonTime, resultTime, observedProperty) are validated
 */
test('Server supports content negotiation for SWE JSON and OM JSON', async () => {
  const sweUrl = getObservationsUrl(apiRoot) + '?f=application/swe+json';
  const omUrl = getObservationsUrl(apiRoot) + '?f=application/om+json';

  const sweData: any = await maybeFetchOrLoad(
    'encodings_part2_observations_swe',
    sweUrl
  );
  const omData: any = await maybeFetchOrLoad(
    'encodings_part2_observations_om',
    omUrl
  );

  // Both formats return FeatureCollections
  expect(sweData.type).toBe('FeatureCollection');
  expect(omData.type).toBe('FeatureCollection');
  expect(sweData.itemType).toBe('Observation');
  expect(omData.itemType).toBe('Observation');

  // Validate OM-JSON specific structure
  const omFeature = omData.features[0];
  expect(omFeature).toHaveProperty('properties');

  // OM-JSON required fields per OGC 10-004r3 (O&M)
  expect(omFeature.properties).toHaveProperty('phenomenonTime');
  expect(omFeature.properties).toHaveProperty('resultTime');
  expect(omFeature.properties).toHaveProperty('observedProperty');
  expect(omFeature.properties).toHaveProperty('procedure');
  expect(omFeature.properties).toHaveProperty('featureOfInterest');
  expect(omFeature.properties).toHaveProperty('result');
  expect(omFeature.properties).toHaveProperty('encodingType', 'OM-JSON');

  // Validate result structure includes uom
  expect(omFeature.properties.result).toHaveProperty('value');
  expect(omFeature.properties.result).toHaveProperty('uom');

  // Validate observedProperty is an object with href
  expect(omFeature.properties.observedProperty).toHaveProperty('href');

  // SWE format should have result with SWE Common type
  const sweFeature = sweData.features[0];
  expect(sweFeature.properties.result).toHaveProperty('type');
  expect(sweFeature.properties.result.type).toMatch(
    /^(DataRecord|DataArray)$/i
  );
});
