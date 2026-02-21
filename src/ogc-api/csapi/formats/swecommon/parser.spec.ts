/**
 * Tests for SWE Common 3.0 Main Parser.
 *
 * Covers type discrimination (all 16 component types), encoding detection,
 * schema validation, and error handling for the main parser entry points.
 */

import {
  parseSWEComponent,
  parseVector,
  parseMatrix,
  parseDataChoice,
  parseGeometry,
  detectEncoding,
  validateAgainstSchema,
} from './parser.js';
import { SweCommonParseError } from './components.js';

import type { AnyComponent, Vector, DataChoice, SweGeometry, Matrix } from './types.js';

// ========================================
// Type Discrimination — Simple Components
// ========================================

describe('parseSWEComponent — simple component delegation', () => {
  it('dispatches Quantity to parseSimpleComponent', () => {
    const result = parseSWEComponent({
      type: 'Quantity',
      uom: { code: 'Cel' },
      value: 23.5,
    });
    expect(result.type).toBe('Quantity');
    expect((result as unknown as Record<string, unknown>).value).toBe(23.5);
  });

  it('dispatches Count to parseSimpleComponent', () => {
    const result = parseSWEComponent({ type: 'Count', value: 42 });
    expect(result.type).toBe('Count');
  });

  it('dispatches Boolean to parseSimpleComponent', () => {
    const result = parseSWEComponent({ type: 'Boolean', value: true });
    expect(result.type).toBe('Boolean');
  });

  it('dispatches Text to parseSimpleComponent', () => {
    const result = parseSWEComponent({ type: 'Text', value: 'hello' });
    expect(result.type).toBe('Text');
  });

  it('dispatches Time to parseSimpleComponent', () => {
    const result = parseSWEComponent({
      type: 'Time',
      uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' },
      value: '2024-06-15T12:00:00Z',
    });
    expect(result.type).toBe('Time');
  });

  it('dispatches Category to parseSimpleComponent', () => {
    const result = parseSWEComponent({ type: 'Category', value: 'clear' });
    expect(result.type).toBe('Category');
  });

  it('dispatches QuantityRange to parseSimpleComponent', () => {
    const result = parseSWEComponent({
      type: 'QuantityRange',
      uom: { code: 'Cel' },
      value: [-40, 85],
    });
    expect(result.type).toBe('QuantityRange');
  });

  it('dispatches CountRange to parseSimpleComponent', () => {
    const result = parseSWEComponent({ type: 'CountRange', value: [0, 255] });
    expect(result.type).toBe('CountRange');
  });

  it('dispatches TimeRange to parseSimpleComponent', () => {
    const result = parseSWEComponent({
      type: 'TimeRange',
      uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' },
      value: ['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z'],
    });
    expect(result.type).toBe('TimeRange');
  });

  it('dispatches CategoryRange to parseSimpleComponent', () => {
    const result = parseSWEComponent({ type: 'CategoryRange', value: ['low', 'high'] });
    expect(result.type).toBe('CategoryRange');
  });
});

// ========================================
// Type Discrimination — Complex Components
// ========================================

describe('parseSWEComponent — complex component delegation', () => {
  it('dispatches DataRecord to parseDataRecord', () => {
    const result = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        { name: 'temp', type: 'Quantity', uom: { code: 'Cel' } },
      ],
    });
    expect(result.type).toBe('DataRecord');
  });

  it('dispatches DataArray to parseDataArray', () => {
    const result = parseSWEComponent({
      type: 'DataArray',
      elementType: { name: 'sample', type: 'Quantity', uom: { code: 'Cel' } },
    });
    expect(result.type).toBe('DataArray');
  });

  it('dispatches Vector to parseVector', () => {
    const result = parseSWEComponent({
      type: 'Vector',
      label: 'Position',
      referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      coordinates: [
        { name: 'lat', type: 'Quantity', uom: { code: 'deg' }, value: 45.0 },
        { name: 'lon', type: 'Quantity', uom: { code: 'deg' }, value: -73.0 },
      ],
    });
    expect(result.type).toBe('Vector');
    expect((result as Vector).referenceFrame).toBe(
      'http://www.opengis.net/def/crs/EPSG/0/4326'
    );
  });

  it('dispatches Matrix to parseMatrix', () => {
    const result = parseSWEComponent({
      type: 'Matrix',
      elementType: {
        name: 'row',
        type: 'DataRecord',
        fields: [
          { name: 'c1', type: 'Quantity', uom: { code: '1' } },
        ],
      },
      referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4326',
    });
    expect(result.type).toBe('Matrix');
    expect((result as Matrix).referenceFrame).toBe(
      'http://www.opengis.net/def/crs/EPSG/0/4326'
    );
  });

  it('dispatches DataChoice to parseDataChoice', () => {
    const result = parseSWEComponent({
      type: 'DataChoice',
      items: [
        { name: 'tempReading', type: 'Quantity', uom: { code: 'Cel' } },
        { name: 'statusText', type: 'Text' },
      ],
    });
    expect(result.type).toBe('DataChoice');
    expect((result as DataChoice).items).toHaveLength(2);
  });

  it('dispatches Geometry to parseGeometry', () => {
    const result = parseSWEComponent({
      type: 'Geometry',
      srs: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      value: { type: 'Point', coordinates: [45.0, -73.0] },
    });
    expect(result.type).toBe('Geometry');
    expect((result as SweGeometry).srs).toBe(
      'http://www.opengis.net/def/crs/EPSG/0/4326'
    );
  });
});

// ========================================
// Vector Parser
// ========================================

describe('parseVector', () => {
  it('parses a full Vector with coordinates and base properties', () => {
    const result = parseVector({
      type: 'Vector',
      id: 'vec-1',
      label: 'Position',
      description: 'Geographic position',
      referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      localFrame: '#SENSOR_FRAME',
      coordinates: [
        { name: 'lat', type: 'Quantity', uom: { code: 'deg' }, value: 45.0 },
        { name: 'lon', type: 'Quantity', uom: { code: 'deg' }, value: -73.0 },
        { name: 'alt', type: 'Quantity', uom: { code: 'm' }, value: 100.0 },
      ],
    });
    expect(result.type).toBe('Vector');
    expect(result.id).toBe('vec-1');
    expect(result.label).toBe('Position');
    expect(result.referenceFrame).toBe('http://www.opengis.net/def/crs/EPSG/0/4326');
    expect(result.localFrame).toBe('#SENSOR_FRAME');
    expect(result.coordinates).toHaveLength(3);
    expect(result.coordinates[0].name).toBe('lat');
    expect(result.coordinates[2].name).toBe('alt');
  });

  it('throws for non-object input', () => {
    expect(() => parseVector(null)).toThrow(SweCommonParseError);
    expect(() => parseVector('string')).toThrow(SweCommonParseError);
  });

  it('throws when referenceFrame is missing', () => {
    expect(() =>
      parseVector({
        type: 'Vector',
        coordinates: [{ name: 'x', type: 'Quantity', uom: { code: 'm' } }],
      })
    ).toThrow(SweCommonParseError);
  });

  it('throws when coordinates are missing', () => {
    expect(() =>
      parseVector({
        type: 'Vector',
        referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      })
    ).toThrow(SweCommonParseError);
  });

  it('throws when coordinates is empty', () => {
    expect(() =>
      parseVector({
        type: 'Vector',
        referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4326',
        coordinates: [],
      })
    ).toThrow(SweCommonParseError);
  });
});

// ========================================
// Matrix Parser
// ========================================

describe('parseMatrix', () => {
  it('parses a Matrix with elementType and referenceFrame', () => {
    const result = parseMatrix({
      type: 'Matrix',
      referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      elementType: {
        name: 'row',
        type: 'DataRecord',
        fields: [
          { name: 'c1', type: 'Quantity', uom: { code: '1' } },
          { name: 'c2', type: 'Quantity', uom: { code: '1' } },
        ],
      },
      elementCount: { type: 'ElementCount', value: 3 },
    });
    expect(result.type).toBe('Matrix');
    expect(result.referenceFrame).toBe('http://www.opengis.net/def/crs/EPSG/0/4326');
    expect(result.elementType.name).toBe('row');
    expect(result.elementCount).toBeDefined();
  });

  it('throws for non-object input', () => {
    expect(() => parseMatrix(null)).toThrow(SweCommonParseError);
  });

  it('throws when elementType is missing', () => {
    expect(() => parseMatrix({ type: 'Matrix' })).toThrow(SweCommonParseError);
  });
});

// ========================================
// DataChoice Parser
// ========================================

describe('parseDataChoice', () => {
  it('parses a DataChoice with multiple items', () => {
    const result = parseDataChoice({
      type: 'DataChoice',
      label: 'Measurement Mode',
      items: [
        { name: 'tempReading', type: 'Quantity', uom: { code: 'Cel' } },
        { name: 'statusText', type: 'Text' },
        { name: 'countMode', type: 'Count' },
      ],
    });
    expect(result.type).toBe('DataChoice');
    expect(result.label).toBe('Measurement Mode');
    expect(result.items).toHaveLength(3);
    expect(result.items[0].name).toBe('tempReading');
    expect(result.items[1].name).toBe('statusText');
  });

  it('parses a DataChoice with choiceValue', () => {
    const result = parseDataChoice({
      type: 'DataChoice',
      choiceValue: { type: 'Category', value: 'mode-a' },
      items: [
        { name: 'modeA', type: 'Quantity', uom: { code: 'Cel' } },
        { name: 'modeB', type: 'Text' },
      ],
    });
    expect(result.choiceValue).toBeDefined();
    expect(result.choiceValue!.type).toBe('Category');
  });

  it('throws for non-object input', () => {
    expect(() => parseDataChoice(null)).toThrow(SweCommonParseError);
  });

  it('throws when items are missing', () => {
    expect(() => parseDataChoice({ type: 'DataChoice' })).toThrow(SweCommonParseError);
  });

  it('throws when items is empty', () => {
    expect(() =>
      parseDataChoice({ type: 'DataChoice', items: [] })
    ).toThrow(SweCommonParseError);
  });
});

// ========================================
// Geometry Parser
// ========================================

describe('parseGeometry', () => {
  it('parses a Geometry with srs, value, and constraint', () => {
    const result = parseGeometry({
      type: 'Geometry',
      srs: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      constraint: { geomTypes: ['Point', 'Polygon'] },
      value: { type: 'Point', coordinates: [45.0, -73.0] },
    });
    expect(result.type).toBe('Geometry');
    expect(result.srs).toBe('http://www.opengis.net/def/crs/EPSG/0/4326');
    expect(result.constraint!.geomTypes).toEqual(['Point', 'Polygon']);
    expect(result.value!.type).toBe('Point');
  });

  it('parses a minimal Geometry without value', () => {
    const result = parseGeometry({ type: 'Geometry', srs: 'urn:ogc:def:crs:EPSG::4326' });
    expect(result.type).toBe('Geometry');
    expect(result.srs).toBe('urn:ogc:def:crs:EPSG::4326');
    expect(result.value).toBeUndefined();
  });

  it('throws for non-object input', () => {
    expect(() => parseGeometry(null)).toThrow(SweCommonParseError);
    expect(() => parseGeometry(42)).toThrow(SweCommonParseError);
  });
});

// ========================================
// Encoding Detection
// ========================================

describe('detectEncoding', () => {
  it('detects JSONEncoding', () => {
    const enc = detectEncoding({ encoding: { type: 'JSONEncoding' } });
    expect(enc).toEqual({ type: 'JSONEncoding' });
  });

  it('detects TextEncoding', () => {
    const enc = detectEncoding({
      encoding: { type: 'TextEncoding', tokenSeparator: ',', blockSeparator: '\n' },
    });
    expect(enc!.type).toBe('TextEncoding');
  });

  it('detects BinaryEncoding', () => {
    const enc = detectEncoding({
      encoding: {
        type: 'BinaryEncoding',
        byteOrder: 'bigEndian',
        byteEncoding: 'base64',
        members: [{ type: 'Component', ref: 'temp', dataType: 'http://www.opengis.net/def/dataType/OGC/0/float64' }],
      },
    });
    expect(enc!.type).toBe('BinaryEncoding');
  });

  it('detects XMLEncoding', () => {
    const enc = detectEncoding({ encoding: { type: 'XMLEncoding' } });
    expect(enc!.type).toBe('XMLEncoding');
  });

  it('returns undefined when no encoding is present', () => {
    expect(detectEncoding({})).toBeUndefined();
    expect(detectEncoding({ values: [1, 2, 3] })).toBeUndefined();
  });

  it('returns undefined for non-object input', () => {
    expect(detectEncoding(null)).toBeUndefined();
    expect(detectEncoding('string')).toBeUndefined();
    expect(detectEncoding(undefined)).toBeUndefined();
  });
});

// ========================================
// Schema Validation
// ========================================

describe('validateAgainstSchema — structure match', () => {
  it('passes valid DataRecord value against DataRecord schema', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        { name: 'temp', type: 'Quantity', uom: { code: 'Cel' } },
        { name: 'status', type: 'Text' },
      ],
    });
    const result = validateAgainstSchema({ temp: 23.5, status: 'OK' }, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when required field is missing', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        { name: 'temp', type: 'Quantity', uom: { code: 'Cel' } },
        { name: 'status', type: 'Text' },
      ],
    });
    const result = validateAgainstSchema({ temp: 23.5 }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MISSING_FIELD')).toBe(true);
    expect(result.errors.some((e) => e.path === 'status')).toBe(true);
  });

  it('passes when optional field is missing', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        { name: 'temp', type: 'Quantity', uom: { code: 'Cel' } },
        { name: 'notes', type: 'Text', optional: true },
      ],
    });
    const result = validateAgainstSchema({ temp: 23.5 }, schema);
    expect(result.valid).toBe(true);
  });
});

describe('validateAgainstSchema — type match', () => {
  it('detects type mismatch (string where number expected)', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        { name: 'temp', type: 'Quantity', uom: { code: 'Cel' } },
      ],
    });
    const result = validateAgainstSchema({ temp: 'not-a-number' }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('TYPE_MISMATCH');
  });

  it('detects type mismatch (number where boolean expected)', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        { name: 'active', type: 'Boolean' },
      ],
    });
    const result = validateAgainstSchema({ active: 1 }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('TYPE_MISMATCH');
  });

  it('validates Count requires an integer', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        { name: 'count', type: 'Count' },
      ],
    });
    const result = validateAgainstSchema({ count: 3.5 }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('TYPE_MISMATCH');
  });
});

describe('validateAgainstSchema — range validation', () => {
  it('detects range violation (value outside AllowedValues interval)', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        {
          name: 'temp',
          type: 'Quantity',
          uom: { code: 'Cel' },
          constraint: { intervals: [[-40, 85]] },
        },
      ],
    });
    const result = validateAgainstSchema({ temp: 100 }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('RANGE_VIOLATION');
  });

  it('passes value within AllowedValues interval', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        {
          name: 'temp',
          type: 'Quantity',
          uom: { code: 'Cel' },
          constraint: { intervals: [[-40, 85]] },
        },
      ],
    });
    const result = validateAgainstSchema({ temp: 23.5 }, schema);
    expect(result.valid).toBe(true);
  });

  it('detects value not in enumerated AllowedValues', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        {
          name: 'setting',
          type: 'Count',
          constraint: { values: [1, 2, 3, 5, 8] },
        },
      ],
    });
    const result = validateAgainstSchema({ setting: 4 }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('RANGE_VIOLATION');
  });
});

describe('validateAgainstSchema — token validation', () => {
  it('detects token violation for Category', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        {
          name: 'weather',
          type: 'Category',
          constraint: { values: ['clear', 'cloudy', 'rain'] },
        },
      ],
    });
    const result = validateAgainstSchema({ weather: 'snow' }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('TOKEN_VIOLATION');
  });

  it('passes valid token for Category', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        {
          name: 'weather',
          type: 'Category',
          constraint: { values: ['clear', 'cloudy', 'rain'] },
        },
      ],
    });
    const result = validateAgainstSchema({ weather: 'clear' }, schema);
    expect(result.valid).toBe(true);
  });
});

describe('validateAgainstSchema — array dimensions', () => {
  it('detects array dimension mismatch', () => {
    const schema = parseSWEComponent({
      type: 'DataArray',
      elementType: { name: 'sample', type: 'Quantity', uom: { code: 'Cel' } },
      elementCount: { type: 'ElementCount', value: 3 },
    });
    const result = validateAgainstSchema([1, 2], schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('ARRAY_DIMENSION_MISMATCH');
  });

  it('passes when array length matches elementCount', () => {
    const schema = parseSWEComponent({
      type: 'DataArray',
      elementType: { name: 'sample', type: 'Quantity', uom: { code: 'Cel' } },
      elementCount: { type: 'ElementCount', value: 3 },
    });
    const result = validateAgainstSchema([1, 2, 3], schema);
    expect(result.valid).toBe(true);
  });
});

// ========================================
// Error Handling
// ========================================

describe('parseSWEComponent — error handling', () => {
  it('throws for null input', () => {
    expect(() => parseSWEComponent(null)).toThrow(SweCommonParseError);
  });

  it('throws for undefined input', () => {
    expect(() => parseSWEComponent(undefined)).toThrow(SweCommonParseError);
  });

  it('throws for non-object input', () => {
    expect(() => parseSWEComponent('string')).toThrow(SweCommonParseError);
    expect(() => parseSWEComponent(42)).toThrow(SweCommonParseError);
    expect(() => parseSWEComponent([])).toThrow(SweCommonParseError);
  });

  it('throws for missing type property', () => {
    expect(() => parseSWEComponent({})).toThrow(SweCommonParseError);
    expect(() => parseSWEComponent({ value: 42 })).toThrow(SweCommonParseError);
  });

  it('throws for unknown type with meaningful message', () => {
    try {
      parseSWEComponent({ type: 'FooBar' });
      fail('Expected SweCommonParseError');
    } catch (e) {
      expect(e).toBeInstanceOf(SweCommonParseError);
      expect((e as Error).message).toContain('FooBar');
      expect((e as Error).message).toContain('Valid types');
    }
  });

  it('includes valid type names in unknown type error', () => {
    try {
      parseSWEComponent({ type: 'Invalid' });
      fail('Expected SweCommonParseError');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain('Quantity');
      expect(msg).toContain('DataRecord');
      expect(msg).toContain('Vector');
      expect(msg).toContain('Geometry');
    }
  });
});

// ========================================
// Invalid Schema Pattern Handling
// ========================================

describe('validateAgainstSchema — invalid schema patterns', () => {
  it('reports invalid regex pattern in AllowedTokens constraint', () => {
    const schema = parseSWEComponent({
      type: 'DataRecord',
      fields: [
        {
          name: 'tag',
          type: 'Category',
          constraint: { pattern: '[invalid' },
        },
      ],
    });
    const result = validateAgainstSchema({ tag: 'anything' }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('SCHEMA_ERROR');
    expect(result.errors[0].message).toContain('invalid regex pattern');
  });
});

// ========================================
// Geometry Constraint Validation
// ========================================

describe('validateAgainstSchema — geometry constraints', () => {
  it('reports geometry type not in allowed geomTypes', () => {
    const schema = parseSWEComponent({
      type: 'Geometry',
      srs: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      constraint: { geomTypes: ['Point', 'MultiPoint'] },
    });
    const result = validateAgainstSchema(
      { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
      schema
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'CONSTRAINT_VIOLATION')).toBe(true);
  });

  it('passes when geometry type is in allowed geomTypes', () => {
    const schema = parseSWEComponent({
      type: 'Geometry',
      srs: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      constraint: { geomTypes: ['Point', 'MultiPoint'] },
    });
    const result = validateAgainstSchema(
      { type: 'Point', coordinates: [0, 0] },
      schema
    );
    expect(result.valid).toBe(true);
  });
});
