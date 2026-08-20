/**
 * Tests for SWE Common 3.0 Simple Component Parsers.
 *
 * Covers all 10 simple component types (6 scalar + 4 range),
 * constraint parsing, UOM handling, NilValues, quality indicators,
 * error handling, and the `parseSimpleComponent` discriminator.
 */

import {
  SweCommonParseError,
  parseUnitOfMeasure,
  parseAllowedValues,
  parseAllowedTokens,
  parseAllowedTimes,
  parseNilValues,
  parseQuality,
  parseQuantity,
  parseCount,
  parseBoolean,
  parseText,
  parseTime,
  parseCategory,
  parseQuantityRange,
  parseCountRange,
  parseTimeRange,
  parseCategoryRange,
  parseSimpleComponent,
} from './components.js';

// ========================================
// Scalar Components
// ========================================

describe('parseQuantity', () => {
  it('parses a full Quantity with UOM, value, constraint, and NilValues', () => {
    const result = parseQuantity({
      type: 'Quantity',
      label: 'Temperature',
      description: 'Air temperature',
      definition: 'http://qudt.org/vocab/quantitykind/Temperature',
      uom: { code: 'Cel' },
      value: 23.5,
      constraint: { values: [0, 10, 20, 30], intervals: [[-40, 85]] },
      nilValues: [
        {
          reason: 'http://www.opengis.net/def/nil/OGC/0/BelowDetectionRange',
          value: -999,
        },
      ],
    });
    expect(result.type).toBe('Quantity');
    expect(result.label).toBe('Temperature');
    expect(result.description).toBe('Air temperature');
    expect(result.definition).toBe(
      'http://qudt.org/vocab/quantitykind/Temperature'
    );
    expect(result.uom.code).toBe('Cel');
    expect(result.value).toBe(23.5);
    expect(result.constraint).toBeDefined();
    expect(result.constraint!.values).toEqual([0, 10, 20, 30]);
    expect(result.constraint!.intervals).toEqual([[-40, 85]]);
    expect(result.nilValues).toHaveLength(1);
    expect(result.nilValues![0].reason).toBe(
      'http://www.opengis.net/def/nil/OGC/0/BelowDetectionRange'
    );
  });

  it('parses a minimal Quantity with only UOM', () => {
    const result = parseQuantity({ type: 'Quantity', uom: { code: 'm/s' } });
    expect(result.type).toBe('Quantity');
    expect(result.uom.code).toBe('m/s');
    expect(result.value).toBeUndefined();
    expect(result.constraint).toBeUndefined();
    expect(result.nilValues).toBeUndefined();
  });

  it('throws for non-object input', () => {
    expect(() => parseQuantity(null)).toThrow(SweCommonParseError);
    expect(() => parseQuantity('string')).toThrow(SweCommonParseError);
  });
});

describe('parseCount', () => {
  it('parses a Count with integer value and constraints', () => {
    const result = parseCount({
      type: 'Count',
      label: 'Particle Count',
      value: 42,
      constraint: { intervals: [[0, 1000]] },
    });
    expect(result.type).toBe('Count');
    expect(result.label).toBe('Particle Count');
    expect(result.value).toBe(42);
    expect(result.constraint).toBeDefined();
    expect(result.constraint!.intervals).toEqual([[0, 1000]]);
  });

  it('parses a minimal Count without value', () => {
    const result = parseCount({ type: 'Count' });
    expect(result.type).toBe('Count');
    expect(result.value).toBeUndefined();
  });

  it('throws for non-object input', () => {
    expect(() => parseCount(42)).toThrow(SweCommonParseError);
  });
});

describe('parseBoolean', () => {
  it('parses true value', () => {
    const result = parseBoolean({ type: 'Boolean', value: true });
    expect(result.type).toBe('Boolean');
    expect(result.value).toBe(true);
  });

  it('parses false value', () => {
    const result = parseBoolean({ type: 'Boolean', value: false });
    expect(result.type).toBe('Boolean');
    expect(result.value).toBe(false);
  });

  it('parses without value', () => {
    const result = parseBoolean({ type: 'Boolean', label: 'Alarm' });
    expect(result.type).toBe('Boolean');
    expect(result.label).toBe('Alarm');
    expect(result.value).toBeUndefined();
  });

  it('throws for non-object input', () => {
    expect(() => parseBoolean(true)).toThrow(SweCommonParseError);
  });
});

describe('parseText', () => {
  it('parses a Text with value and AllowedTokens constraint', () => {
    const result = parseText({
      type: 'Text',
      value: 'Station Alpha',
      constraint: {
        values: ['Station Alpha', 'Station Beta', 'Station Gamma'],
      },
    });
    expect(result.type).toBe('Text');
    expect(result.value).toBe('Station Alpha');
    expect(result.constraint).toBeDefined();
    expect(result.constraint!.values).toEqual([
      'Station Alpha',
      'Station Beta',
      'Station Gamma',
    ]);
  });

  it('parses a Text with regex pattern constraint', () => {
    const result = parseText({
      type: 'Text',
      constraint: { pattern: '^[A-Z]{3}$' },
    });
    expect(result.constraint!.pattern).toBe('^[A-Z]{3}$');
  });

  it('throws for non-object input', () => {
    expect(() => parseText('hello')).toThrow(SweCommonParseError);
  });
});

describe('parseTime', () => {
  it('parses a Time with ISO 8601 value and referenceFrame', () => {
    const result = parseTime({
      type: 'Time',
      referenceFrame: 'http://www.opengis.net/def/trs/BIPM/0/UTC',
      uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' },
      value: '2024-06-15T12:00:00Z',
    });
    expect(result.type).toBe('Time');
    expect(result.referenceFrame).toBe(
      'http://www.opengis.net/def/trs/BIPM/0/UTC'
    );
    expect(result.uom.href).toBe(
      'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian'
    );
    expect(result.value).toBe('2024-06-15T12:00:00Z');
  });

  it('parses a Time with referenceTime and localFrame', () => {
    const result = parseTime({
      type: 'Time',
      referenceTime: '2020-01-01T00:00:00Z',
      localFrame: '#MISSION_START',
      uom: { code: 's' },
      value: 3600,
    });
    expect(result.referenceTime).toBe('2020-01-01T00:00:00Z');
    expect(result.localFrame).toBe('#MISSION_START');
    expect(result.value).toBe(3600);
  });

  it('parses a Time with AllowedTimes constraint', () => {
    const result = parseTime({
      type: 'Time',
      uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' },
      constraint: {
        intervals: [['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z']],
      },
    });
    expect(result.constraint).toBeDefined();
    expect(result.constraint!.intervals).toHaveLength(1);
  });

  it('throws for non-object input', () => {
    expect(() => parseTime('2024-01-01')).toThrow(SweCommonParseError);
  });
});

describe('parseCategory', () => {
  it('parses a Category with codeSpace and value', () => {
    const result = parseCategory({
      type: 'Category',
      codeSpace: 'http://example.org/weather-conditions',
      value: 'clear',
      constraint: { values: ['clear', 'cloudy', 'rain', 'snow'] },
    });
    expect(result.type).toBe('Category');
    expect(result.codeSpace).toBe('http://example.org/weather-conditions');
    expect(result.value).toBe('clear');
    expect(result.constraint!.values).toEqual([
      'clear',
      'cloudy',
      'rain',
      'snow',
    ]);
  });

  it('parses a Category without codeSpace', () => {
    const result = parseCategory({ type: 'Category', value: 'active' });
    expect(result.type).toBe('Category');
    expect(result.codeSpace).toBeUndefined();
    expect(result.value).toBe('active');
  });

  it('throws for non-object input', () => {
    expect(() => parseCategory(null)).toThrow(SweCommonParseError);
  });
});

// ========================================
// Range Components
// ========================================

describe('parseQuantityRange', () => {
  it('parses a QuantityRange with UOM and value pair', () => {
    const result = parseQuantityRange({
      type: 'QuantityRange',
      uom: { code: 'Cel' },
      value: [-40, 85],
    });
    expect(result.type).toBe('QuantityRange');
    expect(result.uom.code).toBe('Cel');
    expect(result.value).toEqual([-40, 85]);
  });

  it('parses a QuantityRange with constraints', () => {
    const result = parseQuantityRange({
      type: 'QuantityRange',
      uom: { code: 'hPa' },
      constraint: { intervals: [[300, 1100]] },
    });
    expect(result.constraint!.intervals).toEqual([[300, 1100]]);
  });

  it('ignores value arrays that are not exactly 2 elements', () => {
    const result = parseQuantityRange({
      type: 'QuantityRange',
      uom: { code: 'Cel' },
      value: [1, 2, 3],
    });
    expect(result.value).toBeUndefined();
  });

  it('throws for non-object input', () => {
    expect(() => parseQuantityRange([1, 2])).toThrow(SweCommonParseError);
  });
});

describe('parseCountRange', () => {
  it('parses a CountRange with integer pair', () => {
    const result = parseCountRange({
      type: 'CountRange',
      value: [0, 255],
    });
    expect(result.type).toBe('CountRange');
    expect(result.value).toEqual([0, 255]);
  });

  it('parses a CountRange without value', () => {
    const result = parseCountRange({ type: 'CountRange' });
    expect(result.type).toBe('CountRange');
    expect(result.value).toBeUndefined();
  });

  it('throws for non-object input', () => {
    expect(() => parseCountRange(null)).toThrow(SweCommonParseError);
  });
});

describe('parseTimeRange', () => {
  it('parses a TimeRange with ISO 8601 pair', () => {
    const result = parseTimeRange({
      type: 'TimeRange',
      uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' },
      value: ['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z'],
    });
    expect(result.type).toBe('TimeRange');
    expect(result.value).toEqual([
      '2024-01-01T00:00:00Z',
      '2024-12-31T23:59:59Z',
    ]);
  });

  it('parses with referenceTime and localFrame', () => {
    const result = parseTimeRange({
      type: 'TimeRange',
      uom: { code: 's' },
      referenceTime: '2020-01-01T00:00:00Z',
      localFrame: '#EPOCH',
      value: [0, 86400],
    });
    expect(result.referenceTime).toBe('2020-01-01T00:00:00Z');
    expect(result.localFrame).toBe('#EPOCH');
    expect(result.value).toEqual([0, 86400]);
  });

  it('throws for non-object input', () => {
    expect(() => parseTimeRange('invalid')).toThrow(SweCommonParseError);
  });
});

describe('parseCategoryRange', () => {
  it('parses a CategoryRange with codeSpace and token pair', () => {
    const result = parseCategoryRange({
      type: 'CategoryRange',
      codeSpace: 'http://example.org/quality-levels',
      value: ['low', 'high'],
    });
    expect(result.type).toBe('CategoryRange');
    expect(result.codeSpace).toBe('http://example.org/quality-levels');
    expect(result.value).toEqual(['low', 'high']);
  });

  it('parses with AllowedTokens constraint', () => {
    const result = parseCategoryRange({
      type: 'CategoryRange',
      constraint: { values: ['low', 'medium', 'high'] },
    });
    expect(result.constraint!.values).toEqual(['low', 'medium', 'high']);
  });

  it('throws for non-object input', () => {
    expect(() => parseCategoryRange(undefined)).toThrow(SweCommonParseError);
  });
});

// ========================================
// Constraint Parsers
// ========================================

describe('parseAllowedValues', () => {
  it('parses enumerated values', () => {
    const result = parseAllowedValues({ values: [1, 2, 3, 'NaN'] });
    expect(result.values).toEqual([1, 2, 3, 'NaN']);
  });

  it('parses intervals', () => {
    const result = parseAllowedValues({
      intervals: [
        [0, 100],
        [200, 300],
      ],
    });
    expect(result.intervals).toEqual([
      [0, 100],
      [200, 300],
    ]);
  });

  it('parses significantFigures', () => {
    const result = parseAllowedValues({ significantFigures: 3 });
    expect(result.significantFigures).toBe(3);
  });

  it('returns empty object for non-object input', () => {
    expect(parseAllowedValues(null)).toEqual({});
    expect(parseAllowedValues('string')).toEqual({});
  });
});

describe('parseAllowedTokens', () => {
  it('parses enumerated tokens', () => {
    const result = parseAllowedTokens({ values: ['clear', 'cloudy', 'rain'] });
    expect(result.values).toEqual(['clear', 'cloudy', 'rain']);
  });

  it('parses regex pattern', () => {
    const result = parseAllowedTokens({ pattern: '^[A-Z]{3}$' });
    expect(result.pattern).toBe('^[A-Z]{3}$');
  });

  it('returns empty object for non-object input', () => {
    expect(parseAllowedTokens(undefined)).toEqual({});
  });
});

describe('parseAllowedTimes', () => {
  it('parses time ranges', () => {
    const result = parseAllowedTimes({
      intervals: [['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z']],
    });
    expect(result.intervals).toHaveLength(1);
    expect(result.intervals![0]).toEqual([
      '2024-01-01T00:00:00Z',
      '2024-12-31T23:59:59Z',
    ]);
  });

  it('parses enumerated time values', () => {
    const result = parseAllowedTimes({
      values: ['2024-01-01T00:00:00Z', '2024-07-01T00:00:00Z'],
    });
    expect(result.values).toHaveLength(2);
  });

  it('returns empty object for non-object input', () => {
    expect(parseAllowedTimes(42)).toEqual({});
  });
});

// ========================================
// UOM Handling
// ========================================

describe('parseUnitOfMeasure', () => {
  it('parses UCUM code', () => {
    const result = parseUnitOfMeasure({ code: 'Cel' });
    expect(result.code).toBe('Cel');
  });

  it('parses code and href together', () => {
    const result = parseUnitOfMeasure({
      code: 'm/s',
      href: 'http://qudt.org/vocab/unit/M-PER-SEC',
    });
    expect(result.code).toBe('m/s');
    expect(result.href).toBe('http://qudt.org/vocab/unit/M-PER-SEC');
  });

  it('parses href URI only', () => {
    const result = parseUnitOfMeasure({
      href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
    });
    expect(result.href).toBe(
      'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian'
    );
    expect(result.code).toBeUndefined();
  });

  it('parses label and symbol', () => {
    const result = parseUnitOfMeasure({
      code: '%',
      label: 'Percent',
      symbol: '%',
    });
    expect(result.label).toBe('Percent');
    expect(result.symbol).toBe('%');
  });

  it('returns empty object for non-object input', () => {
    expect(parseUnitOfMeasure(null)).toEqual({});
    expect(parseUnitOfMeasure('Cel')).toEqual({});
  });
});

// ========================================
// NilValues
// ========================================

describe('parseNilValues', () => {
  it('parses NilValues with reason code', () => {
    const result = parseNilValues([
      {
        reason: 'http://www.opengis.net/def/nil/OGC/0/BelowDetectionRange',
        value: -999,
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe(
      'http://www.opengis.net/def/nil/OGC/0/BelowDetectionRange'
    );
    expect(result[0].value).toBe(-999);
  });

  it('parses multiple NilValues entries', () => {
    const result = parseNilValues([
      {
        reason: 'http://www.opengis.net/def/nil/OGC/0/BelowDetectionRange',
        value: -999,
      },
      {
        reason: 'http://www.opengis.net/def/nil/OGC/0/AboveDetectionRange',
        value: 9999,
      },
      { reason: 'http://www.opengis.net/def/nil/OGC/0/missing', value: 'NaN' },
    ]);
    expect(result).toHaveLength(3);
    expect(result[2].value).toBe('NaN');
  });

  it('skips entries without string reason', () => {
    const result = parseNilValues([
      { reason: 'valid', value: 0 },
      { value: 1 },
      { reason: 123, value: 2 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('valid');
  });

  it('returns empty array for non-array input', () => {
    expect(parseNilValues(null)).toEqual([]);
    expect(parseNilValues({})).toEqual([]);
  });
});

// ========================================
// Quality
// ========================================

describe('parseQuality', () => {
  it('parses quality indicators as simple components', () => {
    const result = parseQuality([
      {
        type: 'Quantity',
        definition: 'http://www.sensorml.com/ont/swe/property/accuracy',
        uom: { code: '%' },
        value: 0.5,
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('Quantity');
  });

  it('returns empty array for non-array input', () => {
    expect(parseQuality(null)).toEqual([]);
    expect(parseQuality({})).toEqual([]);
  });
});

// ========================================
// Discriminator
// ========================================

describe('parseSimpleComponent', () => {
  it('dispatches Quantity', () => {
    const result = parseSimpleComponent({
      type: 'Quantity',
      uom: { code: 'Cel' },
      value: 23.5,
    });
    expect(result.type).toBe('Quantity');
  });

  it('dispatches Count', () => {
    const result = parseSimpleComponent({ type: 'Count', value: 10 });
    expect(result.type).toBe('Count');
  });

  it('dispatches Boolean', () => {
    const result = parseSimpleComponent({ type: 'Boolean', value: true });
    expect(result.type).toBe('Boolean');
  });

  it('dispatches Text', () => {
    const result = parseSimpleComponent({ type: 'Text', value: 'hello' });
    expect(result.type).toBe('Text');
  });

  it('dispatches Time', () => {
    const result = parseSimpleComponent({
      type: 'Time',
      uom: { code: 's' },
      value: '2024-01-01T00:00:00Z',
    });
    expect(result.type).toBe('Time');
  });

  it('dispatches Category', () => {
    const result = parseSimpleComponent({ type: 'Category', value: 'clear' });
    expect(result.type).toBe('Category');
  });

  it('dispatches QuantityRange', () => {
    const result = parseSimpleComponent({
      type: 'QuantityRange',
      uom: { code: 'Cel' },
      value: [-40, 85],
    });
    expect(result.type).toBe('QuantityRange');
  });

  it('dispatches CountRange', () => {
    const result = parseSimpleComponent({
      type: 'CountRange',
      value: [0, 100],
    });
    expect(result.type).toBe('CountRange');
  });

  it('dispatches TimeRange', () => {
    const result = parseSimpleComponent({
      type: 'TimeRange',
      uom: { code: 's' },
      value: ['2024-01-01', '2024-12-31'],
    });
    expect(result.type).toBe('TimeRange');
  });

  it('dispatches CategoryRange', () => {
    const result = parseSimpleComponent({
      type: 'CategoryRange',
      value: ['low', 'high'],
    });
    expect(result.type).toBe('CategoryRange');
  });

  it('throws for unknown type', () => {
    expect(() => parseSimpleComponent({ type: 'Unknown' })).toThrow(
      SweCommonParseError
    );
    expect(() => parseSimpleComponent({ type: 'Unknown' })).toThrow(
      /Unknown simple component type/
    );
  });

  it('throws for missing type', () => {
    expect(() => parseSimpleComponent({})).toThrow(SweCommonParseError);
    expect(() => parseSimpleComponent({})).toThrow(/string "type" property/);
  });

  it('throws for non-object input', () => {
    expect(() => parseSimpleComponent(null)).toThrow(SweCommonParseError);
    expect(() => parseSimpleComponent(undefined)).toThrow(SweCommonParseError);
    expect(() => parseSimpleComponent('string')).toThrow(SweCommonParseError);
    expect(() => parseSimpleComponent(42)).toThrow(SweCommonParseError);
  });
});

// ========================================
// Base Properties
// ========================================

describe('base property extraction', () => {
  it('extracts all AbstractSimpleComponent base properties', () => {
    const result = parseQuantity({
      type: 'Quantity',
      id: 'temp-01',
      label: 'Temperature',
      description: 'Ambient temperature',
      definition: 'http://qudt.org/vocab/quantitykind/Temperature',
      updatable: true,
      optional: false,
      referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      axisID: 'z',
      uom: { code: 'Cel' },
    });
    expect(result.id).toBe('temp-01');
    expect(result.label).toBe('Temperature');
    expect(result.description).toBe('Ambient temperature');
    expect(result.definition).toBe(
      'http://qudt.org/vocab/quantitykind/Temperature'
    );
    expect(result.updatable).toBe(true);
    expect(result.optional).toBe(false);
    expect(result.referenceFrame).toBe(
      'http://www.opengis.net/def/crs/EPSG/0/4326'
    );
    expect(result.axisID).toBe('z');
  });

  it('omits missing optional base properties', () => {
    const result = parseCount({ type: 'Count' });
    expect(result.id).toBeUndefined();
    expect(result.label).toBeUndefined();
    expect(result.description).toBeUndefined();
    expect(result.definition).toBeUndefined();
    expect(result.updatable).toBeUndefined();
    expect(result.optional).toBeUndefined();
    expect(result.referenceFrame).toBeUndefined();
    expect(result.axisID).toBeUndefined();
  });
});

// ========================================
// SweCommonParseError
// ========================================

describe('SweCommonParseError', () => {
  it('is an instance of Error', () => {
    const err = new SweCommonParseError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SweCommonParseError);
  });

  it('has correct name and message', () => {
    const err = new SweCommonParseError('something failed');
    expect(err.name).toBe('SweCommonParseError');
    expect(err.message).toBe('something failed');
  });

  it('stores optional path', () => {
    const err = new SweCommonParseError('bad type', 'type');
    expect(err.path).toBe('type');
  });

  it('omits path when not provided', () => {
    const err = new SweCommonParseError('no path');
    expect(err.path).toBeUndefined();
  });
});
