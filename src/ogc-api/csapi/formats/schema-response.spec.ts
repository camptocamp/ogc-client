import { parseDatastreamSchemaResponse } from './schema-response.js';
import { parseControlStreamSchemaResponse } from './schema-response.js';
import type { DatastreamSchemaResponse } from '../model.js';
import type { ControlStreamSchemaResponse } from '../model.js';
import type {
  DataRecord,
  SweQuantity,
  SweTime,
  SweText,
  JSONEncoding,
  TypedDataField,
  SweBoolean,
  SweCount,
  SweCategory,
} from './swecommon/types.js';

describe('parseDatastreamSchemaResponse', () => {
  // ========================================
  // Test 1: JSON format response
  // ========================================

  it('parses a JSON format response with resultSchema (DataRecord + Quantity)', () => {
    // Canonical fixture from OSH Smoke Test #7 (ST#3 L263-282)
    const raw = {
      obsFormat: 'application/om+json',
      resultSchema: {
        type: 'DataRecord',
        name: 'TemperatureOutput',
        label: 'Temperature',
        description: 'UnannedSystem temperature output data',
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

    const result: DatastreamSchemaResponse = parseDatastreamSchemaResponse(raw);

    // obsFormat extracted as string
    expect(result.obsFormat).toBe('application/om+json');

    // resultSchema is a parsed DataRecord (not raw JSON)
    expect(result.resultSchema).toBeDefined();
    const dr = result.resultSchema as DataRecord;
    expect(dr.type).toBe('DataRecord');
    expect(dr.label).toBe('Temperature');
    expect(dr.fields).toHaveLength(1);

    // Fields are TypedDataField: { name, component: parseSWEComponent(json) }
    const f0 = dr.fields[0] as TypedDataField;
    expect(f0.name).toBe('Temperature');
    const comp0 = f0.component as SweQuantity;
    expect(comp0.type).toBe('Quantity');
    expect(comp0.uom).toEqual({ href: 'http://qudt.org/vocab/unit/UNITLESS' });

    // SWE Common format fields are absent
    expect(result.recordSchema).toBeUndefined();
    expect(result.encoding).toBeUndefined();
  });

  // ========================================
  // Test 2: SWE Common format response
  // ========================================

  it('parses a SWE Common format response with recordSchema + encoding', () => {
    const raw = {
      obsFormat: 'application/swe+json',
      recordSchema: {
        type: 'DataRecord',
        name: 'WeatherRecord',
        fields: [
          {
            type: 'Quantity',
            name: 'temperature',
            label: 'Air Temperature',
            uom: { code: 'Cel' },
          },
        ],
      },
      encoding: {
        type: 'JSONEncoding',
        recordsAsArrays: true,
      },
    };

    const result = parseDatastreamSchemaResponse(raw);

    // obsFormat extracted
    expect(result.obsFormat).toBe('application/swe+json');

    // recordSchema parsed via parseSWEComponent
    expect(result.recordSchema).toBeDefined();
    const dr = result.recordSchema as DataRecord;
    expect(dr.type).toBe('DataRecord');
    expect(dr.fields).toHaveLength(1);
    const rf0 = dr.fields[0] as TypedDataField;
    expect(rf0.name).toBe('temperature');
    expect((rf0.component as SweQuantity).type).toBe('Quantity');

    // encoding parsed via parseEncoding
    expect(result.encoding).toBeDefined();
    const enc = result.encoding as JSONEncoding;
    expect(enc.type).toBe('JSONEncoding');
    expect(enc.recordsAsArrays).toBe(true);

    // JSON format field is absent
    expect(result.resultSchema).toBeUndefined();
  });

  // ========================================
  // Test 3: Missing schema fields
  // ========================================

  it('returns only obsFormat when schema fields are absent', () => {
    const raw = {
      obsFormat: 'application/om+json',
    };

    const result = parseDatastreamSchemaResponse(raw);

    expect(result.obsFormat).toBe('application/om+json');
    expect(result.resultSchema).toBeUndefined();
    expect(result.recordSchema).toBeUndefined();
    expect(result.encoding).toBeUndefined();
  });

  // ========================================
  // Test 4: Nested DataRecord (multiple field types)
  // ========================================

  it('parses a nested DataRecord with Time + Quantity + Text fields', () => {
    const raw = {
      obsFormat: 'application/om+json',
      resultSchema: {
        type: 'DataRecord',
        name: 'MultiSensorOutput',
        fields: [
          {
            type: 'Time',
            name: 'timestamp',
            label: 'Measurement Time',
            uom: {
              href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
            },
          },
          {
            type: 'Quantity',
            name: 'pressure',
            label: 'Atmospheric Pressure',
            uom: { code: 'hPa' },
          },
          {
            type: 'Text',
            name: 'status',
            label: 'Sensor Status',
          },
        ],
      },
    };

    const result = parseDatastreamSchemaResponse(raw);

    expect(result.obsFormat).toBe('application/om+json');
    expect(result.resultSchema).toBeDefined();

    const dr = result.resultSchema as DataRecord;
    expect(dr.type).toBe('DataRecord');
    expect(dr.fields).toHaveLength(3);

    // Verify each field name and parsed SWE component type
    const tf0 = dr.fields[0] as TypedDataField;
    expect(tf0.name).toBe('timestamp');
    const timeComp = tf0.component as SweTime;
    expect(timeComp.type).toBe('Time');
    expect(timeComp.uom).toEqual({
      href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
    });

    const tf1 = dr.fields[1] as TypedDataField;
    expect(tf1.name).toBe('pressure');
    const qtyComp = tf1.component as SweQuantity;
    expect(qtyComp.type).toBe('Quantity');
    expect(qtyComp.uom).toEqual({ code: 'hPa' });

    const tf2 = dr.fields[2] as TypedDataField;
    expect(tf2.name).toBe('status');
    const textComp = tf2.component as SweText;
    expect(textComp.type).toBe('Text');
  });

  // ========================================
  // Test 5: Non-object input
  // ========================================

  it('throws on non-object input', () => {
    expect(() => parseDatastreamSchemaResponse(null)).toThrow(
      'parseDatastreamSchemaResponse: input must be a non-null object'
    );
    expect(() => parseDatastreamSchemaResponse(undefined)).toThrow(
      'parseDatastreamSchemaResponse: input must be a non-null object'
    );
    expect(() => parseDatastreamSchemaResponse('string')).toThrow(
      'parseDatastreamSchemaResponse: input must be a non-null object'
    );
    expect(() => parseDatastreamSchemaResponse(42)).toThrow(
      'parseDatastreamSchemaResponse: input must be a non-null object'
    );
  });
});

// ================================================================
// parseControlStreamSchemaResponse — Task 7b
// ================================================================

describe('parseControlStreamSchemaResponse', () => {
  // ========================================
  // Test 1: JSON format response
  // ========================================

  it('parses a JSON format response with parametersSchema (DataRecord + Boolean + Count + Category)', () => {
    const raw = {
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
          {
            type: 'Category',
            name: 'mode',
            label: 'Flight Mode',
          },
        ],
      },
    };

    const result: ControlStreamSchemaResponse =
      parseControlStreamSchemaResponse(raw);

    // commandFormat extracted as string
    expect(result.commandFormat).toBe('application/json');

    // parametersSchema is a parsed DataRecord (not raw JSON)
    expect(result.parametersSchema).toBeDefined();
    const dr = result.parametersSchema as DataRecord;
    expect(dr.type).toBe('DataRecord');
    expect(dr.label).toBe('Drone Command Parameters');
    expect(dr.fields).toHaveLength(3);

    // Field 0: Boolean
    const f0 = dr.fields[0] as TypedDataField;
    expect(f0.name).toBe('arm');
    const bool = f0.component as SweBoolean;
    expect(bool.type).toBe('Boolean');

    // Field 1: Count
    const f1 = dr.fields[1] as TypedDataField;
    expect(f1.name).toBe('retryCount');
    const cnt = f1.component as SweCount;
    expect(cnt.type).toBe('Count');

    // Field 2: Category
    const f2 = dr.fields[2] as TypedDataField;
    expect(f2.name).toBe('mode');
    const cat = f2.component as SweCategory;
    expect(cat.type).toBe('Category');

    // encoding absent
    expect(result.encoding).toBeUndefined();
  });

  // ========================================
  // Test 1b: paramsSchema fallback (older OSH builds)
  // ========================================

  it('accepts paramsSchema as a fallback for parametersSchema (older OSH builds)', () => {
    const raw = {
      commandFormat: 'application/json',
      paramsSchema: {
        type: 'DataRecord',
        name: 'LegacyCommand',
        fields: [
          {
            type: 'Boolean',
            name: 'enable',
          },
        ],
      },
    };

    const result = parseControlStreamSchemaResponse(raw);

    expect(result.commandFormat).toBe('application/json');
    expect(result.parametersSchema).toBeDefined();
    const dr = result.parametersSchema as DataRecord;
    expect(dr.type).toBe('DataRecord');
    expect(dr.fields).toHaveLength(1);
    expect((dr.fields[0] as TypedDataField).name).toBe('enable');
  });

  // ========================================
  // Test 2: Missing parametersSchema
  // ========================================

  it('returns only commandFormat when parametersSchema is absent', () => {
    const raw = {
      commandFormat: 'application/json',
    };

    const result = parseControlStreamSchemaResponse(raw);

    expect(result.commandFormat).toBe('application/json');
    expect(result.parametersSchema).toBeUndefined();
    expect(result.encoding).toBeUndefined();
  });

  // ========================================
  // Test 3: Nested DataRecord (DataRecord within DataRecord)
  // ========================================

  it('parses nested DataRecord with Quantity + Boolean fields', () => {
    const raw = {
      commandFormat: 'application/json',
      parametersSchema: {
        type: 'DataRecord',
        name: 'NavCommand',
        fields: [
          {
            type: 'DataRecord',
            name: 'waypoint',
            fields: [
              {
                type: 'Quantity',
                name: 'lat',
                uom: { code: 'deg' },
              },
              {
                type: 'Quantity',
                name: 'lon',
                uom: { code: 'deg' },
              },
              {
                type: 'Quantity',
                name: 'alt',
                uom: { code: 'm' },
              },
            ],
          },
          {
            type: 'Boolean',
            name: 'immediate',
          },
        ],
      },
    };

    const result = parseControlStreamSchemaResponse(raw);

    const dr = result.parametersSchema as DataRecord;
    expect(dr.type).toBe('DataRecord');
    expect(dr.fields).toHaveLength(2);

    // Field 0: Nested DataRecord
    const wf = dr.fields[0] as TypedDataField;
    expect(wf.name).toBe('waypoint');
    const nested = wf.component as DataRecord;
    expect(nested.type).toBe('DataRecord');
    expect(nested.fields).toHaveLength(3);

    const nf0 = nested.fields[0] as TypedDataField;
    expect(nf0.name).toBe('lat');
    expect((nf0.component as SweQuantity).uom).toEqual({ code: 'deg' });

    const nf2 = nested.fields[2] as TypedDataField;
    expect(nf2.name).toBe('alt');
    expect((nf2.component as SweQuantity).uom).toEqual({ code: 'm' });

    // Field 1: Boolean
    const bf = dr.fields[1] as TypedDataField;
    expect(bf.name).toBe('immediate');
    expect((bf.component as SweBoolean).type).toBe('Boolean');
  });

  // ========================================
  // Test 4: Non-object input
  // ========================================

  it('throws on non-object input', () => {
    expect(() => parseControlStreamSchemaResponse(null)).toThrow(
      'parseControlStreamSchemaResponse: input must be a non-null object'
    );
    expect(() => parseControlStreamSchemaResponse(undefined)).toThrow(
      'parseControlStreamSchemaResponse: input must be a non-null object'
    );
    expect(() => parseControlStreamSchemaResponse('string')).toThrow(
      'parseControlStreamSchemaResponse: input must be a non-null object'
    );
    expect(() => parseControlStreamSchemaResponse(42)).toThrow(
      'parseControlStreamSchemaResponse: input must be a non-null object'
    );
  });
});
