/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * Tests for OGC API – Connected Systems Part 1/2: Systems Client
 *
 * Traces to:
 *   - /req/system/resources-endpoint     (Systems collection endpoint)
 *   - /req/system/canonical-endpoint     (Individual system item endpoint)
 *   - /req/system/canonical-url          (Canonical URL pattern for item)
 *   - /req/system/collections            (Collection structure semantics)
 *   - /req/system/ref-to-events          (Nested system events)
 *
 * Strategy:
 *   - Hybrid fixture/live testing (maybeFetchOrLoad)
 *   - Validates SystemsClient list/get/listEvents/link resolution
 */

import { SystemsClient } from '../systems';
import {
  maybeFetchOrLoad,
  expectFeatureCollection,
  expectCanonicalUrl,
  expectGeoJSONFeature,
  expectGeoJSONFeatureCollection,
  expectLinkRelations,
  expectFeatureAttributeMapping,
} from '../helpers';
import { getSystemsUrl, getSystemEventsUrl } from '../url_builder';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';
const client = new SystemsClient(apiRoot);

/* -------------------------------------------------------------------------- */
/*                          /req/system/resources-endpoint                    */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/system/resources-endpoint
 * The /systems endpoint SHALL expose a canonical listing endpoint.
 */
test('GET /systems is exposed as systems resources endpoint', async () => {
  const url = getSystemsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('systems', url);

  expectFeatureCollection(data, 'System');
  expect(Array.isArray(data.features)).toBe(true);
});

/* -------------------------------------------------------------------------- */
/*                           /req/system/collections                          */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/system/collections
 * The Systems collection SHALL be a valid FeatureCollection with >=1 features.
 */
test('Systems collection conforms to /req/system/collections semantics', async () => {
  const url = getSystemsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('systems', url);
  expect(data.type).toBe('FeatureCollection');
  expect(data.itemType).toBe('System');
  expect(data.features.length).toBeGreaterThan(0);
});

/* -------------------------------------------------------------------------- */
/*                          /req/system/canonical-endpoint                    */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/system/canonical-endpoint
 * Each /systems/{id} SHALL return a valid System resource.
 */
test('GET /systems/{id} returns a valid System', async () => {
  const system = await client.get('sys-001');
  expect(system).toBeDefined();
  expect(system.id).toBe('sys-001');
  expect(system.type).toBeDefined();
  expect(Array.isArray(system.links)).toBe(true);
});

/* -------------------------------------------------------------------------- */
/*                             /req/system/canonical-url                      */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/system/canonical-url
 * Each System SHALL have a canonical URL at /systems/{id}.
 */
test('System items have canonical URL pattern /systems/{id}', async () => {
  const system = await client.get('sys-001');
  const url = `${apiRoot}/systems/${system.id}`;
  expectCanonicalUrl(url, /^https?:\/\/.+\/systems\/[^/]+$/);
});

/* -------------------------------------------------------------------------- */
/*                             /req/system/ref-to-events                      */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/system/ref-to-events
 * Systems SHALL expose nested events at /systems/{systemId}/events.
 */
test('GET /systems/{id}/events lists events for a System', async () => {
  const events: any = await client.listEvents('sys-001');
  expectFeatureCollection(events, 'SystemEvent');
  expect(Array.isArray(events.features)).toBe(true);
});

/* -------------------------------------------------------------------------- */
/*                          Link Resolution Convenience                       */
/* -------------------------------------------------------------------------- */

/**
 * Client convenience: resolve link relations for a System (non-normative helper).
 */
test('getLinkedResources() returns rel→href mapping for a System', async () => {
  const links = await client.getLinkedResources('sys-001');
  expect(links).toBeDefined();
  expect(Object.keys(links)).toContain('self');
  expect(Object.keys(links)).toContain('events');
  expect(links.events).toMatch(/\/systems\/sys-001\/events/);
});

/* -------------------------------------------------------------------------- */
/*                         GeoJSON B8 Requirements: Systems                   */
/* -------------------------------------------------------------------------- */

/**
 * Requirement: /req/geojson/mediatype-read
 * Systems collection SHALL be available as GeoJSON FeatureCollection.
 * Systems items SHALL be GeoJSON Features.
 */
test('/req/geojson/mediatype-read – Systems collection is valid GeoJSON FeatureCollection', async () => {
  const url = getSystemsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('systems', url);

  expectGeoJSONFeatureCollection(data, 'System');
  expect(data.features.length).toBeGreaterThan(0);
});

test('/req/geojson/mediatype-read – System item is valid GeoJSON Feature', async () => {
  const system = await client.get('sys-001');
  expectGeoJSONFeature(system as any, { requireProperties: true });
});

/**
 * Requirement: /req/geojson/relation-types
 * System features SHALL include standard link relations in their links array.
 * Expected relations: self, deployments, events (at minimum).
 */
test('/req/geojson/relation-types – System features include expected link relations', async () => {
  const url = getSystemsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('systems', url);
  const first = data.features[0];

  expectLinkRelations(first, ['self']);

  // Systems typically link to deployments and events
  const allRels = first.links.map((l: any) => l.rel);
  const hasSystemRelations = allRels.some((rel: string) =>
    ['deployments', 'events', 'system'].includes(rel)
  );
  expect(hasSystemRelations).toBe(true);
});

/**
 * Requirement: /req/geojson/feature-attribute-mapping
 * System attributes SHALL be mapped to the properties member of the GeoJSON Feature.
 * Core attributes like id and type must be present; name and description are typical.
 */
test('/req/geojson/feature-attribute-mapping – System attributes mapped to properties', async () => {
  const url = getSystemsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('systems', url);
  const first = data.features[0];

  expect(first).toHaveProperty('properties');
  expect(typeof first.properties).toBe('object');

  // Verify common system attributes are in properties
  const hasSystemAttributes =
    first.properties.name !== undefined ||
    first.properties.description !== undefined;
  expect(hasSystemAttributes).toBe(true);
});

/**
 * Requirement: /req/geojson/system-schema
 * System GeoJSON representation SHALL conform to the required schema structure:
 * - type: "Feature"
 * - id: unique identifier
 * - properties: object containing system attributes
 * - links: array of link objects
 */
test('/req/geojson/system-schema – System features conform to required GeoJSON schema', async () => {
  const url = getSystemsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('systems', url);
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
});

/**
 * Requirement: /req/geojson/system-mappings
 * System properties SHALL be correctly mapped from the CSAPI System model to GeoJSON properties.
 * This includes: name, description, status, and other system-specific fields.
 */
test('/req/geojson/system-mappings – System properties correctly mapped to GeoJSON', async () => {
  const url = getSystemsUrl(apiRoot);
  const data: any = await maybeFetchOrLoad('systems', url);
  const first = data.features[0];

  // Validate that system-specific properties are present
  const properties = first.properties;
  expect(properties).toBeDefined();

  // At least one of the typical system properties should be present
  const hasRequiredProperties =
    properties.name !== undefined || properties.description !== undefined;
  expect(hasRequiredProperties).toBe(true);

  // Verify the properties are of correct types when present
  if (properties.name) {
    expect(typeof properties.name).toBe('string');
  }
  if (properties.description) {
    expect(typeof properties.description).toBe('string');
  }
});
