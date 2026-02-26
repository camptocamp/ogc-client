/**
 * Tests for the SensorML 3.0 AggregateProcess sub-parser.
 *
 * Validates parsing of all AbstractProcess-level properties, the
 * AggregateProcess-specific `components` and `connections` properties,
 * recursive component parsing, and error handling for invalid documents.
 *
 * @see parseAggregateProcess
 */

import {
  parseAggregateProcess,
  parseComponentList,
  parseConnectionList,
  parseComponentEntry,
  SensorMLParseError,
} from './aggregate-process.js';

// ========================================
// Fixtures
// ========================================

/** Minimal valid AggregateProcess — only required fields. */
const MINIMAL_AGGREGATE_PROCESS = {
  type: 'AggregateProcess',
  label: 'Sensor Fusion Pipeline',
  uniqueId: 'urn:example:process:sensor-fusion',
};

/** Full AggregateProcess with all optional properties populated. */
const FULL_AGGREGATE_PROCESS = {
  type: 'AggregateProcess',
  label: 'Weather Processing Chain',
  uniqueId: 'urn:example:process:weather-chain',
  description: 'Processes raw weather sensor data through calibration and QC',
  id: 'agg-001',
  lang: 'en',
  keywords: ['weather', 'processing', 'chain'],
  definition: 'http://www.opengis.net/def/process/weather-chain',
  typeOf: {
    href: 'http://example.org/processes/base-chain',
    title: 'Base Processing Chain',
  },
  configuration: {
    setValues: [{ ref: 'parameters/samplingRate', value: 60 }],
  },
  featuresOfInterest: [
    {
      href: 'http://example.org/features/station-1',
      title: 'Weather Station 1',
    },
  ],
  inputs: [
    {
      name: 'rawTemperature',
      type: 'Quantity',
      label: 'Raw Temperature',
      uom: { code: 'degC' },
    },
  ],
  outputs: [
    {
      name: 'calibratedTemperature',
      type: 'Quantity',
      label: 'Calibrated Temperature',
      uom: { code: 'degC' },
    },
  ],
  parameters: [
    {
      name: 'samplingRate',
      type: 'Count',
      label: 'Sampling Rate',
      value: 60,
    },
  ],
  modes: [
    {
      type: 'Mode',
      label: 'Real-time',
      uniqueId: 'urn:example:mode:realtime',
    },
  ],
  components: [
    {
      name: 'calibrator',
      type: 'SimpleProcess',
      label: 'Temperature Calibrator',
      uniqueId: 'urn:example:process:temp-calibrator',
    },
    {
      name: 'qcFilter',
      type: 'SimpleProcess',
      label: 'Quality Control Filter',
      uniqueId: 'urn:example:process:qc-filter',
    },
  ],
  connections: [
    {
      source: 'inputs/rawTemperature',
      destination: 'components/calibrator/inputs/raw',
    },
    {
      source: 'components/calibrator/outputs/calibrated',
      destination: 'components/qcFilter/inputs/value',
    },
    {
      source: 'components/qcFilter/outputs/passed',
      destination: 'outputs/calibratedTemperature',
    },
  ],
  identifiers: [
    {
      label: 'Short Name',
      value: 'WeatherChain',
      definition: 'urn:ogc:def:identifier:shortName',
    },
  ],
  classifiers: [
    {
      label: 'Process Type',
      value: 'Chain',
      definition: 'urn:ogc:def:classifier:processType',
    },
  ],
  validTime: ['2024-01-01T00:00:00Z', 'now'],
};

// ========================================
// parseAggregateProcess — Valid Documents
// ========================================

describe('parseAggregateProcess', () => {
  describe('valid documents', () => {
    it('parses a minimal AggregateProcess with only required fields', () => {
      const result = parseAggregateProcess(MINIMAL_AGGREGATE_PROCESS);
      expect(result.type).toBe('AggregateProcess');
      expect(result.label).toBe('Sensor Fusion Pipeline');
      expect(result.uniqueId).toBe('urn:example:process:sensor-fusion');
      expect(result.components).toBeUndefined();
      expect(result.connections).toBeUndefined();
      expect(result.inputs).toBeUndefined();
      expect(result.outputs).toBeUndefined();
      expect(result.parameters).toBeUndefined();
      expect(result.modes).toBeUndefined();
      expect(result.definition).toBeUndefined();
      expect(result.typeOf).toBeUndefined();
      expect(result.configuration).toBeUndefined();
      expect(result.featuresOfInterest).toBeUndefined();
    });

    it('parses a full AggregateProcess with all optional properties', () => {
      const result = parseAggregateProcess(FULL_AGGREGATE_PROCESS);
      expect(result.type).toBe('AggregateProcess');
      expect(result.label).toBe('Weather Processing Chain');
      expect(result.uniqueId).toBe('urn:example:process:weather-chain');
      expect(result.description).toBe(
        'Processes raw weather sensor data through calibration and QC'
      );
      expect(result.definition).toBe(
        'http://www.opengis.net/def/process/weather-chain'
      );
    });

    it('parses typeOf as a Link', () => {
      const result = parseAggregateProcess(FULL_AGGREGATE_PROCESS);
      expect(result.typeOf).toBeDefined();
      expect(result.typeOf!.href).toBe(
        'http://example.org/processes/base-chain'
      );
      expect(result.typeOf!.title).toBe('Base Processing Chain');
    });

    it('parses configuration (Settings)', () => {
      const result = parseAggregateProcess(FULL_AGGREGATE_PROCESS);
      expect(result.configuration).toBeDefined();
      expect(result.configuration!.setValues).toHaveLength(1);
      expect(result.configuration!.setValues![0].ref).toBe(
        'parameters/samplingRate'
      );
    });

    it('parses featuresOfInterest as a FeatureList', () => {
      const result = parseAggregateProcess(FULL_AGGREGATE_PROCESS);
      expect(result.featuresOfInterest).toBeDefined();
      expect(result.featuresOfInterest).toHaveLength(1);
      expect(result.featuresOfInterest![0].href).toBe(
        'http://example.org/features/station-1'
      );
    });

    it('parses inputs, outputs, and parameters', () => {
      const result = parseAggregateProcess(FULL_AGGREGATE_PROCESS);
      expect(result.inputs).toHaveLength(1);
      expect(result.inputs![0].name).toBe('rawTemperature');
      expect(result.outputs).toHaveLength(1);
      expect(result.outputs![0].name).toBe('calibratedTemperature');
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters![0].name).toBe('samplingRate');
    });

    it('parses modes', () => {
      const result = parseAggregateProcess(FULL_AGGREGATE_PROCESS);
      expect(result.modes).toBeDefined();
      expect(result.modes).toHaveLength(1);
      expect(result.modes![0].label).toBe('Real-time');
    });

    it('preserves DescribedObject passthrough properties', () => {
      const result = parseAggregateProcess(FULL_AGGREGATE_PROCESS);
      expect(result.id).toBe('agg-001');
      expect(result.lang).toBe('en');
      expect(result.keywords).toEqual(['weather', 'processing', 'chain']);
      expect(result.identifiers).toHaveLength(1);
      expect(result.classifiers).toHaveLength(1);
      expect(result.validTime).toEqual(['2024-01-01T00:00:00Z', 'now']);
    });
  });

  // ========================================
  // Component Parsing
  // ========================================

  describe('component parsing', () => {
    it('parses inline SimpleProcess components', () => {
      const result = parseAggregateProcess(FULL_AGGREGATE_PROCESS);
      expect(result.components).toBeDefined();
      expect(result.components).toHaveLength(2);
      expect(result.components![0].name).toBe('calibrator');
      expect(result.components![0].type).toBe('SimpleProcess');
      expect(result.components![1].name).toBe('qcFilter');
    });

    it('parses inline PhysicalComponent entries', () => {
      const result = parseAggregateProcess({
        ...MINIMAL_AGGREGATE_PROCESS,
        components: [
          {
            name: 'thermometer',
            type: 'PhysicalComponent',
            label: 'Thermometer',
            uniqueId: 'urn:example:sensor:thermo',
          },
        ],
      });
      expect(result.components).toHaveLength(1);
      expect(result.components![0].name).toBe('thermometer');
      expect(result.components![0].type).toBe('PhysicalComponent');
    });

    it('parses external link components (type: Link)', () => {
      const result = parseAggregateProcess({
        ...MINIMAL_AGGREGATE_PROCESS,
        components: [
          {
            name: 'externalSensor',
            type: 'Link',
            href: 'http://example.org/sensors/external-1',
            title: 'External Sensor Reference',
          },
        ],
      });
      expect(result.components).toHaveLength(1);
      expect(result.components![0].name).toBe('externalSensor');
      expect(result.components![0].type).toBe('Link');
      expect((result.components![0] as any).href).toBe(
        'http://example.org/sensors/external-1'
      );
    });

    it('parses mixed inline processes and external links', () => {
      const result = parseAggregateProcess({
        ...MINIMAL_AGGREGATE_PROCESS,
        components: [
          {
            name: 'inlineSensor',
            type: 'SimpleProcess',
            label: 'Inline Sensor',
            uniqueId: 'urn:example:process:inline',
          },
          {
            name: 'externalRef',
            type: 'Link',
            href: 'http://example.org/processes/ref-1',
          },
          {
            name: 'physicalSensor',
            type: 'PhysicalSystem',
            label: 'Physical System',
            uniqueId: 'urn:example:system:phys',
          },
        ],
      });
      expect(result.components).toHaveLength(3);
      expect(result.components![0].type).toBe('SimpleProcess');
      expect(result.components![1].type).toBe('Link');
      expect(result.components![2].type).toBe('PhysicalSystem');
    });

    it('recursively parses nested AggregateProcess components', () => {
      const result = parseAggregateProcess({
        ...MINIMAL_AGGREGATE_PROCESS,
        components: [
          {
            name: 'subPipeline',
            type: 'AggregateProcess',
            label: 'Sub-Pipeline',
            uniqueId: 'urn:example:process:sub-pipeline',
            components: [
              {
                name: 'innerStep',
                type: 'SimpleProcess',
                label: 'Inner Step',
                uniqueId: 'urn:example:process:inner-step',
              },
            ],
            connections: [
              {
                source: 'inputs/data',
                destination: 'components/innerStep/inputs/raw',
              },
            ],
          },
        ],
      });
      expect(result.components).toHaveLength(1);
      const sub = result.components![0] as any;
      expect(sub.name).toBe('subPipeline');
      expect(sub.type).toBe('AggregateProcess');
      expect(sub.components).toHaveLength(1);
      expect(sub.components[0].name).toBe('innerStep');
      expect(sub.connections).toHaveLength(1);
      expect(sub.connections[0].source).toBe('inputs/data');
    });

    it('handles absent components gracefully', () => {
      const result = parseAggregateProcess(MINIMAL_AGGREGATE_PROCESS);
      expect(result.components).toBeUndefined();
    });
  });

  // ========================================
  // Connection Handling
  // ========================================

  describe('connection handling', () => {
    it('parses connections with valid source and destination', () => {
      const result = parseAggregateProcess(FULL_AGGREGATE_PROCESS);
      expect(result.connections).toBeDefined();
      expect(result.connections).toHaveLength(3);
      expect(result.connections![0].source).toBe('inputs/rawTemperature');
      expect(result.connections![0].destination).toBe(
        'components/calibrator/inputs/raw'
      );
    });

    it('parses a single connection', () => {
      const result = parseAggregateProcess({
        ...MINIMAL_AGGREGATE_PROCESS,
        connections: [
          {
            source: 'inputs/value',
            destination: 'outputs/result',
          },
        ],
      });
      expect(result.connections).toHaveLength(1);
      expect(result.connections![0].source).toBe('inputs/value');
      expect(result.connections![0].destination).toBe('outputs/result');
    });

    it('handles absent connections gracefully', () => {
      const result = parseAggregateProcess(MINIMAL_AGGREGATE_PROCESS);
      expect(result.connections).toBeUndefined();
    });
  });

  // ========================================
  // Invalid Documents
  // ========================================

  describe('invalid documents', () => {
    it('throws for null input', () => {
      expect(() => parseAggregateProcess(null)).toThrow(SensorMLParseError);
      expect(() => parseAggregateProcess(null)).toThrow(
        'AggregateProcess input must be a non-null object'
      );
    });

    it('throws for non-object input', () => {
      expect(() => parseAggregateProcess('not-an-object')).toThrow(
        SensorMLParseError
      );
      expect(() => parseAggregateProcess(42)).toThrow(SensorMLParseError);
    });

    it('throws for array input', () => {
      expect(() => parseAggregateProcess([])).toThrow(SensorMLParseError);
    });

    it('throws for missing type', () => {
      expect(() =>
        parseAggregateProcess({ label: 'Test', uniqueId: 'urn:x' })
      ).toThrow('Expected type "AggregateProcess"');
    });

    it('throws for wrong type value', () => {
      expect(() =>
        parseAggregateProcess({
          type: 'SimpleProcess',
          label: 'Test',
          uniqueId: 'urn:x',
        })
      ).toThrow('Expected type "AggregateProcess", got "SimpleProcess"');
    });

    it('throws for missing label', () => {
      expect(() =>
        parseAggregateProcess({
          type: 'AggregateProcess',
          uniqueId: 'urn:x',
        })
      ).toThrow('AggregateProcess must have a string "label" property');
    });

    it('throws for missing uniqueId', () => {
      expect(() =>
        parseAggregateProcess({ type: 'AggregateProcess', label: 'Test' })
      ).toThrow('AggregateProcess must have a string "uniqueId" property');
    });

    it('throws for non-array components', () => {
      expect(() =>
        parseAggregateProcess({
          ...MINIMAL_AGGREGATE_PROCESS,
          components: 'not-an-array',
        })
      ).toThrow('"components" must be an array');
    });

    it('throws for component entry without name', () => {
      expect(() =>
        parseAggregateProcess({
          ...MINIMAL_AGGREGATE_PROCESS,
          components: [
            { type: 'SimpleProcess', label: 'Test', uniqueId: 'urn:x' },
          ],
        })
      ).toThrow('components[0] must have a string "name" property');
    });

    it('throws for non-object component entry', () => {
      expect(() =>
        parseAggregateProcess({
          ...MINIMAL_AGGREGATE_PROCESS,
          components: ['not-an-object'],
        })
      ).toThrow('components[0] must be an object');
    });

    it('throws for non-array connections', () => {
      expect(() =>
        parseAggregateProcess({
          ...MINIMAL_AGGREGATE_PROCESS,
          connections: 'not-an-array',
        })
      ).toThrow('"connections" must be an array');
    });

    it('throws for connection missing source', () => {
      expect(() =>
        parseAggregateProcess({
          ...MINIMAL_AGGREGATE_PROCESS,
          connections: [{ destination: 'outputs/result' }],
        })
      ).toThrow('connections[0] must have a string "source" property');
    });

    it('throws for connection missing destination', () => {
      expect(() =>
        parseAggregateProcess({
          ...MINIMAL_AGGREGATE_PROCESS,
          connections: [{ source: 'inputs/value' }],
        })
      ).toThrow('connections[0] must have a string "destination" property');
    });

    it('throws for non-object connection entry', () => {
      expect(() =>
        parseAggregateProcess({
          ...MINIMAL_AGGREGATE_PROCESS,
          connections: ['not-an-object'],
        })
      ).toThrow('connections[0] must be an object');
    });

    it('throws for non-array inputs', () => {
      expect(() =>
        parseAggregateProcess({
          ...MINIMAL_AGGREGATE_PROCESS,
          inputs: 'not-an-array',
        })
      ).toThrow('"inputs" must be an array');
    });

    it('throws SensorMLParseError (not generic Error)', () => {
      try {
        parseAggregateProcess(null);
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
    it('handles empty components and connections arrays', () => {
      const result = parseAggregateProcess({
        ...MINIMAL_AGGREGATE_PROCESS,
        components: [],
        connections: [],
      });
      expect(result.components).toEqual([]);
      expect(result.connections).toEqual([]);
    });

    it('handles null optional fields gracefully', () => {
      const result = parseAggregateProcess({
        ...MINIMAL_AGGREGATE_PROCESS,
        definition: null,
        typeOf: null,
        configuration: null,
        featuresOfInterest: null,
        inputs: null,
        outputs: null,
        parameters: null,
        modes: null,
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
      expect(result.components).toBeUndefined();
      expect(result.connections).toBeUndefined();
    });

    it('ignores unknown extra properties without error', () => {
      const result = parseAggregateProcess({
        ...MINIMAL_AGGREGATE_PROCESS,
        unknownProp: 'should be preserved in passthrough',
        extraNested: { foo: 'bar' },
      });
      expect(result.type).toBe('AggregateProcess');
      expect((result as any).unknownProp).toBe(
        'should be preserved in passthrough'
      );
    });

    it('handles single component entry', () => {
      const result = parseAggregateProcess({
        ...MINIMAL_AGGREGATE_PROCESS,
        components: [
          {
            name: 'solo',
            type: 'SimpleProcess',
            label: 'Solo Process',
            uniqueId: 'urn:example:process:solo',
          },
        ],
      });
      expect(result.components).toHaveLength(1);
      expect(result.components![0].name).toBe('solo');
    });

    it('handles empty arrays for inputs, outputs, parameters', () => {
      const result = parseAggregateProcess({
        ...MINIMAL_AGGREGATE_PROCESS,
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
// parseComponentList — Standalone
// ========================================

describe('parseComponentList', () => {
  it('returns undefined for undefined input', () => {
    expect(parseComponentList(undefined)).toBeUndefined();
  });

  it('returns undefined for null input', () => {
    expect(parseComponentList(null)).toBeUndefined();
  });

  it('throws for non-array input', () => {
    expect(() => parseComponentList('string')).toThrow(
      '"components" must be an array'
    );
  });

  it('parses an array of component entries', () => {
    const result = parseComponentList([
      {
        name: 'sensor1',
        type: 'SimpleProcess',
        label: 'Sensor 1',
        uniqueId: 'urn:x',
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result![0].name).toBe('sensor1');
  });
});

// ========================================
// parseConnectionList — Standalone
// ========================================

describe('parseConnectionList', () => {
  it('returns undefined for undefined input', () => {
    expect(parseConnectionList(undefined)).toBeUndefined();
  });

  it('returns undefined for null input', () => {
    expect(parseConnectionList(null)).toBeUndefined();
  });

  it('throws for non-array input', () => {
    expect(() => parseConnectionList('string')).toThrow(
      '"connections" must be an array'
    );
  });

  it('parses an array of connections', () => {
    const result = parseConnectionList([
      { source: 'inputs/a', destination: 'outputs/b' },
    ]);
    expect(result).toHaveLength(1);
    expect(result![0].source).toBe('inputs/a');
    expect(result![0].destination).toBe('outputs/b');
  });
});

// ========================================
// parseComponentEntry — Standalone
// ========================================

describe('parseComponentEntry', () => {
  it('parses an inline process entry', () => {
    const result = parseComponentEntry(
      {
        name: 'proc1',
        type: 'SimpleProcess',
        label: 'Proc 1',
        uniqueId: 'urn:x',
      },
      0
    );
    expect(result.name).toBe('proc1');
    expect(result.type).toBe('SimpleProcess');
  });

  it('parses an external link entry', () => {
    const result = parseComponentEntry(
      {
        name: 'ext1',
        type: 'Link',
        href: 'http://example.org/proc',
      },
      0
    );
    expect(result.name).toBe('ext1');
    expect(result.type).toBe('Link');
  });

  it('throws for non-object input', () => {
    expect(() => parseComponentEntry('string', 0)).toThrow(
      'components[0] must be an object'
    );
  });

  it('throws for missing name', () => {
    expect(() => parseComponentEntry({ type: 'SimpleProcess' }, 2)).toThrow(
      'components[2] must have a string "name" property'
    );
  });

  // --- Cross-type delegation tests (Task 8b) ---

  it('parses SimpleProcess child component via cross-type delegation', () => {
    const entry = parseComponentEntry(
      {
        name: 'step1',
        type: 'SimpleProcess',
        uniqueId: 'urn:step1',
        label: 'Step 1',
      },
      0
    );
    expect(entry.name).toBe('step1');
    expect(entry.type).toBe('SimpleProcess');
    expect((entry as any).uniqueId).toBe('urn:step1');
  });

  it('parses PhysicalSystem child component via cross-type delegation', () => {
    const entry = parseComponentEntry(
      {
        name: 'subStation',
        type: 'PhysicalSystem',
        uniqueId: 'urn:station',
        label: 'Sub Station',
        components: [],
      },
      0
    );
    expect(entry.name).toBe('subStation');
    expect(entry.type).toBe('PhysicalSystem');
    expect((entry as any).uniqueId).toBe('urn:station');
    expect((entry as any).components).toEqual([]);
  });

  it('parses PhysicalComponent child component via cross-type delegation', () => {
    const entry = parseComponentEntry(
      {
        name: 'sensor1',
        type: 'PhysicalComponent',
        uniqueId: 'urn:sensor1',
        label: 'Sensor 1',
      },
      0
    );
    expect(entry.name).toBe('sensor1');
    expect(entry.type).toBe('PhysicalComponent');
    expect((entry as any).uniqueId).toBe('urn:sensor1');
  });

  it('parses AggregateProcess child component (regression)', () => {
    const entry = parseComponentEntry(
      {
        name: 'subChain',
        type: 'AggregateProcess',
        uniqueId: 'urn:sub',
        label: 'Sub Chain',
        components: [],
      },
      0
    );
    expect(entry.name).toBe('subChain');
    expect(entry.type).toBe('AggregateProcess');
    expect((entry as any).uniqueId).toBe('urn:sub');
    expect((entry as any).components).toEqual([]);
  });

  it('passes through unknown type string without throwing', () => {
    const entry = parseComponentEntry(
      {
        name: 'mystery',
        type: 'FutureProcessType',
        uniqueId: 'urn:future',
      },
      0
    );
    expect(entry.name).toBe('mystery');
    expect((entry as any).type).toBe('FutureProcessType');
    expect((entry as any).uniqueId).toBe('urn:future');
  });
});
