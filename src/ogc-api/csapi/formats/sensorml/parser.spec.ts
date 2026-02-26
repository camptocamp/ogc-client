/**
 * Tests for the SensorML 3.0 Main Parser.
 *
 * Validates type discrimination and dispatch, capability/characteristic
 * list parsing, shared property-group helpers, and error handling.
 *
 * @see parseSensorML30
 * @see parseCapabilityList
 * @see parseCharacteristicList
 */

import {
  parseSensorML30,
  parseCapabilityList,
  parseCharacteristicList,
  parseDescribedObjectProperties,
  parseAbstractProcessProperties,
  parseAbstractPhysicalProcessProperties,
  SensorMLParseError,
} from './parser.js';

// ========================================
// Fixtures
// ========================================

/** Minimal valid SimpleProcess. */
const SIMPLE_PROCESS = {
  type: 'SimpleProcess',
  label: 'Linear Interpolation',
  uniqueId: 'urn:example:process:linear-interp',
};

/** Minimal valid AggregateProcess. */
const AGGREGATE_PROCESS = {
  type: 'AggregateProcess',
  label: 'Multi-Sensor Fusion',
  uniqueId: 'urn:example:process:fusion',
};

/** Minimal valid PhysicalComponent. */
const PHYSICAL_COMPONENT = {
  type: 'PhysicalComponent',
  label: 'Temperature Sensor',
  uniqueId: 'urn:example:component:temp',
};

/** Minimal valid PhysicalSystem. */
const PHYSICAL_SYSTEM = {
  type: 'PhysicalSystem',
  label: 'Weather Station',
  uniqueId: 'urn:example:system:weather',
};

/** PhysicalSystem with nested components for recursive parsing. */
const NESTED_PHYSICAL_SYSTEM = {
  type: 'PhysicalSystem',
  label: 'Autonomous Weather Station',
  uniqueId: 'urn:example:system:auto-weather',
  components: [
    {
      name: 'tempSensor',
      type: 'PhysicalComponent',
      label: 'Temperature Probe',
      uniqueId: 'urn:example:component:temp-probe',
    },
    {
      name: 'subsystem',
      type: 'PhysicalSystem',
      label: 'Wind Measurement Subsystem',
      uniqueId: 'urn:example:system:wind-subsys',
      components: [
        {
          name: 'anemometer',
          type: 'PhysicalComponent',
          label: 'Anemometer',
          uniqueId: 'urn:example:component:anemometer',
        },
      ],
    },
  ],
};

/** AggregateProcess with nested components. */
const NESTED_AGGREGATE = {
  type: 'AggregateProcess',
  label: 'Sensor Fusion Pipeline',
  uniqueId: 'urn:example:process:fusion-pipeline',
  components: [
    {
      name: 'filter',
      type: 'SimpleProcess',
      label: 'Low-Pass Filter',
      uniqueId: 'urn:example:process:lowpass',
    },
  ],
};

/** CapabilityList with full structure. */
const CAPABILITY_LIST = {
  id: 'cap-range',
  label: 'Measurement Capabilities',
  description: 'Range and accuracy of the sensor',
  definition:
    'http://www.opengis.net/def/property/OGC/0/MeasurementCapabilities',
  conditions: [
    { type: 'Quantity', name: 'temperature', label: 'Ambient Temperature' },
  ],
  capabilities: [
    { name: 'range', type: 'QuantityRange', label: 'Measurement Range' },
    { name: 'accuracy', type: 'Quantity', label: 'Accuracy' },
  ],
};

/** CharacteristicList with full structure. */
const CHARACTERISTIC_LIST = {
  id: 'char-phys',
  label: 'Physical Characteristics',
  description: 'Size and weight of the device',
  definition:
    'http://www.opengis.net/def/property/OGC/0/PhysicalCharacteristics',
  characteristics: [
    { name: 'weight', type: 'Quantity', label: 'Weight' },
    { name: 'dimensions', type: 'Vector', label: 'Dimensions' },
  ],
};

// ========================================
// Type Discrimination
// ========================================

describe('parseSensorML30 – type discrimination', () => {
  it('dispatches SimpleProcess to parseSimpleProcess', () => {
    const result = parseSensorML30(SIMPLE_PROCESS);
    expect(result.type).toBe('SimpleProcess');
    expect(result.label).toBe('Linear Interpolation');
    expect(result.uniqueId).toBe('urn:example:process:linear-interp');
  });

  it('dispatches AggregateProcess to parseAggregateProcess', () => {
    const result = parseSensorML30(AGGREGATE_PROCESS);
    expect(result.type).toBe('AggregateProcess');
    expect(result.label).toBe('Multi-Sensor Fusion');
    expect(result.uniqueId).toBe('urn:example:process:fusion');
  });

  it('dispatches PhysicalComponent to parsePhysicalComponent', () => {
    const result = parseSensorML30(PHYSICAL_COMPONENT);
    expect(result.type).toBe('PhysicalComponent');
    expect(result.label).toBe('Temperature Sensor');
    expect(result.uniqueId).toBe('urn:example:component:temp');
  });

  it('dispatches PhysicalSystem to parsePhysicalSystem', () => {
    const result = parseSensorML30(PHYSICAL_SYSTEM);
    expect(result.type).toBe('PhysicalSystem');
    expect(result.label).toBe('Weather Station');
    expect(result.uniqueId).toBe('urn:example:system:weather');
  });

  it('throws SensorMLParseError for unknown type', () => {
    expect(() =>
      parseSensorML30({ type: 'SomethingElse', label: 'x', uniqueId: 'y' })
    ).toThrow(SensorMLParseError);
    expect(() =>
      parseSensorML30({ type: 'SomethingElse', label: 'x', uniqueId: 'y' })
    ).toThrow(/Unknown SensorML process type/);
  });

  it('throws SensorMLParseError when type is missing', () => {
    expect(() => parseSensorML30({ label: 'x', uniqueId: 'y' })).toThrow(
      SensorMLParseError
    );
    expect(() => parseSensorML30({ label: 'x', uniqueId: 'y' })).toThrow(
      /string "type" property/
    );
  });

  it('throws SensorMLParseError for null input', () => {
    expect(() => parseSensorML30(null)).toThrow(SensorMLParseError);
    expect(() => parseSensorML30(null)).toThrow(/non-null object/);
  });

  it('throws SensorMLParseError for undefined input', () => {
    expect(() => parseSensorML30(undefined)).toThrow(SensorMLParseError);
  });

  it('throws SensorMLParseError for non-object input', () => {
    expect(() => parseSensorML30('string')).toThrow(SensorMLParseError);
    expect(() => parseSensorML30(42)).toThrow(SensorMLParseError);
    expect(() => parseSensorML30([])).toThrow(SensorMLParseError);
  });
});

// ========================================
// Recursive Parsing
// ========================================

describe('parseSensorML30 – recursive parsing', () => {
  it('parses PhysicalSystem with nested components', () => {
    const result = parseSensorML30(NESTED_PHYSICAL_SYSTEM);
    expect(result.type).toBe('PhysicalSystem');
    if (result.type === 'PhysicalSystem') {
      expect(result.components).toBeDefined();
      expect(result.components).toHaveLength(2);
      expect(result.components![0].name).toBe('tempSensor');
      expect(result.components![1].name).toBe('subsystem');
    }
  });

  it('parses AggregateProcess with nested components', () => {
    const result = parseSensorML30(NESTED_AGGREGATE);
    expect(result.type).toBe('AggregateProcess');
    if (result.type === 'AggregateProcess') {
      expect(result.components).toBeDefined();
      expect(result.components).toHaveLength(1);
      expect(result.components![0].name).toBe('filter');
    }
  });
});

// ========================================
// Capability/Characteristic Parsing
// ========================================

describe('parseCapabilityList', () => {
  it('parses a full CapabilityList', () => {
    const result = parseCapabilityList(CAPABILITY_LIST);
    expect(result.id).toBe('cap-range');
    expect(result.label).toBe('Measurement Capabilities');
    expect(result.description).toBe('Range and accuracy of the sensor');
    expect(result.definition).toBe(
      'http://www.opengis.net/def/property/OGC/0/MeasurementCapabilities'
    );
    expect(result.conditions).toHaveLength(1);
    expect(result.capabilities).toHaveLength(2);
    expect(result.capabilities[0].name).toBe('range');
    expect(result.capabilities[1].name).toBe('accuracy');
  });

  it('parses a minimal CapabilityList', () => {
    const result = parseCapabilityList({ capabilities: [] });
    expect(result.capabilities).toEqual([]);
    expect(result.id).toBeUndefined();
    expect(result.label).toBeUndefined();
    expect(result.conditions).toBeUndefined();
  });

  it('throws for non-object input', () => {
    expect(() => parseCapabilityList(null)).toThrow(SensorMLParseError);
    expect(() => parseCapabilityList('string')).toThrow(SensorMLParseError);
  });

  it('throws for capability entry without name', () => {
    expect(() =>
      parseCapabilityList({
        capabilities: [{ type: 'Quantity' }],
      })
    ).toThrow(SensorMLParseError);
  });
});

describe('parseCharacteristicList', () => {
  it('parses a full CharacteristicList', () => {
    const result = parseCharacteristicList(CHARACTERISTIC_LIST);
    expect(result.id).toBe('char-phys');
    expect(result.label).toBe('Physical Characteristics');
    expect(result.definition).toBe(
      'http://www.opengis.net/def/property/OGC/0/PhysicalCharacteristics'
    );
    expect(result.characteristics).toHaveLength(2);
    expect(result.characteristics[0].name).toBe('weight');
    expect(result.characteristics[1].name).toBe('dimensions');
  });

  it('throws for non-object input', () => {
    expect(() => parseCharacteristicList(null)).toThrow(SensorMLParseError);
  });
});

// ========================================
// Shared Property-Group Helpers
// ========================================

describe('parseDescribedObjectProperties', () => {
  it('extracts DescribedObject-level fields', () => {
    const input: Record<string, unknown> = {
      type: 'PhysicalSystem',
      label: 'Test System',
      uniqueId: 'urn:test:system',
      id: 'sys-1',
      description: 'A description',
      lang: 'en',
      keywords: ['sensor', 'weather'],
      identifiers: [{ label: 'Short Name', value: 'WS1' }],
      classifiers: [{ label: 'Type', value: 'weather-station' }],
      capabilities: [CAPABILITY_LIST],
      characteristics: [CHARACTERISTIC_LIST],
    };
    const result = parseDescribedObjectProperties(input);
    expect(result.type).toBe('PhysicalSystem');
    expect(result.label).toBe('Test System');
    expect(result.uniqueId).toBe('urn:test:system');
    expect(result.id).toBe('sys-1');
    expect(result.description).toBe('A description');
    expect(result.lang).toBe('en');
    expect(result.keywords).toEqual(['sensor', 'weather']);
    expect(result.identifiers).toHaveLength(1);
    expect(result.classifiers).toHaveLength(1);
    expect(result.capabilities).toHaveLength(1);
    expect(result.characteristics).toHaveLength(1);
  });
});

describe('parseAbstractProcessProperties', () => {
  it('extracts AbstractProcess-level fields', () => {
    const input: Record<string, unknown> = {
      definition: 'http://example.org/def/process',
      typeOf: { href: 'http://example.org/base', title: 'Base' },
      inputs: [{ name: 'in1', type: 'Quantity' }],
      outputs: [{ name: 'out1', type: 'Quantity' }],
      parameters: [{ name: 'param1', type: 'Quantity' }],
    };
    const result = parseAbstractProcessProperties(input);
    expect(result.definition).toBe('http://example.org/def/process');
    expect(result.typeOf).toEqual({
      href: 'http://example.org/base',
      title: 'Base',
    });
    expect(result.inputs).toHaveLength(1);
    expect(result.outputs).toHaveLength(1);
    expect(result.parameters).toHaveLength(1);
  });
});

describe('parseAbstractPhysicalProcessProperties', () => {
  it('extracts AbstractPhysicalProcess-level fields', () => {
    const input: Record<string, unknown> = {
      attachedTo: { href: 'http://example.org/platform' },
      localReferenceFrames: [{ id: 'BODY_FRAME' }],
      localTimeFrames: [{ id: 'SENSOR_TIME' }],
    };
    const result = parseAbstractPhysicalProcessProperties(input);
    expect(result.attachedTo).toEqual({
      href: 'http://example.org/platform',
    });
    expect(result.localReferenceFrames).toHaveLength(1);
    expect(result.localTimeFrames).toHaveLength(1);
  });
});

// ========================================
// Error Handling
// ========================================

describe('SensorMLParseError – path property', () => {
  it('includes path when provided', () => {
    try {
      parseSensorML30({ type: 'SomethingElse', label: 'x', uniqueId: 'y' });
    } catch (err) {
      expect(err).toBeInstanceOf(SensorMLParseError);
      expect((err as SensorMLParseError).path).toBe('type');
    }
  });

  it('includes path for missing type', () => {
    try {
      parseSensorML30({ label: 'x', uniqueId: 'y' });
    } catch (err) {
      expect(err).toBeInstanceOf(SensorMLParseError);
      expect((err as SensorMLParseError).path).toBe('type');
    }
  });

  it('has no path for non-object input', () => {
    try {
      parseSensorML30(null);
    } catch (err) {
      expect(err).toBeInstanceOf(SensorMLParseError);
      expect((err as SensorMLParseError).path).toBeUndefined();
    }
  });
});
