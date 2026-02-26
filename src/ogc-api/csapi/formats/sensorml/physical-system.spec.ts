/**
 * Tests for the SensorML 3.0 PhysicalSystem & PhysicalComponent sub-parser.
 *
 * Validates parsing of all AbstractProcess-level properties, the
 * AbstractPhysicalProcess-level properties (attachedTo, localReferenceFrames,
 * localTimeFrames, position), the PhysicalSystem-specific `components` and
 * `connections` properties, the PhysicalComponent-specific `method` property,
 * position parsing (all variants), frame parsing, and error handling.
 *
 * @see parsePhysicalSystem
 * @see parsePhysicalComponent
 */

import {
  parsePhysicalSystem,
  parsePhysicalComponent,
  parseProcessMethod,
  parsePosition,
  parseComponentList,
  parseConnectionList,
  parseComponentEntry,
  SensorMLParseError,
} from './physical-system.js';

// ========================================
// Fixtures
// ========================================

/** Minimal valid PhysicalSystem — only required fields. */
const MINIMAL_PHYSICAL_SYSTEM = {
  type: 'PhysicalSystem',
  label: 'Weather Station Alpha',
  uniqueId: 'urn:example:system:weather-alpha',
};

/** Minimal valid PhysicalComponent — only required fields. */
const MINIMAL_PHYSICAL_COMPONENT = {
  type: 'PhysicalComponent',
  label: 'Temperature Sensor',
  uniqueId: 'urn:example:component:temp-sensor',
};

/** Full PhysicalSystem with all optional properties populated. */
const FULL_PHYSICAL_SYSTEM = {
  type: 'PhysicalSystem',
  label: 'Autonomous Weather Station',
  uniqueId: 'urn:example:system:auto-weather',
  description: 'Multi-sensor autonomous weather monitoring platform',
  id: 'sys-001',
  lang: 'en',
  keywords: ['weather', 'autonomous', 'multi-sensor'],
  definition: 'http://www.opengis.net/def/system/weather-station',
  typeOf: {
    href: 'http://example.org/systems/base-weather',
    title: 'Base Weather Platform',
  },
  configuration: {
    setValues: [{ ref: 'parameters/pollingInterval', value: 30 }],
  },
  featuresOfInterest: [
    {
      href: 'http://example.org/features/site-A',
      title: 'Observation Site A',
    },
  ],
  inputs: [
    {
      name: 'ambientTemperature',
      type: 'Quantity',
      label: 'Ambient Temperature',
      uom: { code: 'degC' },
    },
  ],
  outputs: [
    {
      name: 'weatherReport',
      type: 'DataRecord',
      label: 'Weather Report',
    },
  ],
  parameters: [
    {
      name: 'pollingInterval',
      type: 'Count',
      label: 'Polling Interval (s)',
      value: 30,
    },
  ],
  modes: [
    {
      type: 'Mode',
      label: 'Storm Mode',
      uniqueId: 'urn:example:mode:storm',
      configuration: {
        setValues: [{ ref: 'parameters/pollingInterval', value: 5 }],
      },
    },
  ],
  attachedTo: {
    href: 'http://example.org/platforms/tower-1',
    title: 'Tower 1',
  },
  localReferenceFrames: [
    {
      id: 'srf-body',
      label: 'Body Frame',
      origin: 'Center of the instrument enclosure',
      axes: [
        { name: 'X', description: 'Pointing North' },
        { name: 'Y', description: 'Pointing East' },
        { name: 'Z', description: 'Pointing Up' },
      ],
    },
  ],
  localTimeFrames: [
    {
      id: 'tf-boot',
      label: 'Boot Time',
      origin: 'Time of last system boot (GPS epoch)',
    },
  ],
  position: {
    type: 'Point',
    coordinates: [-105.2705, 40.015, 1624],
  },
  components: [
    {
      name: 'tempSensor',
      type: 'PhysicalComponent',
      label: 'Temperature Sensor',
      uniqueId: 'urn:example:component:temp-001',
    },
    {
      name: 'windSensor',
      type: 'PhysicalComponent',
      label: 'Wind Speed Sensor',
      uniqueId: 'urn:example:component:wind-001',
    },
  ],
  connections: [
    {
      source: 'components/tempSensor/outputs/temperature',
      destination: 'outputs/weatherReport/fields/temperature',
    },
    {
      source: 'components/windSensor/outputs/speed',
      destination: 'outputs/weatherReport/fields/windSpeed',
    },
  ],
  identifiers: [
    {
      label: 'Serial Number',
      value: 'WS-2026-001',
      definition: 'urn:ogc:def:identifier:serialNumber',
    },
  ],
  classifiers: [
    {
      label: 'Platform Type',
      value: 'WeatherStation',
      definition: 'urn:ogc:def:classifier:platformType',
    },
  ],
  validTime: ['2024-01-01T00:00:00Z', 'now'],
};

/** Full PhysicalComponent with all optional properties populated. */
const FULL_PHYSICAL_COMPONENT = {
  type: 'PhysicalComponent',
  label: 'Thermistor Probe',
  uniqueId: 'urn:example:component:thermistor',
  description: 'High-precision thermistor temperature probe',
  id: 'comp-001',
  lang: 'en',
  keywords: ['thermistor', 'temperature'],
  definition: 'http://www.opengis.net/def/sensor/thermistor',
  typeOf: {
    href: 'http://example.org/sensors/base-thermistor',
    title: 'Base Thermistor',
  },
  configuration: {
    setValues: [{ ref: 'parameters/gain', value: 1.02 }],
  },
  featuresOfInterest: [
    {
      href: 'http://example.org/features/inlet',
      title: 'Air Inlet',
    },
  ],
  inputs: [
    {
      name: 'resistance',
      type: 'Quantity',
      label: 'Resistance',
      uom: { code: 'Ohm' },
    },
  ],
  outputs: [
    {
      name: 'temperature',
      type: 'Quantity',
      label: 'Temperature',
      uom: { code: 'degC' },
    },
  ],
  parameters: [
    {
      name: 'gain',
      type: 'Quantity',
      label: 'Calibration Gain',
      value: 1.02,
    },
  ],
  modes: [
    {
      type: 'Mode',
      label: 'High Resolution',
      uniqueId: 'urn:example:mode:hires',
    },
  ],
  attachedTo: {
    href: 'http://example.org/systems/weather-alpha',
    title: 'Weather Station Alpha',
  },
  localReferenceFrames: [
    {
      origin: 'Tip of the probe',
      axes: [{ name: 'X', description: 'Along probe axis' }],
    },
  ],
  localTimeFrames: [
    {
      origin: 'Calibration epoch (2024-06-15T00:00:00Z)',
    },
  ],
  position: 'Mounted 2m above ground on north side of enclosure',
  method: {
    algorithm: {
      language: 'Python',
      code: 'T = 1/(A + B*ln(R) + C*(ln(R))**3)',
    },
    description: 'Steinhart-Hart thermistor equation',
  },
  identifiers: [
    {
      label: 'Serial Number',
      value: 'TH-2024-042',
      definition: 'urn:ogc:def:identifier:serialNumber',
    },
  ],
  classifiers: [
    {
      label: 'Sensor Type',
      value: 'Thermistor',
      definition: 'urn:ogc:def:classifier:sensorType',
    },
  ],
};

// ========================================
// parsePhysicalSystem — Valid Documents
// ========================================

describe('parsePhysicalSystem', () => {
  describe('valid documents', () => {
    it('parses a minimal PhysicalSystem with only required fields', () => {
      const result = parsePhysicalSystem(MINIMAL_PHYSICAL_SYSTEM);
      expect(result.type).toBe('PhysicalSystem');
      expect(result.label).toBe('Weather Station Alpha');
      expect(result.uniqueId).toBe('urn:example:system:weather-alpha');
      expect(result.components).toBeUndefined();
      expect(result.connections).toBeUndefined();
      expect(result.attachedTo).toBeUndefined();
      expect(result.localReferenceFrames).toBeUndefined();
      expect(result.localTimeFrames).toBeUndefined();
      expect(result.position).toBeUndefined();
      expect(result.inputs).toBeUndefined();
      expect(result.outputs).toBeUndefined();
      expect(result.parameters).toBeUndefined();
      expect(result.modes).toBeUndefined();
      expect(result.definition).toBeUndefined();
      expect(result.typeOf).toBeUndefined();
      expect(result.configuration).toBeUndefined();
      expect(result.featuresOfInterest).toBeUndefined();
    });

    it('parses a full PhysicalSystem with all optional properties', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.type).toBe('PhysicalSystem');
      expect(result.label).toBe('Autonomous Weather Station');
      expect(result.uniqueId).toBe('urn:example:system:auto-weather');
      expect(result.description).toBe(
        'Multi-sensor autonomous weather monitoring platform'
      );
      expect(result.definition).toBe(
        'http://www.opengis.net/def/system/weather-station'
      );
    });

    it('parses typeOf as a Link', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.typeOf).toBeDefined();
      expect(result.typeOf!.href).toBe(
        'http://example.org/systems/base-weather'
      );
      expect(result.typeOf!.title).toBe('Base Weather Platform');
    });

    it('parses configuration (Settings)', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.configuration).toBeDefined();
      expect(result.configuration!.setValues).toHaveLength(1);
      expect(result.configuration!.setValues![0].ref).toBe(
        'parameters/pollingInterval'
      );
    });

    it('parses featuresOfInterest as a FeatureList', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.featuresOfInterest).toBeDefined();
      expect(result.featuresOfInterest).toHaveLength(1);
      expect(result.featuresOfInterest![0].href).toBe(
        'http://example.org/features/site-A'
      );
    });

    it('parses inputs, outputs, and parameters', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.inputs).toHaveLength(1);
      expect(result.inputs![0].name).toBe('ambientTemperature');
      expect(result.outputs).toHaveLength(1);
      expect(result.outputs![0].name).toBe('weatherReport');
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters![0].name).toBe('pollingInterval');
    });

    it('parses modes', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.modes).toBeDefined();
      expect(result.modes).toHaveLength(1);
      expect(result.modes![0].label).toBe('Storm Mode');
    });

    it('preserves DescribedObject passthrough properties', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.id).toBe('sys-001');
      expect(result.lang).toBe('en');
      expect(result.keywords).toEqual([
        'weather',
        'autonomous',
        'multi-sensor',
      ]);
      expect(result.identifiers).toHaveLength(1);
      expect(result.classifiers).toHaveLength(1);
      expect(result.validTime).toEqual(['2024-01-01T00:00:00Z', 'now']);
    });
  });

  // ========================================
  // parsePhysicalSystem — AbstractPhysicalProcess Properties
  // ========================================

  describe('AbstractPhysicalProcess properties', () => {
    it('parses attachedTo as a Link', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.attachedTo).toBeDefined();
      expect(result.attachedTo!.href).toBe(
        'http://example.org/platforms/tower-1'
      );
      expect(result.attachedTo!.title).toBe('Tower 1');
    });

    it('parses localReferenceFrames', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.localReferenceFrames).toBeDefined();
      expect(result.localReferenceFrames).toHaveLength(1);
      const frame = result.localReferenceFrames![0];
      expect(frame.id).toBe('srf-body');
      expect(frame.label).toBe('Body Frame');
      expect(frame.origin).toBe('Center of the instrument enclosure');
      expect(frame.axes).toHaveLength(3);
      expect(frame.axes[0]).toEqual({
        name: 'X',
        description: 'Pointing North',
      });
    });

    it('parses localTimeFrames', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.localTimeFrames).toBeDefined();
      expect(result.localTimeFrames).toHaveLength(1);
      const frame = result.localTimeFrames![0];
      expect(frame.id).toBe('tf-boot');
      expect(frame.label).toBe('Boot Time');
      expect(frame.origin).toBe('Time of last system boot (GPS epoch)');
    });

    it('parses position as a GeoJSON Point', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.position).toBeDefined();
      expect((result.position as any).type).toBe('Point');
      expect((result.position as any).coordinates).toEqual([
        -105.2705, 40.015, 1624,
      ]);
    });
  });

  // ========================================
  // parsePhysicalSystem — Components & Connections
  // ========================================

  describe('components and connections', () => {
    it('parses components as a ComponentList', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.components).toBeDefined();
      expect(result.components).toHaveLength(2);
      expect(result.components![0].name).toBe('tempSensor');
      expect(result.components![0].type).toBe('PhysicalComponent');
      expect(result.components![1].name).toBe('windSensor');
    });

    it('parses connections as a ConnectionList', () => {
      const result = parsePhysicalSystem(FULL_PHYSICAL_SYSTEM);
      expect(result.connections).toBeDefined();
      expect(result.connections).toHaveLength(2);
      expect(result.connections![0].source).toBe(
        'components/tempSensor/outputs/temperature'
      );
      expect(result.connections![0].destination).toBe(
        'outputs/weatherReport/fields/temperature'
      );
    });

    it('handles external link components', () => {
      const result = parsePhysicalSystem({
        ...MINIMAL_PHYSICAL_SYSTEM,
        components: [
          {
            name: 'externalSensor',
            type: 'Link',
            href: 'http://example.org/sensors/ext-1',
          },
        ],
      });
      expect(result.components).toHaveLength(1);
      expect(result.components![0].name).toBe('externalSensor');
      expect(result.components![0].type).toBe('Link');
    });

    it('recursively parses nested PhysicalSystem components', () => {
      const nested = {
        ...MINIMAL_PHYSICAL_SYSTEM,
        components: [
          {
            name: 'subSystem',
            type: 'PhysicalSystem',
            label: 'Sub Station',
            uniqueId: 'urn:example:system:sub-station',
            position: 'Inside main enclosure',
          },
        ],
      };
      const result = parsePhysicalSystem(nested);
      expect(result.components).toHaveLength(1);
      expect(result.components![0].name).toBe('subSystem');
      expect(result.components![0].type).toBe('PhysicalSystem');
      expect((result.components![0] as any).position).toBe(
        'Inside main enclosure'
      );
    });

    it('handles absent components and connections', () => {
      const result = parsePhysicalSystem(MINIMAL_PHYSICAL_SYSTEM);
      expect(result.components).toBeUndefined();
      expect(result.connections).toBeUndefined();
    });
  });

  // ========================================
  // parsePhysicalSystem — Invalid Documents
  // ========================================

  describe('invalid documents', () => {
    it('throws for null input', () => {
      expect(() => parsePhysicalSystem(null)).toThrow(SensorMLParseError);
      expect(() => parsePhysicalSystem(null)).toThrow(
        'PhysicalSystem input must be a non-null object'
      );
    });

    it('throws for non-object input', () => {
      expect(() => parsePhysicalSystem('not-an-object')).toThrow(
        SensorMLParseError
      );
      expect(() => parsePhysicalSystem(42)).toThrow(SensorMLParseError);
    });

    it('throws for array input', () => {
      expect(() => parsePhysicalSystem([])).toThrow(SensorMLParseError);
    });

    it('throws for missing type', () => {
      expect(() =>
        parsePhysicalSystem({ label: 'Test', uniqueId: 'urn:x' })
      ).toThrow('Expected type "PhysicalSystem"');
    });

    it('throws for wrong type value', () => {
      expect(() =>
        parsePhysicalSystem({
          type: 'SimpleProcess',
          label: 'Test',
          uniqueId: 'urn:x',
        })
      ).toThrow('Expected type "PhysicalSystem", got "SimpleProcess"');
    });

    it('throws for missing label', () => {
      expect(() =>
        parsePhysicalSystem({ type: 'PhysicalSystem', uniqueId: 'urn:x' })
      ).toThrow('PhysicalSystem must have a string "label" property');
    });

    it('throws for missing uniqueId', () => {
      expect(() =>
        parsePhysicalSystem({ type: 'PhysicalSystem', label: 'Test' })
      ).toThrow('PhysicalSystem must have a string "uniqueId" property');
    });

    it('throws for non-array inputs', () => {
      expect(() =>
        parsePhysicalSystem({
          ...MINIMAL_PHYSICAL_SYSTEM,
          inputs: 'not-an-array',
        })
      ).toThrow('"inputs" must be an array');
    });

    it('throws for non-array localReferenceFrames', () => {
      expect(() =>
        parsePhysicalSystem({
          ...MINIMAL_PHYSICAL_SYSTEM,
          localReferenceFrames: 'not-an-array',
        })
      ).toThrow('"localReferenceFrames" must be an array');
    });

    it('throws for spatial frame missing origin', () => {
      expect(() =>
        parsePhysicalSystem({
          ...MINIMAL_PHYSICAL_SYSTEM,
          localReferenceFrames: [
            { axes: [{ name: 'X', description: 'Forward' }] },
          ],
        })
      ).toThrow('localReferenceFrames[0] must have a string "origin" property');
    });

    it('throws for spatial frame missing axes', () => {
      expect(() =>
        parsePhysicalSystem({
          ...MINIMAL_PHYSICAL_SYSTEM,
          localReferenceFrames: [{ origin: 'Center' }],
        })
      ).toThrow('localReferenceFrames[0] must have a non-empty "axes" array');
    });

    it('throws for spatial frame with empty axes', () => {
      expect(() =>
        parsePhysicalSystem({
          ...MINIMAL_PHYSICAL_SYSTEM,
          localReferenceFrames: [{ origin: 'Center', axes: [] }],
        })
      ).toThrow('localReferenceFrames[0] must have a non-empty "axes" array');
    });

    it('throws for axis missing name', () => {
      expect(() =>
        parsePhysicalSystem({
          ...MINIMAL_PHYSICAL_SYSTEM,
          localReferenceFrames: [
            { origin: 'Center', axes: [{ description: 'Up' }] },
          ],
        })
      ).toThrow('axes[0] must have a string "name" property');
    });

    it('throws for axis missing description', () => {
      expect(() =>
        parsePhysicalSystem({
          ...MINIMAL_PHYSICAL_SYSTEM,
          localReferenceFrames: [{ origin: 'Center', axes: [{ name: 'Z' }] }],
        })
      ).toThrow('axes[0] must have a string "description" property');
    });

    it('throws for non-array localTimeFrames', () => {
      expect(() =>
        parsePhysicalSystem({
          ...MINIMAL_PHYSICAL_SYSTEM,
          localTimeFrames: 'not-an-array',
        })
      ).toThrow('"localTimeFrames" must be an array');
    });

    it('throws for temporal frame missing origin', () => {
      expect(() =>
        parsePhysicalSystem({
          ...MINIMAL_PHYSICAL_SYSTEM,
          localTimeFrames: [{ id: 'tf-1' }],
        })
      ).toThrow('localTimeFrames[0] must have a string "origin" property');
    });

    it('throws SensorMLParseError (not generic Error)', () => {
      try {
        parsePhysicalSystem(null);
        fail('Expected SensorMLParseError');
      } catch (err) {
        expect(err).toBeInstanceOf(SensorMLParseError);
        expect((err as SensorMLParseError).name).toBe('SensorMLParseError');
      }
    });
  });

  // ========================================
  // Edge Cases
  // ========================================

  describe('edge cases', () => {
    it('handles null optional fields gracefully', () => {
      const result = parsePhysicalSystem({
        ...MINIMAL_PHYSICAL_SYSTEM,
        definition: null,
        typeOf: null,
        configuration: null,
        featuresOfInterest: null,
        inputs: null,
        outputs: null,
        parameters: null,
        modes: null,
        attachedTo: null,
        localReferenceFrames: null,
        localTimeFrames: null,
        position: null,
        components: null,
        connections: null,
      });
      expect(result.definition).toBeUndefined();
      expect(result.typeOf).toBeUndefined();
      expect(result.configuration).toBeUndefined();
      expect(result.featuresOfInterest).toBeUndefined();
      expect(result.inputs).toBeUndefined();
      expect(result.outputs).toBeUndefined();
      expect(result.parameters).toBeUndefined();
      expect(result.modes).toBeUndefined();
      expect(result.attachedTo).toBeUndefined();
      expect(result.localReferenceFrames).toBeUndefined();
      expect(result.localTimeFrames).toBeUndefined();
      expect(result.position).toBeUndefined();
      expect(result.components).toBeUndefined();
      expect(result.connections).toBeUndefined();
    });

    it('ignores unknown extra properties without error', () => {
      const result = parsePhysicalSystem({
        ...MINIMAL_PHYSICAL_SYSTEM,
        unknownProp: 'preserved in passthrough',
      });
      expect(result.type).toBe('PhysicalSystem');
      expect((result as any).unknownProp).toBe('preserved in passthrough');
    });

    it('handles empty arrays for inputs, outputs, parameters', () => {
      const result = parsePhysicalSystem({
        ...MINIMAL_PHYSICAL_SYSTEM,
        inputs: [],
        outputs: [],
        parameters: [],
      });
      expect(result.inputs).toEqual([]);
      expect(result.outputs).toEqual([]);
      expect(result.parameters).toEqual([]);
    });
  });
});

// ========================================
// parsePhysicalComponent — Valid Documents
// ========================================

describe('parsePhysicalComponent', () => {
  describe('valid documents', () => {
    it('parses a minimal PhysicalComponent with only required fields', () => {
      const result = parsePhysicalComponent(MINIMAL_PHYSICAL_COMPONENT);
      expect(result.type).toBe('PhysicalComponent');
      expect(result.label).toBe('Temperature Sensor');
      expect(result.uniqueId).toBe('urn:example:component:temp-sensor');
      expect(result.method).toBeUndefined();
      expect(result.attachedTo).toBeUndefined();
      expect(result.localReferenceFrames).toBeUndefined();
      expect(result.localTimeFrames).toBeUndefined();
      expect(result.position).toBeUndefined();
      expect(result.inputs).toBeUndefined();
      expect(result.outputs).toBeUndefined();
      expect(result.parameters).toBeUndefined();
      expect(result.modes).toBeUndefined();
    });

    it('parses a full PhysicalComponent with all optional properties', () => {
      const result = parsePhysicalComponent(FULL_PHYSICAL_COMPONENT);
      expect(result.type).toBe('PhysicalComponent');
      expect(result.label).toBe('Thermistor Probe');
      expect(result.uniqueId).toBe('urn:example:component:thermistor');
      expect(result.description).toBe(
        'High-precision thermistor temperature probe'
      );
      expect(result.definition).toBe(
        'http://www.opengis.net/def/sensor/thermistor'
      );
    });

    it('parses typeOf as a Link', () => {
      const result = parsePhysicalComponent(FULL_PHYSICAL_COMPONENT);
      expect(result.typeOf).toBeDefined();
      expect(result.typeOf!.href).toBe(
        'http://example.org/sensors/base-thermistor'
      );
    });

    it('parses inputs and outputs', () => {
      const result = parsePhysicalComponent(FULL_PHYSICAL_COMPONENT);
      expect(result.inputs).toHaveLength(1);
      expect(result.inputs![0].name).toBe('resistance');
      expect(result.outputs).toHaveLength(1);
      expect(result.outputs![0].name).toBe('temperature');
    });
  });

  // ========================================
  // parsePhysicalComponent — AbstractPhysicalProcess Properties
  // ========================================

  describe('AbstractPhysicalProcess properties', () => {
    it('parses attachedTo as a Link', () => {
      const result = parsePhysicalComponent(FULL_PHYSICAL_COMPONENT);
      expect(result.attachedTo).toBeDefined();
      expect(result.attachedTo!.href).toBe(
        'http://example.org/systems/weather-alpha'
      );
    });

    it('parses localReferenceFrames', () => {
      const result = parsePhysicalComponent(FULL_PHYSICAL_COMPONENT);
      expect(result.localReferenceFrames).toHaveLength(1);
      expect(result.localReferenceFrames![0].origin).toBe('Tip of the probe');
      expect(result.localReferenceFrames![0].axes).toHaveLength(1);
    });

    it('parses localTimeFrames', () => {
      const result = parsePhysicalComponent(FULL_PHYSICAL_COMPONENT);
      expect(result.localTimeFrames).toHaveLength(1);
      expect(result.localTimeFrames![0].origin).toBe(
        'Calibration epoch (2024-06-15T00:00:00Z)'
      );
    });

    it('parses position as a text string', () => {
      const result = parsePhysicalComponent(FULL_PHYSICAL_COMPONENT);
      expect(result.position).toBe(
        'Mounted 2m above ground on north side of enclosure'
      );
    });
  });

  // ========================================
  // parsePhysicalComponent — Method Parsing
  // ========================================

  describe('method parsing', () => {
    it('parses method with algorithm and description', () => {
      const result = parsePhysicalComponent(FULL_PHYSICAL_COMPONENT);
      expect(result.method).toBeDefined();
      expect(result.method!.description).toBe(
        'Steinhart-Hart thermistor equation'
      );
      expect(result.method!.algorithm).toBeDefined();
    });

    it('parses method with algorithm only', () => {
      const result = parsePhysicalComponent({
        ...MINIMAL_PHYSICAL_COMPONENT,
        method: { algorithm: { code: 'ADC * scale' } },
      });
      expect(result.method).toBeDefined();
      expect(result.method!.algorithm).toEqual({ code: 'ADC * scale' });
      expect(result.method!.description).toBeUndefined();
    });

    it('handles absent method gracefully', () => {
      const result = parsePhysicalComponent(MINIMAL_PHYSICAL_COMPONENT);
      expect(result.method).toBeUndefined();
    });
  });

  // ========================================
  // parsePhysicalComponent — Invalid Documents
  // ========================================

  describe('invalid documents', () => {
    it('throws for null input', () => {
      expect(() => parsePhysicalComponent(null)).toThrow(SensorMLParseError);
      expect(() => parsePhysicalComponent(null)).toThrow(
        'PhysicalComponent input must be a non-null object'
      );
    });

    it('throws for wrong type value', () => {
      expect(() =>
        parsePhysicalComponent({
          type: 'PhysicalSystem',
          label: 'Test',
          uniqueId: 'urn:x',
        })
      ).toThrow('Expected type "PhysicalComponent", got "PhysicalSystem"');
    });

    it('throws for missing label', () => {
      expect(() =>
        parsePhysicalComponent({
          type: 'PhysicalComponent',
          uniqueId: 'urn:x',
        })
      ).toThrow('PhysicalComponent must have a string "label" property');
    });

    it('throws for missing uniqueId', () => {
      expect(() =>
        parsePhysicalComponent({
          type: 'PhysicalComponent',
          label: 'Test',
        })
      ).toThrow('PhysicalComponent must have a string "uniqueId" property');
    });

    it('throws SensorMLParseError (not generic Error)', () => {
      try {
        parsePhysicalComponent(null);
        fail('Expected SensorMLParseError');
      } catch (err) {
        expect(err).toBeInstanceOf(SensorMLParseError);
        expect((err as SensorMLParseError).name).toBe('SensorMLParseError');
      }
    });
  });

  // ========================================
  // Edge Cases
  // ========================================

  describe('edge cases', () => {
    it('handles null optional fields gracefully', () => {
      const result = parsePhysicalComponent({
        ...MINIMAL_PHYSICAL_COMPONENT,
        method: null,
        attachedTo: null,
        localReferenceFrames: null,
        localTimeFrames: null,
        position: null,
        definition: null,
        typeOf: null,
      });
      expect(result.method).toBeUndefined();
      expect(result.attachedTo).toBeUndefined();
      expect(result.localReferenceFrames).toBeUndefined();
      expect(result.localTimeFrames).toBeUndefined();
      expect(result.position).toBeUndefined();
    });

    it('ignores unknown extra properties without error', () => {
      const result = parsePhysicalComponent({
        ...MINIMAL_PHYSICAL_COMPONENT,
        unknownProp: 'preserved',
      });
      expect((result as any).unknownProp).toBe('preserved');
    });
  });
});

// ========================================
// parsePosition — All Variants
// ========================================

describe('parsePosition', () => {
  it('returns undefined for null or undefined', () => {
    expect(parsePosition(null)).toBeUndefined();
    expect(parsePosition(undefined)).toBeUndefined();
  });

  it('parses string (textual description)', () => {
    const result = parsePosition('Rooftop of building 3, north corner');
    expect(result).toBe('Rooftop of building 3, north corner');
  });

  it('parses GeoJSON Point (2D)', () => {
    const point = { type: 'Point', coordinates: [-105.27, 40.01] };
    const result = parsePosition(point);
    expect((result as any).type).toBe('Point');
    expect((result as any).coordinates).toEqual([-105.27, 40.01]);
  });

  it('parses GeoJSON Point (3D with altitude)', () => {
    const point = { type: 'Point', coordinates: [-105.27, 40.01, 1624] };
    const result = parsePosition(point);
    expect((result as any).type).toBe('Point');
    expect((result as any).coordinates).toEqual([-105.27, 40.01, 1624]);
  });

  it('parses Pose with YPR angles (GeoPose YPR)', () => {
    const pose = {
      position: { type: 'Point', coordinates: [-105.27, 40.01] },
      angles: { yaw: 45, pitch: 0, roll: 0 },
    };
    const result = parsePosition(pose);
    expect((result as any).position).toBeDefined();
    expect((result as any).angles).toEqual({ yaw: 45, pitch: 0, roll: 0 });
  });

  it('parses Pose with quaternion (GeoPose Quaternion)', () => {
    const pose = {
      position: { type: 'Point', coordinates: [0, 0] },
      quaternion: { x: 0, y: 0, z: 0.3827, w: 0.9239 },
    };
    const result = parsePosition(pose);
    expect((result as any).quaternion).toEqual({
      x: 0,
      y: 0,
      z: 0.3827,
      w: 0.9239,
    });
  });

  it('parses Pose with angles only (Relative Pose YPR)', () => {
    const pose = { angles: { yaw: 90, pitch: -5, roll: 0 } };
    const result = parsePosition(pose);
    expect((result as any).angles).toEqual({ yaw: 90, pitch: -5, roll: 0 });
    expect((result as any).position).toBeUndefined();
  });

  it('parses Pose with quaternion only (Relative Pose Quaternion)', () => {
    const pose = { quaternion: { x: 0, y: 0, z: 0, w: 1 } };
    const result = parsePosition(pose);
    expect((result as any).quaternion).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  });

  it('parses Link position', () => {
    const link = {
      href: 'http://example.org/datastreams/pos-1',
      title: 'Position Stream',
    };
    const result = parsePosition(link);
    expect((result as any).href).toBe('http://example.org/datastreams/pos-1');
    expect((result as any).title).toBe('Position Stream');
  });

  it('parses AbstractProcess position (pass-through)', () => {
    const proc = {
      type: 'SimpleProcess',
      label: 'GPS Locator',
      uniqueId: 'urn:example:gps',
    };
    const result = parsePosition(proc);
    expect((result as any).type).toBe('SimpleProcess');
  });

  it('parses deprecated Vector position (pass-through)', () => {
    const vec = {
      type: 'Vector',
      referenceFrame: 'urn:ogc:def:crs:EPSG::4326',
      coordinates: [{ name: 'lat', value: 40.01 }],
    };
    const result = parsePosition(vec);
    expect((result as any).type).toBe('Vector');
  });

  it('parses deprecated DataRecord position (pass-through)', () => {
    const rec = {
      type: 'DataRecord',
      fields: [{ name: 'location', type: 'Vector' }],
    };
    const result = parsePosition(rec);
    expect((result as any).type).toBe('DataRecord');
  });

  it('parses deprecated DataArray position (pass-through)', () => {
    const arr = {
      type: 'DataArray',
      elementCount: { value: 10 },
      elementType: { type: 'DataRecord' },
    };
    const result = parsePosition(arr);
    expect((result as any).type).toBe('DataArray');
  });

  it('returns pass-through for unrecognized object', () => {
    const unknown = { custom: 'positionData', format: 'proprietary' };
    const result = parsePosition(unknown);
    expect(result).toBeDefined();
    expect((result as any).custom).toBe('positionData');
  });
});

// ========================================
// parseComponentList — Standalone
// ========================================

describe('parseComponentList', () => {
  it('returns undefined for null or undefined', () => {
    expect(parseComponentList(null)).toBeUndefined();
    expect(parseComponentList(undefined)).toBeUndefined();
  });

  it('throws for non-array input', () => {
    expect(() => parseComponentList('not-an-array')).toThrow(
      '"components" must be an array'
    );
  });

  it('parses inline process components', () => {
    const list = parseComponentList([
      {
        name: 'sensor1',
        type: 'PhysicalComponent',
        label: 'Sensor 1',
        uniqueId: 'urn:s1',
      },
    ]);
    expect(list).toHaveLength(1);
    expect(list![0].name).toBe('sensor1');
  });

  it('parses external link components', () => {
    const list = parseComponentList([
      {
        name: 'ext',
        type: 'Link',
        href: 'http://example.org/sensor',
      },
    ]);
    expect(list).toHaveLength(1);
    expect(list![0].name).toBe('ext');
    expect(list![0].type).toBe('Link');
  });
});

// ========================================
// parseConnectionList — Standalone
// ========================================

describe('parseConnectionList', () => {
  it('returns undefined for null or undefined', () => {
    expect(parseConnectionList(null)).toBeUndefined();
    expect(parseConnectionList(undefined)).toBeUndefined();
  });

  it('throws for non-array input', () => {
    expect(() => parseConnectionList('not-an-array')).toThrow(
      '"connections" must be an array'
    );
  });

  it('parses valid connections', () => {
    const list = parseConnectionList([
      { source: 'components/a/outputs/x', destination: 'outputs/y' },
    ]);
    expect(list).toHaveLength(1);
    expect(list![0].source).toBe('components/a/outputs/x');
    expect(list![0].destination).toBe('outputs/y');
  });

  it('throws for connection missing source', () => {
    expect(() => parseConnectionList([{ destination: 'outputs/y' }])).toThrow(
      'connections[0] must have a string "source" property'
    );
  });

  it('throws for connection missing destination', () => {
    expect(() =>
      parseConnectionList([{ source: 'components/a/outputs/x' }])
    ).toThrow('connections[0] must have a string "destination" property');
  });
});

// ========================================
// parseComponentEntry — Standalone
// ========================================

describe('parseComponentEntry', () => {
  it('throws for non-object entry', () => {
    expect(() => parseComponentEntry('string', 0)).toThrow(
      'components[0] must be an object'
    );
  });

  it('throws for entry without name', () => {
    expect(() =>
      parseComponentEntry({ type: 'Link', href: 'http://x' }, 0)
    ).toThrow('components[0] must have a string "name" property');
  });

  it('recursively parses PhysicalSystem component', () => {
    const entry = parseComponentEntry(
      {
        name: 'subSys',
        type: 'PhysicalSystem',
        label: 'Sub System',
        uniqueId: 'urn:sub',
      },
      0
    );
    expect(entry.name).toBe('subSys');
    expect(entry.type).toBe('PhysicalSystem');
  });

  it('passes through SimpleProcess component', () => {
    const entry = parseComponentEntry(
      {
        name: 'proc1',
        type: 'SimpleProcess',
        label: 'Proc',
        uniqueId: 'urn:proc',
      },
      0
    );
    expect(entry.name).toBe('proc1');
    expect(entry.type).toBe('SimpleProcess');
  });

  // --- Cross-type delegation tests (Task 8b) ---

  it('parses SimpleProcess child component via cross-type delegation', () => {
    const entry = parseComponentEntry(
      {
        name: 'tempSensor',
        type: 'SimpleProcess',
        uniqueId: 'urn:simple',
        label: 'Temperature Sensor',
        method: { algorithm: ['kalman-filter'] },
      },
      0
    );
    expect(entry.name).toBe('tempSensor');
    expect(entry.type).toBe('SimpleProcess');
    expect((entry as any).uniqueId).toBe('urn:simple');
    expect((entry as any).method).toBeDefined();
  });

  it('parses PhysicalComponent child component via cross-type delegation', () => {
    const entry = parseComponentEntry(
      {
        name: 'windVane',
        type: 'PhysicalComponent',
        uniqueId: 'urn:phycomp',
        label: 'Wind Vane',
      },
      0
    );
    expect(entry.name).toBe('windVane');
    expect(entry.type).toBe('PhysicalComponent');
    expect((entry as any).uniqueId).toBe('urn:phycomp');
  });

  it('parses AggregateProcess child component via cross-type delegation', () => {
    const entry = parseComponentEntry(
      {
        name: 'procChain',
        type: 'AggregateProcess',
        uniqueId: 'urn:agg',
        label: 'Processing Chain',
        components: [],
      },
      0
    );
    expect(entry.name).toBe('procChain');
    expect(entry.type).toBe('AggregateProcess');
    expect((entry as any).uniqueId).toBe('urn:agg');
    expect((entry as any).components).toEqual([]);
  });

  it('parses PhysicalSystem child component (regression)', () => {
    const entry = parseComponentEntry(
      {
        name: 'subPlatform',
        type: 'PhysicalSystem',
        uniqueId: 'urn:subsys',
        label: 'Sub Platform',
      },
      0
    );
    expect(entry.name).toBe('subPlatform');
    expect(entry.type).toBe('PhysicalSystem');
    expect((entry as any).uniqueId).toBe('urn:subsys');
    expect((entry as any).label).toBe('Sub Platform');
  });

  it('passes through external link component as-is', () => {
    const entry = parseComponentEntry(
      {
        name: 'extSensor',
        type: 'Link',
        href: 'http://example.org/sensor',
      },
      0
    );
    expect(entry.name).toBe('extSensor');
    expect((entry as any).type).toBe('Link');
    expect((entry as any).href).toBe('http://example.org/sensor');
  });
});

// ========================================
// parseProcessMethod — Standalone
// ========================================

describe('parseProcessMethod', () => {
  it('returns undefined for non-object input', () => {
    expect(parseProcessMethod(null)).toBeUndefined();
    expect(parseProcessMethod('string')).toBeUndefined();
    expect(parseProcessMethod(42)).toBeUndefined();
  });

  it('parses algorithm only', () => {
    const result = parseProcessMethod({ algorithm: [1, 2, 3] });
    expect(result).toBeDefined();
    expect(result!.algorithm).toEqual([1, 2, 3]);
    expect(result!.description).toBeUndefined();
  });

  it('parses description only', () => {
    const result = parseProcessMethod({ description: 'A method' });
    expect(result).toBeDefined();
    expect(result!.description).toBe('A method');
  });

  it('parses both fields', () => {
    const result = parseProcessMethod({
      algorithm: { code: 'x+y' },
      description: 'Addition',
    });
    expect(result!.algorithm).toEqual({ code: 'x+y' });
    expect(result!.description).toBe('Addition');
  });

  it('returns empty object for empty input', () => {
    expect(parseProcessMethod({})).toEqual({});
  });
});
