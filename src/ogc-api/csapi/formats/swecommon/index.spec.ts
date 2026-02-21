/**
 * Tests for SWE Common 3.0 Index barrel file.
 *
 * Verifies that all public API exports are accessible through the
 * barrel file and that parser functions are callable.
 */

import {
  parseSWEComponent,
  parseSimpleComponent,
  parseDataRecord,
  parseDataArray,
  parseEncoding,
  decodeValues,
  parseVector,
  parseMatrix,
  parseDataChoice,
  parseGeometry,
  detectEncoding,
  validateAgainstSchema,
  SweCommonParseError,
  parseUnitOfMeasure,
  parseAllowedValues,
  parseAllowedTokens,
  parseAllowedTimes,
  parseNilValues,
  parseQuality,
} from './index.js';

import type {
  AnyComponent,
  DataRecord,
  DataField,
  DataArray,
  Vector,
  Matrix,
  DataChoice,
  SweGeometry,
  DataEncoding,
  ValidationResult,
  ValidationError,
  UnitOfMeasure,
  AllowedValues,
  AllowedTokens,
} from './index.js';

// ========================================
// Export Accessibility — Main Parser
// ========================================

describe('SWE Common index — main parser exports', () => {
  it('exports parseSWEComponent as a callable function', () => {
    expect(typeof parseSWEComponent).toBe('function');
    const result = parseSWEComponent({ type: 'Boolean', value: true });
    expect(result.type).toBe('Boolean');
  });

  it('exports detectEncoding as a callable function', () => {
    expect(typeof detectEncoding).toBe('function');
    const enc = detectEncoding({ encoding: { type: 'JSONEncoding' } });
    expect(enc!.type).toBe('JSONEncoding');
  });

  it('exports validateAgainstSchema as a callable function', () => {
    expect(typeof validateAgainstSchema).toBe('function');
    const schema = parseSWEComponent({ type: 'Boolean' });
    const result = validateAgainstSchema(true, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ========================================
// Export Accessibility — Complex Component Parsers
// ========================================

describe('SWE Common index — complex component parser exports', () => {
  it('exports parseVector', () => {
    expect(typeof parseVector).toBe('function');
  });

  it('exports parseMatrix', () => {
    expect(typeof parseMatrix).toBe('function');
  });

  it('exports parseDataChoice', () => {
    expect(typeof parseDataChoice).toBe('function');
  });

  it('exports parseGeometry', () => {
    expect(typeof parseGeometry).toBe('function');
  });
});

// ========================================
// Export Accessibility — Sub-Parsers
// ========================================

describe('SWE Common index — sub-parser exports', () => {
  it('exports parseSimpleComponent as a callable function', () => {
    expect(typeof parseSimpleComponent).toBe('function');
    const result = parseSimpleComponent({ type: 'Count', value: 7 });
    expect(result.type).toBe('Count');
  });

  it('exports parseDataRecord as a callable function', () => {
    expect(typeof parseDataRecord).toBe('function');
    const rec = parseDataRecord({
      type: 'DataRecord',
      fields: [{ name: 'x', type: 'Text', value: 'hi' }],
    });
    expect(rec.type).toBe('DataRecord');
  });

  it('exports parseDataArray as a callable function', () => {
    expect(typeof parseDataArray).toBe('function');
    const arr = parseDataArray({
      type: 'DataArray',
      elementType: { name: 'v', type: 'Quantity', uom: { code: 'm' } },
    });
    expect(arr.type).toBe('DataArray');
  });

  it('exports parseEncoding as a callable function', () => {
    expect(typeof parseEncoding).toBe('function');
    const enc = parseEncoding({ type: 'JSONEncoding' });
    expect(enc.type).toBe('JSONEncoding');
  });

  it('exports decodeValues as a callable function', () => {
    expect(typeof decodeValues).toBe('function');
  });

  it('exports SweCommonParseError class', () => {
    expect(typeof SweCommonParseError).toBe('function');
    const err = new SweCommonParseError('test', 'path');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SweCommonParseError');
  });
});

// ========================================
// Export Accessibility — Utility Parsers
// ========================================

describe('SWE Common index — utility parser exports', () => {
  it('exports parseUnitOfMeasure', () => {
    expect(typeof parseUnitOfMeasure).toBe('function');
  });

  it('exports parseAllowedValues', () => {
    expect(typeof parseAllowedValues).toBe('function');
  });

  it('exports parseAllowedTokens', () => {
    expect(typeof parseAllowedTokens).toBe('function');
  });

  it('exports parseAllowedTimes', () => {
    expect(typeof parseAllowedTimes).toBe('function');
  });

  it('exports parseNilValues', () => {
    expect(typeof parseNilValues).toBe('function');
  });

  it('exports parseQuality', () => {
    expect(typeof parseQuality).toBe('function');
  });
});

// ========================================
// Named Exports — Tree-Shaking Friendly
// ========================================

describe('SWE Common index — tree-shaking friendliness', () => {
  it('uses named exports (no default export)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const indexModule = require('./index.js');
    expect(indexModule.default).toBeUndefined();
  });

  it('all parser functions are named exports', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const indexModule = require('./index.js');
    expect(indexModule.parseSWEComponent).toBe(parseSWEComponent);
    expect(indexModule.parseSimpleComponent).toBe(parseSimpleComponent);
    expect(indexModule.parseDataRecord).toBe(parseDataRecord);
    expect(indexModule.parseDataArray).toBe(parseDataArray);
    expect(indexModule.parseEncoding).toBe(parseEncoding);
    expect(indexModule.decodeValues).toBe(decodeValues);
    expect(indexModule.detectEncoding).toBe(detectEncoding);
    expect(indexModule.validateAgainstSchema).toBe(validateAgainstSchema);
  });
});
