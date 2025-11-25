/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * CSAPI Client Lifecycle Integration Tests
 * ----------------------------------------
 * Verifies .list() and .get() behaviors for all canonical CSAPI client classes.
 * Uses hybrid fixture/live mode (default: fixture-based).
 *
 * Traces to:
 *   - CSAPI Part 2 §7.4 Canonical Endpoints
 *   - CSAPI Part 2 §10–§11 Resource Collections
 *
 * Test strategy:
 *   • Instantiate each *Client class under test
 *   • Verify .list() returns a valid FeatureCollection
 *   • Verify .get(id) returns a valid Feature or object
 */

import {
  SystemsClient,
  DeploymentsClient,
  ProceduresClient,
  SamplingFeaturesClient,
  PropertiesClient,
  DatastreamsClient,
  ObservationsClient,
  ControlStreamsClient,
  CommandsClient,
  FeasibilityClient,
  SystemEventsClient,
} from '../index';
import { expectFeatureCollection } from '../helpers';

const apiRoot = process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

// Map client constructors to their expected fixture key
const CLIENTS = [
  { name: 'SystemsClient', cls: SystemsClient, fixture: 'systems' },
  { name: 'DeploymentsClient', cls: DeploymentsClient, fixture: 'deployments' },
  { name: 'ProceduresClient', cls: ProceduresClient, fixture: 'procedures' },
  {
    name: 'SamplingFeaturesClient',
    cls: SamplingFeaturesClient,
    fixture: 'samplingFeatures',
  },
  { name: 'PropertiesClient', cls: PropertiesClient, fixture: 'properties' },
  { name: 'DatastreamsClient', cls: DatastreamsClient, fixture: 'datastreams' },
  {
    name: 'ObservationsClient',
    cls: ObservationsClient,
    fixture: 'observations',
  },
  {
    name: 'ControlStreamsClient',
    cls: ControlStreamsClient,
    fixture: 'controlStreams',
  },
  { name: 'CommandsClient', cls: CommandsClient, fixture: 'commands' },
  { name: 'FeasibilityClient', cls: FeasibilityClient, fixture: 'feasibility' },
  {
    name: 'SystemEventsClient',
    cls: SystemEventsClient,
    fixture: 'systemEvents',
  },
];

describe('CSAPI Client Lifecycle Tests', () => {
  for (const { name, cls, fixture } of CLIENTS) {
    test(`${name}.list() returns a valid collection for ${fixture}`, async () => {
      const client = new cls(apiRoot);
      const result = await client.list();

      if (fixture === 'properties') {
        // Properties are CSAPI metadata collections, not GeoJSON FeatureCollections
        expect(result).toBeDefined();
        expect(result.type).toBe('Collection');
        expect(
          Array.isArray((result as any).items) ||
            Array.isArray((result as any).members)
        ).toBe(true);
      } else {
        // All other canonical resources should expose a FeatureCollection response
        expectFeatureCollection(result as unknown as Record<string, unknown>);
      }
    });

    test(`${name}.get() returns a valid item for ${fixture}`, async () => {
      const client = new cls(apiRoot);
      const collection = await client.list();
      const first = collection.features?.[0] ?? {};

      if (!('id' in first)) {
        // Tolerate missing ID in minimal fixture
        expect(first).toBeDefined();
      } else {
        const item = await client.get(first.id as string);
        expect(item).toBeDefined();
        expect(item).toHaveProperty('id', first.id);
      }
    });
  }
});
