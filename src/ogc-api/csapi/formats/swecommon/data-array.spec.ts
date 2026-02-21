import { parseDataArray, parseEncoding, decodeValues } from './data-array.js';
import { SweCommonParseError } from './components.js';

// ========================================
// JSON Encoding Tests
// ========================================

describe('parseDataArray — JSON encoding', () => {
  it('parses a DataArray with JSON-encoded object values', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: {
        name: 'measurement',
        type: 'DataRecord',
        fields: [
          { name: 'temp', type: 'Quantity', uom: { code: 'Cel' } },
          { name: 'humidity', type: 'Quantity', uom: { code: '%' } },
        ],
      },
      encoding: { type: 'JSONEncoding' },
      values: [
        { temp: 23.5, humidity: 65.2 },
        { temp: 24.1, humidity: 63.8 },
      ],
    });
    expect(result.type).toBe('DataArray');
    expect(result.elementType.name).toBe('measurement');
    expect(result.encoding).toEqual({ type: 'JSONEncoding' });
    expect(result.values).toEqual([
      { temp: 23.5, humidity: 65.2 },
      { temp: 24.1, humidity: 63.8 },
    ]);
  });

  it('parses JSONEncoding with recordsAsArrays: true', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: { name: 'row', type: 'Quantity', uom: { code: 'Cel' } },
      encoding: { type: 'JSONEncoding', recordsAsArrays: true },
      values: [[23.5, 65.2], [24.1, 63.8]],
    });
    expect(result.encoding).toEqual({ type: 'JSONEncoding', recordsAsArrays: true });
    expect(result.values).toEqual([[23.5, 65.2], [24.1, 63.8]]);
  });

  it('applies default encoding options (no booleans set)', () => {
    const enc = parseEncoding({ type: 'JSONEncoding' });
    expect(enc).toEqual({ type: 'JSONEncoding' });
  });

  it('parses JSONEncoding with all options', () => {
    const enc = parseEncoding({
      type: 'JSONEncoding',
      recordsAsArrays: true,
      vectorsAsArrays: false,
    });
    expect(enc).toEqual({
      type: 'JSONEncoding',
      recordsAsArrays: true,
      vectorsAsArrays: false,
    });
  });
});

// ========================================
// Text Encoding Tests
// ========================================

describe('parseDataArray — Text encoding', () => {
  it('decodes comma-separated text values', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: { name: 'sample', type: 'Quantity', uom: { code: 'Cel' } },
      encoding: { type: 'TextEncoding', tokenSeparator: ',', blockSeparator: '\n' },
      values: '23.5,65.2\n24.1,63.8',
    });
    expect(result.values).toEqual([
      ['23.5', '65.2'],
      ['24.1', '63.8'],
    ]);
  });

  it('handles custom separators', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: { name: 'sample', type: 'Text' },
      encoding: {
        type: 'TextEncoding',
        tokenSeparator: ';',
        blockSeparator: '@@',
        decimalSeparator: ',',
      },
      values: 'a;b;c@@d;e;f',
    });
    expect(result.values).toEqual([['a', 'b', 'c'], ['d', 'e', 'f']]);
    expect((result.encoding as { decimalSeparator?: string }).decimalSeparator).toBe(',');
  });

  it('collapses whitespace when collapseWhiteSpaces is true', () => {
    const decoded = decodeValues(
      ' 23.5 , 65.2 \n 24.1 , 63.8 ',
      { type: 'TextEncoding', tokenSeparator: ',', blockSeparator: '\n', collapseWhiteSpaces: true }
    );
    expect(decoded).toEqual([
      ['23.5', '65.2'],
      ['24.1', '63.8'],
    ]);
  });

  it('filters empty blocks from text values', () => {
    const decoded = decodeValues(
      '23.5,65.2\n\n24.1,63.8\n',
      { type: 'TextEncoding', tokenSeparator: ',', blockSeparator: '\n' }
    );
    expect(decoded).toEqual([
      ['23.5', '65.2'],
      ['24.1', '63.8'],
    ]);
  });
});

// ========================================
// Binary Encoding Tests
// ========================================

describe('parseDataArray — Binary encoding', () => {
  it('parses BinaryEncoding with Component members', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: { name: 'sample', type: 'Quantity', uom: { code: 'Cel' } },
      encoding: {
        type: 'BinaryEncoding',
        byteOrder: 'bigEndian',
        byteEncoding: 'base64',
        members: [
          { type: 'Component', ref: 'temperature', dataType: 'http://www.opengis.net/def/dataType/OGC/0/float64' },
        ],
      },
      values: ['AAAAAAAAAAAAAAAA'],
    });
    expect(result.encoding).toMatchObject({
      type: 'BinaryEncoding',
      byteOrder: 'bigEndian',
      byteEncoding: 'base64',
    });
    const enc = result.encoding as { members: { type: string; ref: string; dataType: string }[] };
    expect(enc.members).toHaveLength(1);
    expect(enc.members[0].type).toBe('Component');
    expect(enc.members[0].ref).toBe('temperature');
    expect(enc.members[0].dataType).toBe('http://www.opengis.net/def/dataType/OGC/0/float64');
  });

  it('parses BinaryEncoding with Block members', () => {
    const enc = parseEncoding({
      type: 'BinaryEncoding',
      byteOrder: 'littleEndian',
      byteEncoding: 'raw',
      byteLength: 1024,
      members: [
        { type: 'Block', ref: 'imageData', compression: 'http://www.opengis.net/def/encoding/OGC/0/gzip' },
      ],
    });
    expect(enc.type).toBe('BinaryEncoding');
    const bin = enc as { byteOrder: string; byteEncoding: string; byteLength: number; members: { type: string; ref: string; compression: string }[] };
    expect(bin.byteOrder).toBe('littleEndian');
    expect(bin.byteEncoding).toBe('raw');
    expect(bin.byteLength).toBe(1024);
    expect(bin.members[0].type).toBe('Block');
    expect(bin.members[0].ref).toBe('imageData');
    expect(bin.members[0].compression).toBe('http://www.opengis.net/def/encoding/OGC/0/gzip');
  });

  it('parses Component members with optional properties', () => {
    const enc = parseEncoding({
      type: 'BinaryEncoding',
      byteOrder: 'bigEndian',
      byteEncoding: 'base64',
      members: [
        {
          type: 'Component',
          ref: 'value',
          dataType: 'http://www.opengis.net/def/dataType/OGC/0/float32',
          significantBits: 24,
          bitLength: 32,
          byteLength: 4,
          encryption: 'http://example.com/enc',
        },
      ],
    });
    const bin = enc as unknown as { members: Record<string, unknown>[] };
    expect(bin.members[0].significantBits).toBe(24);
    expect(bin.members[0].bitLength).toBe(32);
    expect(bin.members[0].byteLength).toBe(4);
    expect(bin.members[0].encryption).toBe('http://example.com/enc');
  });

  it('parses Block members with padding', () => {
    const enc = parseEncoding({
      type: 'BinaryEncoding',
      byteOrder: 'bigEndian',
      byteEncoding: 'base64',
      members: [
        {
          type: 'Block',
          ref: 'data',
          'paddingBytes-before': 4,
          'paddingBytes-after': 8,
          byteLength: 256,
          encryption: 'http://example.com/enc',
        },
      ],
    });
    const bin = enc as unknown as { members: Record<string, unknown>[] };
    expect(bin.members[0]['paddingBytes-before']).toBe(4);
    expect(bin.members[0]['paddingBytes-after']).toBe(8);
    expect(bin.members[0].byteLength).toBe(256);
    expect(bin.members[0].encryption).toBe('http://example.com/enc');
  });

  it('preserves binary values as-is', () => {
    const decoded = decodeValues(
      'AQIDBAUG',
      { type: 'BinaryEncoding', byteOrder: 'bigEndian', byteEncoding: 'base64', members: [] as unknown as [{ type: 'Component'; ref: string; dataType: string }] }
    );
    expect(decoded).toEqual(['AQIDBAUG']);
  });
});

// ========================================
// XMLEncoding Tests
// ========================================

describe('parseEncoding — XMLEncoding', () => {
  it('recognizes XMLEncoding type discriminator', () => {
    const enc = parseEncoding({ type: 'XMLEncoding', namespace: 'http://example.com/ns' });
    expect(enc.type).toBe('XMLEncoding');
    expect((enc as { namespace?: string }).namespace).toBe('http://example.com/ns');
  });

  it('recognizes XMLEncoding without namespace', () => {
    const enc = parseEncoding({ type: 'XMLEncoding' });
    expect(enc.type).toBe('XMLEncoding');
  });
});

// ========================================
// Element Count Tests
// ========================================

describe('parseDataArray — element count', () => {
  it('parses elementCount with integer value', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: { name: 'sample', type: 'Quantity', uom: { code: 'Cel' } },
      elementCount: { type: 'ElementCount', value: 100 },
    });
    const ec = result.elementCount as { type: string; value: number };
    expect(ec.type).toBe('ElementCount');
    expect(ec.value).toBe(100);
  });

  it('parses elementCount as link reference', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: { name: 'sample', type: 'Quantity', uom: { code: 'Cel' } },
      elementCount: { href: 'http://example.com/count', role: 'count' },
    });
    const ec = result.elementCount as { href: string; role: string };
    expect(ec.href).toBe('http://example.com/count');
    expect(ec.role).toBe('count');
  });

  it('omits elementCount when not provided', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: { name: 'sample', type: 'Quantity', uom: { code: 'Cel' } },
    });
    expect(result.elementCount).toBeUndefined();
  });
});

// ========================================
// Element Type Tests
// ========================================

describe('parseDataArray — element type', () => {
  it('parses a simple element type (Quantity)', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: { name: 'temperature', type: 'Quantity', uom: { code: 'Cel' }, value: 23.5 },
    });
    expect(result.elementType.name).toBe('temperature');
  });

  it('parses a complex element type (DataRecord)', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: {
        name: 'observation',
        type: 'DataRecord',
        fields: [
          { name: 'time', type: 'Time', uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' } },
          { name: 'value', type: 'Quantity', uom: { code: 'Cel' } },
        ],
      },
    });
    expect(result.elementType.name).toBe('observation');
    const comp = (result.elementType as unknown as { component: { type: string } }).component;
    expect(comp.type).toBe('DataRecord');
  });

  it('parses element type as link reference', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: {
        name: 'externalDef',
        href: 'http://example.com/schema/measurement',
        role: 'definition',
      },
    });
    expect(result.elementType.name).toBe('externalDef');
    expect((result.elementType as Record<string, unknown>).href).toBe('http://example.com/schema/measurement');
    expect((result.elementType as Record<string, unknown>).role).toBe('definition');
  });

  it('parses nested DataArray element type', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: {
        name: 'profile',
        type: 'DataArray',
        elementType: { name: 'value', type: 'Quantity', uom: { code: 'm' } },
      },
    });
    expect(result.elementType.name).toBe('profile');
    const nested = (result.elementType as unknown as { component: { type: string } }).component;
    expect(nested.type).toBe('DataArray');
  });
});

// ========================================
// Base Properties Tests
// ========================================

describe('parseDataArray — base properties', () => {
  it('parses AbstractDataComponent properties', () => {
    const result = parseDataArray({
      type: 'DataArray',
      id: 'arr-1',
      label: 'Temperature Series',
      description: 'Hourly temperature readings',
      definition: 'http://example.com/def/temp-series',
      updatable: true,
      optional: false,
      elementType: { name: 'temp', type: 'Quantity', uom: { code: 'Cel' } },
    });
    expect(result.id).toBe('arr-1');
    expect(result.label).toBe('Temperature Series');
    expect(result.description).toBe('Hourly temperature readings');
    expect(result.definition).toBe('http://example.com/def/temp-series');
    expect(result.updatable).toBe(true);
    expect(result.optional).toBe(false);
  });
});

// ========================================
// Values Link Reference Tests
// ========================================

describe('parseDataArray — values link reference', () => {
  it('preserves values link reference for downstream resolution', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: { name: 'sample', type: 'Quantity', uom: { code: 'Cel' } },
      encoding: { type: 'JSONEncoding' },
      values: { href: 'http://example.com/data/values' },
    });
    const vals = result.values as { href: string };
    expect(vals.href).toBe('http://example.com/data/values');
  });

  it('preserves values link reference without encoding', () => {
    const result = parseDataArray({
      type: 'DataArray',
      elementType: { name: 'sample', type: 'Quantity', uom: { code: 'Cel' } },
      values: { href: 'http://example.com/data/values' },
    });
    const vals = result.values as { href: string };
    expect(vals.href).toBe('http://example.com/data/values');
  });
});

// ========================================
// Error Handling Tests
// ========================================

describe('parseDataArray — error handling', () => {
  it('throws for null input', () => {
    expect(() => parseDataArray(null)).toThrow(SweCommonParseError);
    expect(() => parseDataArray(null)).toThrow('non-null object');
  });

  it('throws for undefined input', () => {
    expect(() => parseDataArray(undefined)).toThrow(SweCommonParseError);
  });

  it('throws for non-object input', () => {
    expect(() => parseDataArray('string')).toThrow(SweCommonParseError);
    expect(() => parseDataArray(42)).toThrow(SweCommonParseError);
  });

  it('throws for wrong type', () => {
    expect(() =>
      parseDataArray({ type: 'DataRecord', elementType: { name: 'x' } })
    ).toThrow('Expected type "DataArray"');
  });

  it('throws for missing type', () => {
    expect(() =>
      parseDataArray({ elementType: { name: 'x', type: 'Count' } })
    ).toThrow('Expected type "DataArray"');
  });

  it('throws for missing elementType', () => {
    expect(() =>
      parseDataArray({ type: 'DataArray' })
    ).toThrow('requires an "elementType"');
  });

  it('throws for elementType missing name', () => {
    expect(() =>
      parseDataArray({ type: 'DataArray', elementType: { type: 'Count' } })
    ).toThrow('non-empty "name"');
  });

  it('throws for elementType with empty name', () => {
    expect(() =>
      parseDataArray({ type: 'DataArray', elementType: { name: '', type: 'Count' } })
    ).toThrow('non-empty "name"');
  });

  it('throws for elementType with no type and no href', () => {
    expect(() =>
      parseDataArray({ type: 'DataArray', elementType: { name: 'orphan' } })
    ).toThrow('must have a "type" property or be a link reference');
  });

  it('throws for unrecognized encoding type', () => {
    expect(() =>
      parseDataArray({
        type: 'DataArray',
        elementType: { name: 'x', type: 'Count' },
        encoding: { type: 'CustomEncoding' },
      })
    ).toThrow('Unrecognized encoding type');
  });

  it('throws for TextEncoding missing tokenSeparator', () => {
    expect(() =>
      parseEncoding({ type: 'TextEncoding', blockSeparator: '\n' })
    ).toThrow('tokenSeparator');
  });

  it('throws for TextEncoding missing blockSeparator', () => {
    expect(() =>
      parseEncoding({ type: 'TextEncoding', tokenSeparator: ',' })
    ).toThrow('blockSeparator');
  });

  it('throws for BinaryEncoding missing byteOrder', () => {
    expect(() =>
      parseEncoding({ type: 'BinaryEncoding', byteEncoding: 'base64', members: [{ type: 'Component', ref: 'x', dataType: 'y' }] })
    ).toThrow('byteOrder');
  });

  it('throws for BinaryEncoding missing byteEncoding', () => {
    expect(() =>
      parseEncoding({ type: 'BinaryEncoding', byteOrder: 'bigEndian', members: [{ type: 'Component', ref: 'x', dataType: 'y' }] })
    ).toThrow('byteEncoding');
  });

  it('throws for BinaryEncoding missing members', () => {
    expect(() =>
      parseEncoding({ type: 'BinaryEncoding', byteOrder: 'bigEndian', byteEncoding: 'base64' })
    ).toThrow('non-empty "members"');
  });

  it('throws for BinaryEncoding empty members', () => {
    expect(() =>
      parseEncoding({ type: 'BinaryEncoding', byteOrder: 'bigEndian', byteEncoding: 'base64', members: [] })
    ).toThrow('non-empty "members"');
  });

  it('throws for BinaryEncoding Component missing ref', () => {
    expect(() =>
      parseEncoding({
        type: 'BinaryEncoding',
        byteOrder: 'bigEndian',
        byteEncoding: 'base64',
        members: [{ type: 'Component', dataType: 'y' }],
      })
    ).toThrow('"ref"');
  });

  it('throws for BinaryEncoding Component missing dataType', () => {
    expect(() =>
      parseEncoding({
        type: 'BinaryEncoding',
        byteOrder: 'bigEndian',
        byteEncoding: 'base64',
        members: [{ type: 'Component', ref: 'x' }],
      })
    ).toThrow('"dataType"');
  });

  it('throws for BinaryEncoding Block missing ref', () => {
    expect(() =>
      parseEncoding({
        type: 'BinaryEncoding',
        byteOrder: 'bigEndian',
        byteEncoding: 'base64',
        members: [{ type: 'Block' }],
      })
    ).toThrow('"ref"');
  });

  it('throws for encoding that is not an object', () => {
    expect(() => parseEncoding('not-an-object')).toThrow('non-null object');
  });

  it('throws for encoding missing type', () => {
    expect(() => parseEncoding({ tokenSeparator: ',' })).toThrow('"type" string');
  });

  it('throws for unrecognized binary member type', () => {
    expect(() =>
      parseEncoding({
        type: 'BinaryEncoding',
        byteOrder: 'bigEndian',
        byteEncoding: 'base64',
        members: [{ type: 'Unknown', ref: 'x' }],
      })
    ).toThrow('unrecognized type');
  });

  it('throws for non-object binary member', () => {
    expect(() =>
      parseEncoding({
        type: 'BinaryEncoding',
        byteOrder: 'bigEndian',
        byteEncoding: 'base64',
        members: ['not-an-object'],
      })
    ).toThrow('non-null object');
  });

  it('throws for unsupported elementType component type', () => {
    expect(() =>
      parseDataArray({
        type: 'DataArray',
        elementType: { name: 'bad', type: 'UnknownComponent' },
      })
    ).toThrow('unsupported component type');
  });
});

// ========================================
// Complex Type Callback Tests
// ========================================

describe('parseDataArray — complex types via componentParser callback', () => {
  it('delegates Vector elementType to componentParser', () => {
    const vectorFixture = {
      name: 'position',
      type: 'Vector',
      referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4979',
      coordinates: [
        { name: 'lat', type: 'Quantity', uom: { code: 'deg' } },
        { name: 'lon', type: 'Quantity', uom: { code: 'deg' } },
      ],
    };

    const mockParser = jest.fn().mockReturnValue({
      type: 'Vector',
      referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4979',
      coordinates: [
        { name: 'lat', component: { type: 'Quantity', uom: { code: 'deg' } } },
        { name: 'lon', component: { type: 'Quantity', uom: { code: 'deg' } } },
      ],
    });

    const result = parseDataArray(
      {
        type: 'DataArray',
        elementType: vectorFixture,
        encoding: { type: 'JSONEncoding' },
        values: [],
      },
      mockParser
    );

    expect(result.type).toBe('DataArray');
    expect(result.elementType.name).toBe('position');
    expect(mockParser).toHaveBeenCalledTimes(1);
    expect(mockParser).toHaveBeenCalledWith(vectorFixture);
    const comp = (result.elementType as unknown as { component: { type: string } }).component;
    expect(comp.type).toBe('Vector');
  });

  it('still throws for unsupported types WITHOUT componentParser', () => {
    expect(() =>
      parseDataArray({
        type: 'DataArray',
        elementType: { name: 'geo', type: 'Geometry' },
      })
    ).toThrow('unsupported component type');
  });

  it('passes componentParser through to nested DataRecord elementType', () => {
    const vectorField = {
      name: 'vec',
      type: 'Vector',
      coordinates: [{ name: 'x', type: 'Quantity', uom: { code: 'm' } }],
    };

    const mockParser = jest.fn().mockReturnValue({
      type: 'Vector',
      coordinates: [{ name: 'x', component: { type: 'Quantity', uom: { code: 'm' } } }],
    });

    const result = parseDataArray(
      {
        type: 'DataArray',
        elementType: {
          name: 'record',
          type: 'DataRecord',
          fields: [vectorField],
        },
      },
      mockParser
    );

    expect(result.elementType.name).toBe('record');
    // The callback should have been forwarded through parseDataRecord
    expect(mockParser).toHaveBeenCalledTimes(1);
    expect(mockParser).toHaveBeenCalledWith(vectorField);
  });
});
