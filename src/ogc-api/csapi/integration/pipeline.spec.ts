/**
 * End-to-end pipeline tests — Phase 5 parser composition.
 *
 * Verifies the full path from raw JSON fixture → envelope extraction
 * via `parseCollectionResponse()` → item-level parsing via resource
 * parsers → typed output. Also tests the schema single-object pipeline
 * (raw JSON → schema response parser → typed output with parsed
 * SWE Common component tree).
 *
 * All tests are pure transformation tests — no HTTP mocking needed.
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/91
 * @see https://docs.ogc.org/is/23-001/23-001.html
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */

import { parseCollectionResponse } from '../formats/response.js';
import { parseDatastream } from '../formats/part2.js';
import { parseProperty } from '../formats/property.js';
import {
  parseDatastreamSchemaResponse,
  parseControlStreamSchemaResponse,
} from '../formats/schema-response.js';
import type { Datastream, Property } from '../model.js';
import type {
  DatastreamSchemaResponse,
  ControlStreamSchemaResponse,
} from '../model.js';
import type {
  DataRecord,
  SweQuantity,
  TypedDataField,
} from '../formats/swecommon/types.js';

// ========================================
// Datastream Collection Pipeline
// ========================================

describe('end-to-end: Datastream collection pipeline', () => {
  // Raw JSON collection fixture wrapping a Datastream item in an `items` envelope
  const DATASTREAMS_COLLECTION = {
    items: [
      {
        id: '0ocb',
        name: 'FCU Simulated Weather Station - Weather',
        description: 'Weather observations from simulated station',
        'system@id': '0o0o',
        'system@link': {
          href: 'http://45.55.99.236:8080/sensorhub/api/systems/0o0o?f=json',
          uid: 'urn:osh:sensor:simweather:001',
          type: 'application/geo+json',
        },
        outputName: 'weather',
        validTime: ['2026-01-26T18:32:01.56Z', 'now'],
        observedProperties: [
          {
            definition:
              'http://mmisw.org/ont/cf/parameter/air_temperature',
            label: 'Air Temperature',
          },
        ],
        formats: [
          'application/om+json',
          'application/swe+json',
          'application/swe+csv',
        ],
        phenomenonTime: [
          '2026-01-26T18:32:01.56Z',
          '2026-02-19T14:22:03.12Z',
        ],
        resultTime: [
          '2026-01-26T18:32:01.56Z',
          '2026-02-19T14:22:03.12Z',
        ],
        resultType: 'record',
        live: true,
        links: [
          { rel: 'self', href: '/datastreams/0ocb', type: 'application/json' },
        ],
      },
    ],
    links: [
      { rel: 'self', href: '/datastreams', type: 'application/json' },
    ],
    numberMatched: 1,
    numberReturned: 1,
  };

  it('parses raw JSON collection through envelope + item parser', () => {
    // Step 1: Extract items via parseCollectionResponse
    const collection = parseCollectionResponse(DATASTREAMS_COLLECTION);
    expect(collection.items).toHaveLength(1);
    expect(collection.numberMatched).toBe(1);
    expect(collection.numberReturned).toBe(1);
    expect(collection.links).toHaveLength(1);

    // Step 2: Map items through parseDatastream
    const datastreams: Datastream[] = collection.items.map(parseDatastream);
    expect(datastreams).toHaveLength(1);

    // Step 3: Verify typed output
    const ds = datastreams[0];
    expect(ds.id).toBe('0ocb');
    expect(ds.name).toBe('FCU Simulated Weather Station - Weather');
    expect(ds.description).toBe(
      'Weather observations from simulated station'
    );
    expect(ds.outputName).toBe('weather');
    expect(ds.live).toBe(true);
    expect(ds.resultType).toBe('record');
    expect(ds.formats).toEqual([
      'application/om+json',
      'application/swe+json',
      'application/swe+csv',
    ]);

    // validTime parsed: start is a Date, end is undefined ('now' sentinel)
    expect(ds.validTime).toBeDefined();
    expect(ds.validTime!.start).toEqual(
      new Date('2026-01-26T18:32:01.56Z')
    );
    expect(ds.validTime!.end).toBeUndefined();

    // phenomenonTime and resultTime parsed as TimeInterval
    expect(ds.phenomenonTime).not.toBeNull();
    expect(ds.phenomenonTime!.start).toEqual(
      new Date('2026-01-26T18:32:01.56Z')
    );
    expect(ds.phenomenonTime!.end).toEqual(
      new Date('2026-02-19T14:22:03.12Z')
    );

    // observedProperties normalized from object array to string array
    expect(ds.observedProperties).toEqual([
      'http://mmisw.org/ont/cf/parameter/air_temperature',
    ]);

    // Cross-reference fields stripped (not in Datastream interface)
    expect((ds as unknown as Record<string, unknown>)['system@id']).toBeUndefined();
    expect((ds as unknown as Record<string, unknown>)['system@link']).toBeUndefined();
  });

  it('handles empty collection gracefully', () => {
    const emptyCollection = {
      items: [],
      links: [],
      numberMatched: 0,
      numberReturned: 0,
    };

    const collection = parseCollectionResponse(emptyCollection);
    expect(collection.items).toHaveLength(0);

    const datastreams: Datastream[] = collection.items.map(parseDatastream);
    expect(datastreams).toHaveLength(0);
  });
});

// ========================================
// Property Collection Pipeline
// ========================================

describe('end-to-end: Property collection pipeline', () => {
  const PROPERTIES_COLLECTION = {
    type: 'FeatureCollection',
    features: [
      {
        id: 'air-temp',
        uniqueId: 'urn:x-ogc:def:property:noaa::AirTemperature',
        label: 'Air Temperature',
        description: 'Temperature of the ambient air',
        baseProperty:
          'http://qudt.org/vocab/quantitykind/Temperature',
        objectType:
          'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement',
        links: [
          { rel: 'self', href: '/properties/air-temp', type: 'application/json' },
        ],
      },
    ],
    links: [],
    numberMatched: 1,
    numberReturned: 1,
  };

  it('parses GeoJSON FeatureCollection through envelope + property parser', () => {
    // Step 1: Extract features via parseCollectionResponse (GeoJSON envelope)
    const collection = parseCollectionResponse(PROPERTIES_COLLECTION);
    expect(collection.items).toHaveLength(1);

    // Step 2: Map through parseProperty
    const properties: Property[] = collection.items.map(parseProperty);
    expect(properties).toHaveLength(1);

    // Step 3: Verify typed output
    const prop = properties[0];
    expect(prop.id).toBe('air-temp');
    expect(prop.uniqueId).toBe(
      'urn:x-ogc:def:property:noaa::AirTemperature'
    );
    expect(prop.label).toBe('Air Temperature');
    expect(prop.description).toBe('Temperature of the ambient air');
    expect(prop.baseProperty).toBe(
      'http://qudt.org/vocab/quantitykind/Temperature'
    );
    expect(prop.objectType).toBe(
      'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement'
    );
  });
});

// ========================================
// Datastream Schema Response Pipeline
// ========================================

describe('end-to-end: Schema response pipeline', () => {
  const SCHEMA_FIXTURE = {
    obsFormat: 'application/om+json',
    resultSchema: {
      type: 'DataRecord',
      name: 'TemperatureOutput',
      label: 'Temperature',
      description: 'Unmanned system temperature output data',
      fields: [
        {
          type: 'Quantity',
          name: 'Temperature',
          label: 'Temperature',
          description: 'Temperature in degrees celsius',
          uom: { href: 'http://qudt.org/vocab/unit/UNITLESS' },
        },
      ],
    },
  };

  it('parses raw JSON schema through schema response parser with SWE tree', () => {
    // Step 1: Call parseDatastreamSchemaResponse directly (not a collection)
    const schema: DatastreamSchemaResponse =
      parseDatastreamSchemaResponse(SCHEMA_FIXTURE);

    // Step 2: Verify envelope fields
    expect(schema.obsFormat).toBe('application/om+json');
    expect(schema.recordSchema).toBeUndefined();
    expect(schema.encoding).toBeUndefined();

    // Step 3: Verify resultSchema contains a parsed SWE Common tree
    expect(schema.resultSchema).toBeDefined();
    const dr = schema.resultSchema as DataRecord;
    expect(dr.type).toBe('DataRecord');
    expect(dr.label).toBe('Temperature');
    expect(dr.fields).toHaveLength(1);

    // Verify the field was parsed (not raw JSON passthrough)
    const field = dr.fields[0] as TypedDataField;
    expect(field.name).toBe('Temperature');
    const comp = field.component as SweQuantity;
    expect(comp.type).toBe('Quantity');
    expect(comp.uom).toEqual({
      href: 'http://qudt.org/vocab/unit/UNITLESS',
    });
  });
});

// ========================================
// ControlStream Schema Response Pipeline
// ========================================

describe('end-to-end: ControlStream schema response pipeline', () => {
  const CONTROL_SCHEMA_FIXTURE = {
    commandFormat: 'application/json',
    parametersSchema: {
      type: 'DataRecord',
      name: 'DroneCommand',
      label: 'Drone Command Parameters',
      fields: [
        {
          type: 'Boolean',
          name: 'arm',
          label: 'Arm Motors',
        },
        {
          type: 'Count',
          name: 'retryCount',
          label: 'Retry Count',
        },
      ],
    },
  };

  it('parses raw ControlStream schema through schema response parser', () => {
    const schema: ControlStreamSchemaResponse =
      parseControlStreamSchemaResponse(CONTROL_SCHEMA_FIXTURE);

    expect(schema.commandFormat).toBe('application/json');
    expect(schema.encoding).toBeUndefined();

    expect(schema.parametersSchema).toBeDefined();
    const dr = schema.parametersSchema as DataRecord;
    expect(dr.type).toBe('DataRecord');
    expect(dr.label).toBe('Drone Command Parameters');
    expect(dr.fields).toHaveLength(2);

    const f0 = dr.fields[0] as TypedDataField;
    expect(f0.name).toBe('arm');
    expect(f0.component.type).toBe('Boolean');

    const f1 = dr.fields[1] as TypedDataField;
    expect(f1.name).toBe('retryCount');
    expect(f1.component.type).toBe('Count');
  });
});
