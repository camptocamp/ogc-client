/**
 * Type compilation and discriminator tests for SensorML 3.0 types.
 *
 * These tests verify that:
 * - All interfaces compile correctly and are importable
 * - The `SensorMLProcess` discriminated union resolves via `type`
 * - SWE Common integration types compile (AnyProperty, IOComponentChoice)
 * - Base-interface inheritance chains are structurally correct
 */

import type {
  // Metadata
  Term,
  Document,
  ResponsibleParty,
  ObservableProperty,
  // Property lists
  AnyProperty,
  CapabilityList,
  CharacteristicList,
  // I/O
  IOComponentChoice,
  // Configuration
  Settings,
  // Spatial / temporal
  SpatialFrame,
  Position,
  // Event / features
  Event,
  // Base interfaces
  DescribedObject,
  Mode,
  AbstractProcess,
  // Union & constants
  SensorMLProcess,
  SensorMLProcessType,
  // Component / connection
  ComponentEntry,
  Connection,
} from './types.js';

import { SENSORML_PROCESS_TYPES } from './types.js';

// ========================================
// SensorMLProcess Discriminated Union
// ========================================

describe('SensorMLProcess discriminated union', () => {
  it('narrows to SimpleProcess via type discriminator', () => {
    const proc: SensorMLProcess = {
      type: 'SimpleProcess',
      label: 'Linear Interpolation',
      uniqueId: 'urn:example:process:linear-interp',
      method: { description: 'Linear interpolation between two values' },
    };
    expect(proc.type).toBe('SimpleProcess');
    if (proc.type === 'SimpleProcess') {
      expect(proc.method?.description).toContain('interpolation');
    }
  });

  it('narrows to AggregateProcess via type discriminator', () => {
    const proc: SensorMLProcess = {
      type: 'AggregateProcess',
      label: 'Processing Chain',
      uniqueId: 'urn:example:process:chain-1',
    };
    expect(proc.type).toBe('AggregateProcess');
    if (proc.type === 'AggregateProcess') {
      // components and connections are optional
      expect(proc.components).toBeUndefined();
      expect(proc.connections).toBeUndefined();
    }
  });

  it('narrows to PhysicalComponent via type discriminator', () => {
    const proc: SensorMLProcess = {
      type: 'PhysicalComponent',
      label: 'Temperature Sensor',
      uniqueId: 'urn:example:sensor:temp-001',
    };
    expect(proc.type).toBe('PhysicalComponent');
    if (proc.type === 'PhysicalComponent') {
      // physical process properties available
      expect(proc.attachedTo).toBeUndefined();
      expect(proc.position).toBeUndefined();
    }
  });

  it('narrows to PhysicalSystem via type discriminator', () => {
    const proc: SensorMLProcess = {
      type: 'PhysicalSystem',
      label: 'Weather Station Alpha',
      uniqueId: 'urn:example:system:weather-alpha',
    };
    expect(proc.type).toBe('PhysicalSystem');
    if (proc.type === 'PhysicalSystem') {
      expect(proc.components).toBeUndefined();
      expect(proc.connections).toBeUndefined();
      expect(proc.localReferenceFrames).toBeUndefined();
    }
  });

  it('exhaustively handles all four types in a switch', () => {
    // Use a helper to avoid TypeScript narrowing the literal from the object
    function checkExhaustive(proc: SensorMLProcess): string {
      switch (proc.type) {
        case 'SimpleProcess':
          return 'simple';
        case 'AggregateProcess':
          return 'aggregate';
        case 'PhysicalComponent':
          return 'component';
        case 'PhysicalSystem':
          return 'system';
      }
    }
    const proc: SensorMLProcess = {
      type: 'SimpleProcess',
      label: 'Test',
      uniqueId: 'urn:test',
    };
    expect(checkExhaustive(proc)).toBe('simple');
  });
});

// ========================================
// SensorMLProcessType Literal Union
// ========================================

describe('SensorMLProcessType and SENSORML_PROCESS_TYPES', () => {
  it('derives type literal from union', () => {
    const t: SensorMLProcessType = 'SimpleProcess';
    expect(t).toBe('SimpleProcess');
  });

  it('const tuple contains all four values', () => {
    expect(SENSORML_PROCESS_TYPES).toEqual([
      'SimpleProcess',
      'AggregateProcess',
      'PhysicalComponent',
      'PhysicalSystem',
    ]);
    expect(SENSORML_PROCESS_TYPES).toHaveLength(4);
  });
});

// ========================================
// Base Interface Compilation
// ========================================

describe('base interface compilation', () => {
  it('compiles DescribedObject with all optional fields', () => {
    const obj: DescribedObject = {
      type: 'SomeType',
      label: 'Test Object',
      uniqueId: 'urn:example:test',
      lang: 'en',
      keywords: ['test', 'example'],
      identifiers: [{ label: 'Serial', value: 'SN-12345' }],
      classifiers: [
        {
          label: 'Category',
          value: 'sensor',
          definition: 'http://example.com/cat',
        },
      ],
      validTime: ['2024-01-01T00:00:00Z', '2025-01-01T00:00:00Z'],
    };
    expect(obj.type).toBe('SomeType');
    expect(obj.label).toBe('Test Object');
    expect(obj.uniqueId).toBe('urn:example:test');
    expect(obj.keywords).toHaveLength(2);
    expect(obj.validTime).toHaveLength(2);
  });

  it('compiles Mode extending DescribedObject', () => {
    const mode: Mode = {
      type: 'Mode',
      label: 'Low Power',
      uniqueId: 'urn:example:mode:low-power',
      configuration: {
        setStatus: [{ ref: 'outputs/highRes', value: 'disabled' }],
      },
    };
    expect(mode.label).toBe('Low Power');
    expect(mode.configuration?.setStatus).toHaveLength(1);
  });

  it('compiles AbstractProcess with I/O', () => {
    const proc: AbstractProcess = {
      type: 'SomeProcess',
      label: 'Test Process',
      uniqueId: 'urn:example:proc',
      definition: 'http://example.com/proc-type',
      inputs: [
        {
          name: 'rawTemp',
          type: 'Quantity',
          uom: { code: 'Cel' },
        } as IOComponentChoice,
      ],
      outputs: [
        {
          name: 'calibTemp',
          type: 'Quantity',
          uom: { code: 'Cel' },
        } as IOComponentChoice,
      ],
    };
    expect(proc.definition).toBe('http://example.com/proc-type');
    expect(proc.inputs).toHaveLength(1);
    expect(proc.outputs).toHaveLength(1);
  });
});

// ========================================
// Supporting Types Compilation
// ========================================

describe('supporting types compilation', () => {
  it('compiles Term', () => {
    const term: Term = {
      label: 'Manufacturer',
      value: 'Acme Corp',
      definition: 'http://example.com/manufacturer',
      codeSpace: 'http://example.com/cs/manufacturers',
    };
    expect(term.label).toBe('Manufacturer');
    expect(term.value).toBe('Acme Corp');
  });

  it('compiles Document', () => {
    const doc: Document = {
      name: 'Datasheet',
      link: { href: 'https://example.com/datasheet.pdf' },
      role: 'http://example.com/doc/datasheet',
    };
    expect(doc.name).toBe('Datasheet');
    expect(doc.link.href).toContain('datasheet');
  });

  it('compiles ResponsibleParty', () => {
    const contact: ResponsibleParty = {
      organisationName: 'OGC',
      role: 'http://example.com/role/operator',
      contactInfo: {
        address: { city: 'Arlington', country: 'US' },
      },
    };
    expect(contact.role).toContain('operator');
    expect(contact.contactInfo?.address?.city).toBe('Arlington');
  });

  it('compiles ObservableProperty', () => {
    const prop: ObservableProperty = {
      type: 'ObservableProperty',
      definition: 'http://qudt.org/vocab/quantitykind/Temperature',
      label: 'Air Temperature',
    };
    expect(prop.type).toBe('ObservableProperty');
    expect(prop.definition).toContain('Temperature');
  });

  it('compiles Settings with all entry types', () => {
    const settings: Settings = {
      setValues: [{ ref: 'parameters/gain', value: 2.5 }],
      setArrayValues: [
        { ref: 'parameters/coefficients', value: [1.0, 0.5, 0.1] },
      ],
      setModes: [{ ref: 'modes', value: 'highPrecision' }],
      setConstraints: [
        { type: 'AllowedValues', ref: 'outputs/temp', min: -10, max: 50 },
      ],
      setStatus: [{ ref: 'outputs/humidity', value: 'disabled' }],
    };
    expect(settings.setValues).toHaveLength(1);
    expect(settings.setModes).toHaveLength(1);
    expect(settings.setStatus?.[0].value).toBe('disabled');
  });

  it('compiles Connection', () => {
    const conn: Connection = {
      source: 'components/sensor1/outputs/temperature',
      destination: 'outputs/temperature',
    };
    expect(conn.source).toContain('sensor1');
    expect(conn.destination).toBe('outputs/temperature');
  });

  it('compiles Event', () => {
    const event: Event = {
      label: 'Annual Calibration',
      time: ['2024-06-15T00:00:00Z'],
      definition: 'http://example.com/event/calibration',
    };
    expect(event.label).toBe('Annual Calibration');
    expect(event.time).toHaveLength(1);
  });

  it('compiles SpatialFrame', () => {
    const frame: SpatialFrame = {
      origin: 'Center of the sensor housing',
      axes: [
        { name: 'X', description: 'Points forward' },
        { name: 'Y', description: 'Points right' },
        { name: 'Z', description: 'Points down' },
      ],
    };
    expect(frame.origin).toContain('sensor');
    expect(frame.axes).toHaveLength(3);
  });
});

// ========================================
// SWE Common Integration
// ========================================

describe('SWE Common integration', () => {
  it('compiles CapabilityList with SWE components', () => {
    const caps: CapabilityList = {
      label: 'Measurement Capabilities',
      capabilities: [
        {
          name: 'measurementRange',
          type: 'QuantityRange',
          uom: { code: 'Cel' },
          value: [-40, 85],
        } as unknown as AnyProperty,
        {
          name: 'accuracy',
          type: 'Quantity',
          uom: { code: 'Cel' },
          value: 0.5,
        } as unknown as AnyProperty,
      ],
    };
    expect(caps.capabilities).toHaveLength(2);
    expect(caps.capabilities[0].name).toBe('measurementRange');
  });

  it('compiles CharacteristicList with SWE components', () => {
    const chars: CharacteristicList = {
      label: 'Physical Properties',
      characteristics: [
        {
          name: 'weight',
          type: 'Quantity',
          uom: { code: 'kg' },
          value: 0.25,
        } as unknown as AnyProperty,
      ],
    };
    expect(chars.characteristics).toHaveLength(1);
    expect(chars.characteristics[0].name).toBe('weight');
  });

  it('compiles GeoJsonPoint position variant', () => {
    const pos: Position = {
      type: 'Point',
      coordinates: [-77.0364, 38.8951],
    };
    expect(typeof pos).toBe('object');
  });

  it('compiles ComponentEntry with inline process', () => {
    const entry: ComponentEntry = {
      name: 'tempSensor',
      type: 'PhysicalComponent',
      label: 'Temperature Sensor',
      uniqueId: 'urn:example:sensor:temp-001',
    };
    expect(entry.name).toBe('tempSensor');
  });

  it('compiles ComponentEntry with link reference', () => {
    const entry: ComponentEntry = {
      name: 'remoteSensor',
      type: 'Link',
      href: 'https://example.com/api/systems/sensor-1',
    };
    expect(entry.name).toBe('remoteSensor');
  });
});
