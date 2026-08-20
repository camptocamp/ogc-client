import { parseDataRecord } from './data-record.js';
import { SweCommonParseError } from './components.js';

// ========================================
// Flat Record Tests
// ========================================

describe('parseDataRecord — flat records', () => {
  it('parses a record with simple scalar fields', () => {
    const result = parseDataRecord({
      type: 'DataRecord',
      label: 'Weather',
      fields: [
        {
          name: 'temperature',
          type: 'Quantity',
          uom: { code: 'Cel' },
          value: 23.5,
        },
        { name: 'status', type: 'Text', value: 'OK' },
        { name: 'active', type: 'Boolean', value: true },
      ],
    });
    expect(result.type).toBe('DataRecord');
    expect(result.label).toBe('Weather');
    expect(result.fields).toHaveLength(3);
    expect(result.fields[0].name).toBe('temperature');
    expect(result.fields[1].name).toBe('status');
    expect(result.fields[2].name).toBe('active');
  });

  it('preserves field ordering', () => {
    const result = parseDataRecord({
      type: 'DataRecord',
      fields: [
        { name: 'z', type: 'Count', value: 3 },
        { name: 'a', type: 'Count', value: 1 },
        { name: 'm', type: 'Count', value: 2 },
      ],
    });
    expect(result.fields[0].name).toBe('z');
    expect(result.fields[1].name).toBe('a');
    expect(result.fields[2].name).toBe('m');
  });

  it('parses AbstractDataComponent properties', () => {
    const result = parseDataRecord({
      type: 'DataRecord',
      id: 'rec-1',
      label: 'Test',
      description: 'A test record',
      definition: 'http://example.com/def',
      updatable: true,
      optional: false,
      fields: [{ name: 'x', type: 'Count', value: 1 }],
    });
    expect(result.id).toBe('rec-1');
    expect(result.label).toBe('Test');
    expect(result.description).toBe('A test record');
    expect(result.definition).toBe('http://example.com/def');
    expect(result.updatable).toBe(true);
    expect(result.optional).toBe(false);
  });

  it('parses mixed simple component types', () => {
    const result = parseDataRecord({
      type: 'DataRecord',
      fields: [
        {
          name: 'pressure',
          type: 'Quantity',
          uom: { code: 'hPa' },
          value: 1013,
        },
        { name: 'category', type: 'Category', value: 'clear' },
        {
          name: 'timestamp',
          type: 'Time',
          uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' },
          value: '2024-01-01T00:00:00Z',
        },
        {
          name: 'range',
          type: 'QuantityRange',
          uom: { code: 'Cel' },
          value: [-10, 40],
        },
      ],
    });
    expect(result.fields).toHaveLength(4);
    expect(result.fields[0].name).toBe('pressure');
    expect(result.fields[1].name).toBe('category');
    expect(result.fields[2].name).toBe('timestamp');
    expect(result.fields[3].name).toBe('range');
  });
});

// ========================================
// Nested Record Tests
// ========================================

describe('parseDataRecord — nested records', () => {
  it('parses a record containing a nested DataRecord field', () => {
    const result = parseDataRecord({
      type: 'DataRecord',
      fields: [
        {
          name: 'location',
          type: 'DataRecord',
          fields: [
            {
              name: 'lat',
              type: 'Quantity',
              uom: { code: 'deg' },
              value: 45.0,
            },
            {
              name: 'lon',
              type: 'Quantity',
              uom: { code: 'deg' },
              value: -73.0,
            },
          ],
        },
        {
          name: 'temperature',
          type: 'Quantity',
          uom: { code: 'Cel' },
          value: 23.5,
        },
      ],
    });
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].name).toBe('location');
    const nested = (
      result.fields[0] as unknown as {
        component: { type: string; fields: { name: string }[] };
      }
    ).component;
    expect(nested.type).toBe('DataRecord');
    expect(nested.fields).toHaveLength(2);
    expect(nested.fields[0].name).toBe('lat');
    expect(nested.fields[1].name).toBe('lon');
  });

  it('handles 3 levels of nesting', () => {
    const result = parseDataRecord({
      type: 'DataRecord',
      fields: [
        {
          name: 'level1',
          type: 'DataRecord',
          fields: [
            {
              name: 'level2',
              type: 'DataRecord',
              fields: [{ name: 'level3', type: 'Text', value: 'deep' }],
            },
          ],
        },
      ],
    });
    const l1 = (
      result.fields[0] as unknown as {
        component: { type: string; fields: { name: string }[] };
      }
    ).component;
    expect(l1.type).toBe('DataRecord');
    const l2 = (
      l1.fields[0] as unknown as {
        component: { type: string; fields: { name: string }[] };
      }
    ).component;
    expect(l2.type).toBe('DataRecord');
    expect(l2.fields[0].name).toBe('level3');
  });
});

// ========================================
// Link Reference Tests
// ========================================

describe('parseDataRecord — link references', () => {
  it('handles a field with a link reference (href, no type)', () => {
    const result = parseDataRecord({
      type: 'DataRecord',
      fields: [
        {
          name: 'externalDef',
          href: 'http://example.com/definitions/temperature',
          role: 'definition',
          title: 'Temperature Definition',
        },
      ],
    });
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].name).toBe('externalDef');
    expect(result.fields[0].href).toBe(
      'http://example.com/definitions/temperature'
    );
    expect(result.fields[0].role).toBe('definition');
    expect(result.fields[0].title).toBe('Temperature Definition');
  });

  it('mixes inline components and link references', () => {
    const result = parseDataRecord({
      type: 'DataRecord',
      fields: [
        { name: 'temp', type: 'Quantity', uom: { code: 'Cel' }, value: 20 },
        { name: 'ref', href: 'http://example.com/schema', arcrole: 'schema' },
      ],
    });
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].name).toBe('temp');
    expect(result.fields[1].name).toBe('ref');
    expect(result.fields[1].href).toBe('http://example.com/schema');
    expect(result.fields[1].arcrole).toBe('schema');
  });
});

// ========================================
// Error Handling Tests
// ========================================

describe('parseDataRecord — error handling', () => {
  it('throws for null input', () => {
    expect(() => parseDataRecord(null)).toThrow(SweCommonParseError);
    expect(() => parseDataRecord(null)).toThrow('non-null object');
  });

  it('throws for undefined input', () => {
    expect(() => parseDataRecord(undefined)).toThrow(SweCommonParseError);
  });

  it('throws for non-object input', () => {
    expect(() => parseDataRecord('string')).toThrow(SweCommonParseError);
    expect(() => parseDataRecord(42)).toThrow(SweCommonParseError);
  });

  it('throws for wrong type', () => {
    expect(() =>
      parseDataRecord({ type: 'DataArray', fields: [{ name: 'x' }] })
    ).toThrow('Expected type "DataRecord"');
  });

  it('throws for missing type', () => {
    expect(() =>
      parseDataRecord({ fields: [{ name: 'x', type: 'Count' }] })
    ).toThrow('Expected type "DataRecord"');
  });

  it('throws for missing fields', () => {
    expect(() => parseDataRecord({ type: 'DataRecord' })).toThrow(
      'non-empty array'
    );
  });

  it('throws for empty fields array', () => {
    expect(() => parseDataRecord({ type: 'DataRecord', fields: [] })).toThrow(
      'non-empty array'
    );
  });

  it('throws for field missing name', () => {
    expect(() =>
      parseDataRecord({
        type: 'DataRecord',
        fields: [{ type: 'Count', value: 1 }],
      })
    ).toThrow('non-empty "name"');
  });

  it('throws for field with empty name', () => {
    expect(() =>
      parseDataRecord({
        type: 'DataRecord',
        fields: [{ name: '', type: 'Count', value: 1 }],
      })
    ).toThrow('non-empty "name"');
  });

  it('throws for field with unsupported component type', () => {
    expect(() =>
      parseDataRecord({
        type: 'DataRecord',
        fields: [{ name: 'bad', type: 'UnknownType' }],
      })
    ).toThrow('unsupported component type');
  });

  it('throws for non-object field entry', () => {
    expect(() =>
      parseDataRecord({
        type: 'DataRecord',
        fields: ['not-an-object'],
      })
    ).toThrow('non-null object');
  });

  it('throws for field with no type and no href', () => {
    expect(() =>
      parseDataRecord({
        type: 'DataRecord',
        fields: [{ name: 'orphan' }],
      })
    ).toThrow('must have a "type" property or be a link reference');
  });
});

// ========================================
// Complex Type Callback Tests
// ========================================

describe('parseDataRecord — complex types via componentParser callback', () => {
  it('delegates Vector field to componentParser', () => {
    const vectorFixture = {
      name: 'locationVectorLLA',
      type: 'Vector',
      label: 'Location',
      referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4979',
      coordinates: [
        { name: 'lat', type: 'Quantity', uom: { code: 'deg' } },
        { name: 'lon', type: 'Quantity', uom: { code: 'deg' } },
        { name: 'alt', type: 'Quantity', uom: { code: 'm' } },
      ],
    };

    const mockParser = jest.fn().mockReturnValue({
      type: 'Vector',
      label: 'Location',
      referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4979',
      coordinates: [
        { name: 'lat', component: { type: 'Quantity', uom: { code: 'deg' } } },
        { name: 'lon', component: { type: 'Quantity', uom: { code: 'deg' } } },
        { name: 'alt', component: { type: 'Quantity', uom: { code: 'm' } } },
      ],
    });

    const result = parseDataRecord(
      {
        type: 'DataRecord',
        fields: [
          vectorFixture,
          { name: 'active', type: 'Boolean', value: true },
        ],
      },
      mockParser
    );

    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].name).toBe('locationVectorLLA');
    expect(mockParser).toHaveBeenCalledTimes(1);
    expect(mockParser).toHaveBeenCalledWith(vectorFixture);
    const comp = (
      result.fields[0] as unknown as { component: { type: string } }
    ).component;
    expect(comp.type).toBe('Vector');
    // Simple component is still handled directly, not via callback
    expect(result.fields[1].name).toBe('active');
  });

  it('delegates DataArray field to componentParser', () => {
    const dataArrayFixture = {
      name: 'readings',
      type: 'DataArray',
      elementType: { name: 'temp', type: 'Quantity', uom: { code: 'Cel' } },
      encoding: { type: 'JSONEncoding' },
      values: [23.5, 24.1],
    };

    const mockParser = jest.fn().mockReturnValue({
      type: 'DataArray',
      elementType: {
        name: 'temp',
        component: { type: 'Quantity', uom: { code: 'Cel' } },
      },
    });

    const result = parseDataRecord(
      {
        type: 'DataRecord',
        fields: [dataArrayFixture],
      },
      mockParser
    );

    expect(result.fields).toHaveLength(1);
    expect(mockParser).toHaveBeenCalledWith(dataArrayFixture);
    const comp = (
      result.fields[0] as unknown as { component: { type: string } }
    ).component;
    expect(comp.type).toBe('DataArray');
  });

  it('still throws for unsupported types WITHOUT componentParser', () => {
    // Backward compatibility: without callback, complex types still throw
    expect(() =>
      parseDataRecord({
        type: 'DataRecord',
        fields: [{ name: 'vec', type: 'Vector' }],
      })
    ).toThrow('unsupported component type');
  });

  it('passes componentParser through to nested DataRecords', () => {
    const innerVector = {
      name: 'position',
      type: 'Vector',
      coordinates: [{ name: 'x', type: 'Quantity', uom: { code: 'm' } }],
    };

    const mockParser = jest.fn().mockReturnValue({
      type: 'Vector',
      coordinates: [
        { name: 'x', component: { type: 'Quantity', uom: { code: 'm' } } },
      ],
    });

    parseDataRecord(
      {
        type: 'DataRecord',
        fields: [
          {
            name: 'outer',
            type: 'DataRecord',
            fields: [innerVector],
          },
        ],
      },
      mockParser
    );

    // The callback should have been passed through to the nested DataRecord
    expect(mockParser).toHaveBeenCalledTimes(1);
    expect(mockParser).toHaveBeenCalledWith(innerVector);
  });
});
