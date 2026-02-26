/**
 * Tests for the SensorML 3.0 SimpleProcess sub-parser.
 *
 * Validates parsing of all AbstractProcess-level properties, the
 * SimpleProcess-specific `method` property, IOComponentChoice entries,
 * and error handling for invalid documents.
 *
 * @see parseSimpleProcess
 */

import {
  parseSimpleProcess,
  parseProcessMethod,
  parseIOComponentChoice,
  SensorMLParseError,
} from './simple-process.js';

// ========================================
// Fixtures
// ========================================

/** Minimal valid SimpleProcess — only required fields. */
const MINIMAL_SIMPLE_PROCESS = {
  type: 'SimpleProcess',
  label: 'Linear Interpolation',
  uniqueId: 'urn:example:process:linear-interp',
};

/** Full SimpleProcess with all optional properties populated. */
const FULL_SIMPLE_PROCESS = {
  type: 'SimpleProcess',
  label: 'Weighted Average Filter',
  uniqueId: 'urn:example:process:weighted-avg',
  description: 'Computes a weighted average of sensor readings',
  id: 'proc-001',
  lang: 'en',
  keywords: ['filter', 'average', 'weighted'],
  definition: 'http://www.opengis.net/def/process/weighted-average',
  typeOf: {
    href: 'http://example.org/processes/base-filter',
    title: 'Base Filter Process',
  },
  configuration: {
    setValues: [
      { ref: 'parameters/windowSize', value: 10 },
      { ref: 'parameters/threshold', value: 0.5 },
    ],
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
    {
      name: 'observedProperty',
      type: 'ObservableProperty',
      definition: 'http://www.opengis.net/def/property/temperature',
    },
  ],
  outputs: [
    {
      name: 'filteredTemperature',
      type: 'Quantity',
      label: 'Filtered Temperature',
      uom: { code: 'degC' },
    },
  ],
  parameters: [
    {
      name: 'windowSize',
      type: 'Count',
      label: 'Window Size',
      value: 10,
    },
  ],
  modes: [
    {
      type: 'Mode',
      label: 'High Precision',
      uniqueId: 'urn:example:mode:high-precision',
      configuration: {
        setValues: [{ ref: 'parameters/windowSize', value: 20 }],
      },
    },
  ],
  method: {
    algorithm: { language: 'Python', code: 'sum(w*x)/sum(w)' },
    description: 'Weighted moving average with configurable window size',
  },
  identifiers: [
    {
      label: 'Short Name',
      value: 'WeightedAvg',
      definition: 'urn:ogc:def:identifier:shortName',
    },
  ],
  classifiers: [
    {
      label: 'Process Type',
      value: 'Filter',
      definition: 'urn:ogc:def:classifier:processType',
    },
  ],
  validTime: ['2024-01-01T00:00:00Z', 'now'],
};

// ========================================
// parseSimpleProcess — Valid Documents
// ========================================

describe('parseSimpleProcess', () => {
  describe('valid documents', () => {
    it('parses a minimal SimpleProcess with only required fields', () => {
      const result = parseSimpleProcess(MINIMAL_SIMPLE_PROCESS);
      expect(result.type).toBe('SimpleProcess');
      expect(result.label).toBe('Linear Interpolation');
      expect(result.uniqueId).toBe('urn:example:process:linear-interp');
      expect(result.method).toBeUndefined();
      expect(result.inputs).toBeUndefined();
      expect(result.outputs).toBeUndefined();
      expect(result.parameters).toBeUndefined();
      expect(result.modes).toBeUndefined();
      expect(result.definition).toBeUndefined();
      expect(result.typeOf).toBeUndefined();
      expect(result.configuration).toBeUndefined();
      expect(result.featuresOfInterest).toBeUndefined();
    });

    it('parses a full SimpleProcess with all optional properties', () => {
      const result = parseSimpleProcess(FULL_SIMPLE_PROCESS);
      expect(result.type).toBe('SimpleProcess');
      expect(result.label).toBe('Weighted Average Filter');
      expect(result.uniqueId).toBe('urn:example:process:weighted-avg');
      expect(result.description).toBe(
        'Computes a weighted average of sensor readings'
      );
      expect(result.definition).toBe(
        'http://www.opengis.net/def/process/weighted-average'
      );
    });

    it('parses typeOf as a Link', () => {
      const result = parseSimpleProcess(FULL_SIMPLE_PROCESS);
      expect(result.typeOf).toBeDefined();
      expect(result.typeOf!.href).toBe(
        'http://example.org/processes/base-filter'
      );
      expect(result.typeOf!.title).toBe('Base Filter Process');
    });

    it('parses configuration (Settings)', () => {
      const result = parseSimpleProcess(FULL_SIMPLE_PROCESS);
      expect(result.configuration).toBeDefined();
      expect(result.configuration!.setValues).toHaveLength(2);
      expect(result.configuration!.setValues![0].ref).toBe(
        'parameters/windowSize'
      );
    });

    it('parses featuresOfInterest as a FeatureList', () => {
      const result = parseSimpleProcess(FULL_SIMPLE_PROCESS);
      expect(result.featuresOfInterest).toBeDefined();
      expect(result.featuresOfInterest).toHaveLength(1);
      expect(result.featuresOfInterest![0].href).toBe(
        'http://example.org/features/station-1'
      );
    });

    it('parses inputs with both AnyComponent and ObservableProperty', () => {
      const result = parseSimpleProcess(FULL_SIMPLE_PROCESS);
      expect(result.inputs).toBeDefined();
      expect(result.inputs).toHaveLength(2);
      expect(result.inputs![0].name).toBe('rawTemperature');
      expect((result.inputs![0] as any).type).toBe('Quantity');
      expect(result.inputs![1].name).toBe('observedProperty');
      expect((result.inputs![1] as any).type).toBe('ObservableProperty');
    });

    it('parses outputs', () => {
      const result = parseSimpleProcess(FULL_SIMPLE_PROCESS);
      expect(result.outputs).toBeDefined();
      expect(result.outputs).toHaveLength(1);
      expect(result.outputs![0].name).toBe('filteredTemperature');
    });

    it('parses parameters', () => {
      const result = parseSimpleProcess(FULL_SIMPLE_PROCESS);
      expect(result.parameters).toBeDefined();
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters![0].name).toBe('windowSize');
    });

    it('parses modes', () => {
      const result = parseSimpleProcess(FULL_SIMPLE_PROCESS);
      expect(result.modes).toBeDefined();
      expect(result.modes).toHaveLength(1);
      expect(result.modes![0].label).toBe('High Precision');
    });

    it('preserves DescribedObject passthrough properties', () => {
      const result = parseSimpleProcess(FULL_SIMPLE_PROCESS);
      expect(result.id).toBe('proc-001');
      expect(result.lang).toBe('en');
      expect(result.keywords).toEqual(['filter', 'average', 'weighted']);
      expect(result.identifiers).toHaveLength(1);
      expect(result.classifiers).toHaveLength(1);
      expect(result.validTime).toEqual(['2024-01-01T00:00:00Z', 'now']);
    });
  });

  // ========================================
  // parseSimpleProcess — Method Parsing
  // ========================================

  describe('method parsing', () => {
    it('parses method with algorithm only', () => {
      const result = parseSimpleProcess({
        ...MINIMAL_SIMPLE_PROCESS,
        method: { algorithm: { language: 'R', code: 'lm(y ~ x)' } },
      });
      expect(result.method).toBeDefined();
      expect(result.method!.algorithm).toEqual({
        language: 'R',
        code: 'lm(y ~ x)',
      });
      expect(result.method!.description).toBeUndefined();
    });

    it('parses method with description only', () => {
      const result = parseSimpleProcess({
        ...MINIMAL_SIMPLE_PROCESS,
        method: { description: 'Linear regression on two variables' },
      });
      expect(result.method).toBeDefined();
      expect(result.method!.description).toBe(
        'Linear regression on two variables'
      );
      expect(result.method!.algorithm).toBeUndefined();
    });

    it('parses method with both algorithm and description', () => {
      const result = parseSimpleProcess(FULL_SIMPLE_PROCESS);
      expect(result.method).toBeDefined();
      expect(result.method!.algorithm).toBeDefined();
      expect(result.method!.description).toBe(
        'Weighted moving average with configurable window size'
      );
    });

    it('handles absent method gracefully', () => {
      const result = parseSimpleProcess(MINIMAL_SIMPLE_PROCESS);
      expect(result.method).toBeUndefined();
    });
  });

  // ========================================
  // parseSimpleProcess — Invalid Documents
  // ========================================

  describe('invalid documents', () => {
    it('throws for null input', () => {
      expect(() => parseSimpleProcess(null)).toThrow(SensorMLParseError);
      expect(() => parseSimpleProcess(null)).toThrow(
        'SimpleProcess input must be a non-null object'
      );
    });

    it('throws for non-object input', () => {
      expect(() => parseSimpleProcess('not-an-object')).toThrow(
        SensorMLParseError
      );
      expect(() => parseSimpleProcess(42)).toThrow(SensorMLParseError);
    });

    it('throws for array input', () => {
      expect(() => parseSimpleProcess([])).toThrow(SensorMLParseError);
    });

    it('throws for missing type', () => {
      expect(() =>
        parseSimpleProcess({ label: 'Test', uniqueId: 'urn:x' })
      ).toThrow('Expected type "SimpleProcess"');
    });

    it('throws for wrong type value', () => {
      expect(() =>
        parseSimpleProcess({
          type: 'PhysicalSystem',
          label: 'Test',
          uniqueId: 'urn:x',
        })
      ).toThrow('Expected type "SimpleProcess", got "PhysicalSystem"');
    });

    it('throws for missing label', () => {
      expect(() =>
        parseSimpleProcess({ type: 'SimpleProcess', uniqueId: 'urn:x' })
      ).toThrow('SimpleProcess must have a string "label" property');
    });

    it('throws for missing uniqueId', () => {
      expect(() =>
        parseSimpleProcess({ type: 'SimpleProcess', label: 'Test' })
      ).toThrow('SimpleProcess must have a string "uniqueId" property');
    });

    it('throws for non-array inputs', () => {
      expect(() =>
        parseSimpleProcess({
          ...MINIMAL_SIMPLE_PROCESS,
          inputs: 'not-an-array',
        })
      ).toThrow('"inputs" must be an array');
    });

    it('throws for inputs entry without name', () => {
      expect(() =>
        parseSimpleProcess({
          ...MINIMAL_SIMPLE_PROCESS,
          inputs: [{ type: 'Quantity', uom: { code: 'degC' } }],
        })
      ).toThrow('Invalid inputs[0]');
    });

    it('throws for non-object inputs entry', () => {
      expect(() =>
        parseSimpleProcess({
          ...MINIMAL_SIMPLE_PROCESS,
          inputs: ['not-an-object'],
        })
      ).toThrow('Invalid inputs[0]');
    });

    it('throws SensorMLParseError (not generic Error)', () => {
      try {
        parseSimpleProcess(null);
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
    it('handles empty arrays for inputs, outputs, parameters', () => {
      const result = parseSimpleProcess({
        ...MINIMAL_SIMPLE_PROCESS,
        inputs: [],
        outputs: [],
        parameters: [],
      });
      // Empty arrays are valid but return empty arrays
      expect(result.inputs).toEqual([]);
      expect(result.outputs).toEqual([]);
      expect(result.parameters).toEqual([]);
    });

    it('handles null optional fields gracefully', () => {
      const result = parseSimpleProcess({
        ...MINIMAL_SIMPLE_PROCESS,
        method: null,
        definition: null,
        typeOf: null,
        configuration: null,
        featuresOfInterest: null,
        inputs: null,
        outputs: null,
        parameters: null,
        modes: null,
      });
      expect(result.method).toBeUndefined();
      expect(result.definition).toBeUndefined();
      expect(result.typeOf).toBeUndefined();
      expect(result.configuration).toBeUndefined();
      expect(result.featuresOfInterest).toBeUndefined();
      expect(result.inputs).toBeUndefined();
      expect(result.outputs).toBeUndefined();
      expect(result.parameters).toBeUndefined();
      expect(result.modes).toBeUndefined();
    });

    it('ignores unknown extra properties without error', () => {
      const result = parseSimpleProcess({
        ...MINIMAL_SIMPLE_PROCESS,
        unknownProp: 'should be ignored by type but preserved in passthrough',
        extraNested: { foo: 'bar' },
      });
      expect(result.type).toBe('SimpleProcess');
      expect((result as any).unknownProp).toBe(
        'should be ignored by type but preserved in passthrough'
      );
    });

    it('parses method with empty object', () => {
      const result = parseSimpleProcess({
        ...MINIMAL_SIMPLE_PROCESS,
        method: {},
      });
      expect(result.method).toBeDefined();
      expect(result.method!.algorithm).toBeUndefined();
      expect(result.method!.description).toBeUndefined();
    });
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
    expect(result!.algorithm).toBeUndefined();
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
    const result = parseProcessMethod({});
    expect(result).toEqual({});
  });
});

// ========================================
// parseIOComponentChoice — Standalone
// ========================================

describe('parseIOComponentChoice', () => {
  it('parses a valid AnyComponent entry', () => {
    const result = parseIOComponentChoice({
      name: 'temperature',
      type: 'Quantity',
      uom: { code: 'degC' },
    });
    expect(result.name).toBe('temperature');
  });

  it('parses a valid ObservableProperty entry', () => {
    const result = parseIOComponentChoice({
      name: 'observed',
      type: 'ObservableProperty',
      definition: 'http://example.org/property',
    });
    expect(result.name).toBe('observed');
  });

  it('throws for non-object input', () => {
    expect(() => parseIOComponentChoice('string')).toThrow(
      'IOComponentChoice entry must be an object'
    );
  });

  it('throws for missing name', () => {
    expect(() =>
      parseIOComponentChoice({ type: 'Quantity', uom: { code: 'm' } })
    ).toThrow('IOComponentChoice entry must have a string "name" property');
  });
});
