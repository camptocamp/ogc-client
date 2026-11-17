/**
 * Tests for the SensorML 3.0 barrel file (`index.ts`).
 *
 * Verifies that all public API surface exports resolve correctly:
 * runtime values are callable/instantiable, and the const array
 * contains the expected process type strings.
 *
 * @see index.ts
 */

import {
  parseSensorML30,
  SensorMLParseError,
  parseCapabilityList,
  parseCharacteristicList,
  parseDescribedObjectProperties,
  parseAbstractProcessProperties,
  parseAbstractPhysicalProcessProperties,
  parsePosition,
  SENSORML_PROCESS_TYPES,
} from './index.js';

// ========================================
// Runtime Value Exports
// ========================================

describe('SensorML index – runtime exports', () => {
  it('exports parseSensorML30 as a function', () => {
    expect(typeof parseSensorML30).toBe('function');
  });

  it('exports SensorMLParseError as a constructable class', () => {
    const error = new SensorMLParseError('test');
    expect(error).toBeInstanceOf(SensorMLParseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('SensorMLParseError');
    expect(error.message).toBe('test');
  });

  it('exports SensorMLParseError with optional path property', () => {
    const error = new SensorMLParseError('test', 'type');
    expect(error.path).toBe('type');
  });

  it('exports parseCapabilityList as a function', () => {
    expect(typeof parseCapabilityList).toBe('function');
  });

  it('exports parseCharacteristicList as a function', () => {
    expect(typeof parseCharacteristicList).toBe('function');
  });

  it('exports parseDescribedObjectProperties as a function', () => {
    expect(typeof parseDescribedObjectProperties).toBe('function');
  });

  it('exports parseAbstractProcessProperties as a function', () => {
    expect(typeof parseAbstractProcessProperties).toBe('function');
  });

  it('exports parseAbstractPhysicalProcessProperties as a function', () => {
    expect(typeof parseAbstractPhysicalProcessProperties).toBe('function');
  });

  it('exports parsePosition as a function', () => {
    expect(typeof parsePosition).toBe('function');
  });

  it('exports SENSORML_PROCESS_TYPES with all 4 process types', () => {
    expect(SENSORML_PROCESS_TYPES).toEqual([
      'SimpleProcess',
      'AggregateProcess',
      'PhysicalComponent',
      'PhysicalSystem',
    ]);
  });
});

// ========================================
// Integration: exports work end-to-end
// ========================================

describe('SensorML index – integration', () => {
  it('parseSensorML30 parses a minimal SimpleProcess', () => {
    const result = parseSensorML30({
      type: 'SimpleProcess',
      label: 'Test',
      uniqueId: 'urn:test:simple',
    });
    expect(result.type).toBe('SimpleProcess');
    expect(result.label).toBe('Test');
  });

  it('parseSensorML30 throws SensorMLParseError for invalid input', () => {
    expect(() => parseSensorML30(null)).toThrow(SensorMLParseError);
  });
});
