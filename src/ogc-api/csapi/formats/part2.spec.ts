import {
  normalizeStatusCode,
  parseCommand,
  parseCommandStatus,
  parseControlStream,
  parseDatastream,
  parseObservation,
} from './part2.js';
import type {
  Command,
  CommandStatus,
  ControlStream,
  Datastream,
  Observation,
} from '../model.js';

/**
 * Tests for Part 2 parsers.
 *
 * This file houses tests for all Part 2 resource parsers and shared utilities.
 *
 * Datastream fixtures are derived from real OSH response data (Smoke Test #7).
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */

describe('parseDatastream', () => {
  // Fixture derived from OSH Smoke Test #7 response — full Datastream with all fields
  const fullDatastreamFixture = {
    id: '0ocb',
    name: 'FCU Simulated Weather Station - Weather',
    description: 'Weather observations from simulated station',
    'system@id': '0o0o',
    'system@link': {
      href: 'http://45.55.99.236:8080/sensorhub/api/systems/0o0o?f=json',
      uid: 'urn:osh:sensor:simweather:001',
      type: 'application/geo+json',
    },
    outputName: 'weather',
    validTime: ['2026-01-26T18:32:01.56Z', 'now'],
    observedProperties: [
      {
        definition: 'http://mmisw.org/ont/cf/parameter/air_temperature',
        label: 'Air Temperature',
      },
    ],
    formats: [
      'application/om+json',
      'application/swe+json',
      'application/swe+csv',
      'application/swe+xml',
      'application/swe+binary',
    ],
    phenomenonTime: [
      '2026-01-26T18:32:01.56Z',
      '2026-02-19T14:22:03.12Z',
    ],
    resultTime: ['2026-01-26T18:32:01.56Z', '2026-02-19T14:22:03.12Z'],
    resultType: 'record',
    live: true,
    links: [
      {
        rel: 'self',
        href: '/datastreams/0ocb',
        type: 'application/json',
      },
    ],
  };

  it('extracts all fields from a full Datastream (cross-refs excluded)', () => {
    const result: Datastream = parseDatastream(fullDatastreamFixture);

    expect(result.id).toBe('0ocb');
    expect(result.name).toBe('FCU Simulated Weather Station - Weather');
    expect(result.description).toBe(
      'Weather observations from simulated station'
    );
    expect(result.outputName).toBe('weather');
    expect(result.formats).toEqual([
      'application/om+json',
      'application/swe+json',
      'application/swe+csv',
      'application/swe+xml',
      'application/swe+binary',
    ]);
    expect(result.observedProperties).toEqual([
      'http://mmisw.org/ont/cf/parameter/air_temperature',
    ]);
    expect(result.resultType).toBe('record');
    expect(result.live).toBe(true);
    expect(result.links).toEqual([
      { rel: 'self', href: '/datastreams/0ocb', type: 'application/json' },
    ]);

    // Cross-reference fields extracted as typed properties
    expect(result.systemId).toBe('0o0o');
    // Raw @link objects are still excluded (not part of the typed model)
    expect(result).not.toHaveProperty('system@link');
  });

  it('handles a minimal Datastream with only required fields', () => {
    const input = {
      id: 'ds-minimal',
      name: 'Minimal Stream',
      formats: ['application/om+json'],
    };

    const result: Datastream = parseDatastream(input);

    expect(result.id).toBe('ds-minimal');
    expect(result.name).toBe('Minimal Stream');
    expect(result.formats).toEqual(['application/om+json']);
    expect(result.observedProperties).toEqual([]);
    expect(result.phenomenonTime).toBeNull();
    expect(result.resultTime).toBeNull();
    expect(result.resultType).toBeNull();
    expect(result.live).toBeNull();
    expect(result.description).toBeUndefined();
    expect(result.outputName).toBeUndefined();
    expect(result.validTime).toBeUndefined();
    expect(result.type).toBeUndefined();
  });

  it('rejects unknown resultType enum value and returns null', () => {
    const input = {
      id: 'ds-unknown-result',
      name: 'Unknown Result Type Test',
      outputName: 'test-output',
      resultType: 'foobar',
    };
    const result = parseDatastream(input);
    expect(result.resultType).toBeNull();
  });

  it('omits type field when value is not a recognized enum', () => {
    const input = {
      id: 'ds-unknown-type',
      name: 'Unknown Type Test',
      outputName: 'test-output',
      type: 'foobar',
    };
    const result = parseDatastream(input);
    expect(result).not.toHaveProperty('type');
  });

  it('parses all 3 time fields correctly (including "now" sentinel)', () => {
    const input = {
      id: 'ds-time',
      name: 'Time Test',
      formats: [],
      validTime: ['2026-01-26T18:32:01.56Z', 'now'],
      phenomenonTime: [
        '2026-01-26T18:32:01.56Z',
        '2026-02-19T14:22:03.12Z',
      ],
      resultTime: ['2026-01-26T18:32:01.56Z', '2026-02-19T14:22:03.12Z'],
    };

    const result: Datastream = parseDatastream(input);

    // validTime: "now" sentinel → end is undefined
    expect(result.validTime?.start).toEqual(
      new Date('2026-01-26T18:32:01.56Z')
    );
    expect(result.validTime?.end).toBeUndefined();

    // phenomenonTime: concrete start and end
    expect(result.phenomenonTime?.start).toEqual(
      new Date('2026-01-26T18:32:01.56Z')
    );
    expect(result.phenomenonTime?.end).toEqual(
      new Date('2026-02-19T14:22:03.12Z')
    );

    // resultTime: concrete start and end
    expect(result.resultTime?.start).toEqual(
      new Date('2026-01-26T18:32:01.56Z')
    );
    expect(result.resultTime?.end).toEqual(
      new Date('2026-02-19T14:22:03.12Z')
    );
  });

  it('extracts definition URIs from observedProperties objects', () => {
    const input = {
      id: 'ds-obs-obj',
      name: 'Observed Props Object Form',
      formats: [],
      observedProperties: [
        {
          definition: 'http://mmisw.org/ont/cf/parameter/air_temperature',
          label: 'Air Temperature',
        },
        {
          definition: 'http://mmisw.org/ont/cf/parameter/relative_humidity',
          label: 'Humidity',
        },
      ],
    };

    const result: Datastream = parseDatastream(input);

    expect(result.observedProperties).toEqual([
      'http://mmisw.org/ont/cf/parameter/air_temperature',
      'http://mmisw.org/ont/cf/parameter/relative_humidity',
    ]);
  });

  it('passes through observedProperties when already strings', () => {
    const input = {
      id: 'ds-obs-str',
      name: 'Observed Props String Form',
      formats: [],
      observedProperties: [
        'http://mmisw.org/ont/cf/parameter/air_temperature',
        'http://mmisw.org/ont/cf/parameter/relative_humidity',
      ],
    };

    const result: Datastream = parseDatastream(input);

    expect(result.observedProperties).toEqual([
      'http://mmisw.org/ont/cf/parameter/air_temperature',
      'http://mmisw.org/ont/cf/parameter/relative_humidity',
    ]);
  });

  it('returns null (not undefined) for phenomenonTime when null', () => {
    const input = {
      id: 'ds-null-time',
      name: 'Null Time',
      formats: [],
      phenomenonTime: null,
      resultTime: null,
    };

    const result: Datastream = parseDatastream(input);

    // Nullable fields must be null, not undefined
    expect(result.phenomenonTime).toBeNull();
    expect(result.resultTime).toBeNull();
  });

  it('omits optional fields when they are absent', () => {
    const input = {
      id: 'ds-no-optionals',
      name: 'No Optionals',
      formats: [],
    };

    const result: Datastream = parseDatastream(input);

    expect(result).not.toHaveProperty('description');
    expect(result).not.toHaveProperty('outputName');
    expect(result).not.toHaveProperty('type');
    expect(result).not.toHaveProperty('validTime');
  });

  it('throws on non-object input', () => {
    expect(() => parseDatastream(null)).toThrow(
      'parseDatastream: input must be a non-null object'
    );
    expect(() => parseDatastream(42)).toThrow(
      'parseDatastream: input must be a non-null object'
    );
    expect(() => parseDatastream('string')).toThrow(
      'parseDatastream: input must be a non-null object'
    );
  });
});

/**
 * Tests for parseObservation().
 *
 * Observation fixtures are derived from real OSH response data (Smoke Test #8).
 * Observation time fields are single ISO 8601 instant strings, not time intervals.
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html#_observation_resources
 */
describe('parseObservation', () => {
  // Fixture derived from OSH Smoke Test #8 response — full Observation with all fields
  const fullObservationFixture = {
    id: '0o1abc123',
    'datastream@id': '0ocb',
    phenomenonTime: '2026-02-19T14:22:03.12Z',
    resultTime: '2026-02-19T14:22:03.12Z',
    parameters: { quality: 'good' },
    result: {
      temperature: 22.5,
      humidity: 65.3,
      pressure: 1013.25,
    },
    links: [
      {
        rel: 'self',
        href: '/observations/0o1abc123',
        type: 'application/json',
      },
    ],
  };

  it('extracts all fields from a full Observation (cross-refs excluded)', () => {
    const result: Observation = parseObservation(fullObservationFixture);

    expect(result.id).toBe('0o1abc123');
    expect(result.phenomenonTime).toBe('2026-02-19T14:22:03.12Z');
    expect(typeof result.phenomenonTime).toBe('string');
    expect(result.resultTime).toBe('2026-02-19T14:22:03.12Z');
    expect(typeof result.resultTime).toBe('string');
    expect(result.parameters).toEqual({ quality: 'good' });
    expect(result.result).toEqual({
      temperature: 22.5,
      humidity: 65.3,
      pressure: 1013.25,
    });
    expect(result.links).toEqual([
      {
        rel: 'self',
        href: '/observations/0o1abc123',
        type: 'application/json',
      },
    ]);

    // Cross-reference fields extracted as typed properties
    expect(result.datastreamId).toBe('0ocb');
  });

  it('handles a minimal Observation with only required fields', () => {
    const input = {
      id: 'obs-minimal',
      resultTime: '2026-02-19T14:22:03.12Z',
    };

    const result: Observation = parseObservation(input);

    expect(result.id).toBe('obs-minimal');
    expect(result.resultTime).toBe('2026-02-19T14:22:03.12Z');
    expect(result.phenomenonTime).toBeUndefined();
    expect(result.parameters).toBeUndefined();
    expect(result.result).toBeUndefined();
    expect(result.links).toBeUndefined();
  });

  it('passes through a complex result as opaque unknown', () => {
    const complexResult = {
      temperature: 22.5,
      humidity: 65.3,
      nested: { depth: 2 },
    };
    const input = {
      id: 'obs-complex',
      resultTime: '2026-02-19T14:22:03.12Z',
      result: complexResult,
    };

    const result: Observation = parseObservation(input);

    // result must be passed through exactly as-is (deep equality)
    expect(result.result).toEqual(complexResult);
  });

  it('extracts parameters when present as an object', () => {
    const input = {
      id: 'obs-params',
      resultTime: '2026-02-19T14:22:03.12Z',
      parameters: { quality: 'good', source: 'sensor-a' },
    };

    const result: Observation = parseObservation(input);

    expect(result.parameters).toEqual({
      quality: 'good',
      source: 'sensor-a',
    });
  });

  it('omits phenomenonTime when absent (NOT empty string)', () => {
    const input = {
      id: 'obs-no-phenom',
      resultTime: '2026-02-19T14:22:03.12Z',
    };

    const result: Observation = parseObservation(input);

    expect(result.phenomenonTime).toBeUndefined();
    expect(result).not.toHaveProperty('phenomenonTime');
  });

  it('throws on non-object input', () => {
    expect(() => parseObservation(null)).toThrow(
      'parseObservation: input must be a non-null object'
    );
    expect(() => parseObservation(42)).toThrow(
      'parseObservation: input must be a non-null object'
    );
    expect(() => parseObservation('string')).toThrow(
      'parseObservation: input must be a non-null object'
    );
  });

  it('extracts all cross-reference fields', () => {
    const input = {
      id: 'obs-crossref',
      resultTime: '2026-02-19T14:22:03.12Z',
      'datastream@id': '0ocb',
      'samplingFeature@id': 'xyz',
      'foi@id': 'feat-001',
    };

    const result: Observation = parseObservation(input);

    expect(result.id).toBe('obs-crossref');
    expect(result.resultTime).toBe('2026-02-19T14:22:03.12Z');
    expect(result.datastreamId).toBe('0ocb');
    expect(result.samplingFeatureId).toBe('xyz');
    expect(result.featureOfInterestId).toBe('feat-001');
  });
});

/**
 * Tests for parseControlStream().
 *
 * ControlStream is structurally parallel to Datastream — same time field
 * parsing, analogous fields. Fixtures derived from real OSH response data
 * (Smoke Test #9, Finding F30).
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html#_controlstream_resources
 */
describe('parseControlStream', () => {
  // Fixture derived from OSH Smoke Test #9 F30 response — full ControlStream with all fields
  const fullControlStreamFixture = {
    id: '0o10',
    name: 'FCU Field Drone CubePilot - Location Control',
    description: 'Control stream for MAVLink navigation commands',
    'system@id': '0o30',
    'system@link': {
      href: 'http://45.55.99.236:8080/sensorhub/api/systems/0o30?f=json',
      uid: 'urn:osh:driver:mavsdk:cube',
      type: 'application/geo+json',
    },
    inputName: 'mavControl',
    validTime: ['2026-01-14T04:49:19.134Z', 'now'],
    issueTime: [
      '2026-01-14T12:42:21.910351Z',
      '2026-01-14T13:11:31.196096Z',
    ],
    executionTime: [
      '2026-01-14T12:42:21.928726Z',
      '2026-01-14T13:11:31.196096Z',
    ],
    controlledProperties: [],
    formats: [
      'application/json',
      'application/swe+json',
      'application/swe+csv',
      'application/swe+xml',
      'application/swe+binary',
    ],
    live: true,
    async: true,
    links: [
      {
        rel: 'self',
        href: '/controlstreams/0o10',
        type: 'application/json',
      },
    ],
  };

  it('extracts all fields from a full ControlStream (cross-refs excluded)', () => {
    const result: ControlStream = parseControlStream(
      fullControlStreamFixture
    );

    expect(result.id).toBe('0o10');
    expect(result.name).toBe(
      'FCU Field Drone CubePilot - Location Control'
    );
    expect(result.description).toBe(
      'Control stream for MAVLink navigation commands'
    );
    expect(result.inputName).toBe('mavControl');
    expect(result.formats).toEqual([
      'application/json',
      'application/swe+json',
      'application/swe+csv',
      'application/swe+xml',
      'application/swe+binary',
    ]);
    expect(result.controlledProperties).toEqual([]);
    expect(result.live).toBe(true);
    expect(result.async).toBe(true);
    expect(result.links).toEqual([
      {
        rel: 'self',
        href: '/controlstreams/0o10',
        type: 'application/json',
      },
    ]);

    // Cross-reference fields extracted as typed properties
    expect(result.systemId).toBe('0o30');
    // Raw @link objects are still excluded (not part of the typed model)
    expect(result).not.toHaveProperty('system@link');
  });

  it('handles a minimal ControlStream with only required fields', () => {
    const input = {
      id: 'cs-minimal',
      name: 'Minimal Control',
      formats: ['application/json'],
      async: false,
    };

    const result: ControlStream = parseControlStream(input);

    expect(result.id).toBe('cs-minimal');
    expect(result.name).toBe('Minimal Control');
    expect(result.formats).toEqual(['application/json']);
    expect(result.async).toBe(false);
    expect(result.controlledProperties).toEqual([]);
    expect(result.issueTime).toBeNull();
    expect(result.executionTime).toBeNull();
    expect(result.live).toBeNull();
    expect(result.description).toBeUndefined();
    expect(result.inputName).toBeUndefined();
    expect(result.validTime).toBeUndefined();
  });

  it('parses all 3 time fields correctly (including "now" sentinel)', () => {
    const input = {
      id: 'cs-time',
      name: 'Time Test',
      formats: [],
      async: false,
      validTime: ['2026-01-14T04:49:19.134Z', 'now'],
      issueTime: [
        '2026-01-14T12:42:21.910Z',
        '2026-01-14T13:11:31.196Z',
      ],
      executionTime: [
        '2026-01-14T12:42:21.928Z',
        '2026-01-14T13:11:31.196Z',
      ],
    };

    const result: ControlStream = parseControlStream(input);

    // validTime: "now" sentinel → end is undefined
    expect(result.validTime?.start).toEqual(
      new Date('2026-01-14T04:49:19.134Z')
    );
    expect(result.validTime?.end).toBeUndefined();

    // issueTime: concrete start and end
    expect(result.issueTime?.start).toEqual(
      new Date('2026-01-14T12:42:21.910Z')
    );
    expect(result.issueTime?.end).toEqual(
      new Date('2026-01-14T13:11:31.196Z')
    );

    // executionTime: concrete start and end
    expect(result.executionTime?.start).toEqual(
      new Date('2026-01-14T12:42:21.928Z')
    );
    expect(result.executionTime?.end).toEqual(
      new Date('2026-01-14T13:11:31.196Z')
    );
  });

  it('normalizes controlledProperties from object and empty array forms', () => {
    // Object form with definition URIs
    const inputWithProps = {
      id: 'cs-props',
      name: 'Props Test',
      formats: [],
      async: false,
      controlledProperties: [
        {
          definition: 'http://sensorml.com/ont/swe/property/Location',
          label: 'Location',
        },
      ],
    };

    const resultWithProps: ControlStream =
      parseControlStream(inputWithProps);
    expect(resultWithProps.controlledProperties).toEqual([
      'http://sensorml.com/ont/swe/property/Location',
    ]);

    // Empty array (common in live OSH data)
    const inputEmpty = {
      id: 'cs-empty-props',
      name: 'Empty Props',
      formats: [],
      async: false,
      controlledProperties: [],
    };

    const resultEmpty: ControlStream = parseControlStream(inputEmpty);
    expect(resultEmpty.controlledProperties).toEqual([]);
  });

  it('omits optional fields when they are absent', () => {
    const input = {
      id: 'cs-no-optionals',
      name: 'No Optionals',
      formats: [],
      async: false,
    };

    const result: ControlStream = parseControlStream(input);

    expect(result).not.toHaveProperty('description');
    expect(result).not.toHaveProperty('inputName');
    expect(result).not.toHaveProperty('validTime');
  });

  it('defaults async to false when absent', () => {
    // async: true
    const inputTrue = {
      id: 'cs-async-true',
      name: 'Async True',
      formats: [],
      async: true,
    };
    expect(parseControlStream(inputTrue).async).toBe(true);

    // async: false
    const inputFalse = {
      id: 'cs-async-false',
      name: 'Async False',
      formats: [],
      async: false,
    };
    expect(parseControlStream(inputFalse).async).toBe(false);

    // async absent → defaults to false
    const inputAbsent = {
      id: 'cs-async-absent',
      name: 'Async Absent',
      formats: [],
    };
    expect(parseControlStream(inputAbsent).async).toBe(false);
  });

  it('throws on non-object input', () => {
    expect(() => parseControlStream(null)).toThrow(
      'parseControlStream: input must be a non-null object'
    );
    expect(() => parseControlStream(42)).toThrow(
      'parseControlStream: input must be a non-null object'
    );
    expect(() => parseControlStream('string')).toThrow(
      'parseControlStream: input must be a non-null object'
    );
  });
});

/**
 * Tests for parseCommand().
 *
 * Command has a unique time field asymmetry: `issueTime` is a string instant
 * (pass-through), while `executionTime` is a time interval parsed via
 * `parseValidTime()`. Fixtures derived from real OSH response data
 * (Smoke Test #10, Finding F31).
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html#_command_resources
 */
describe('parseCommand', () => {
  // Fixture derived from OSH Smoke Test #10 F31 response — full Command with all fields
  const fullCommandFixture = {
    id: '0o1qr7kupc33cgmqj0',
    'controlstream@id': '0o10',
    issueTime: '2026-01-14T12:42:21.910351Z',
    executionTime: [
      '2026-01-14T12:42:21.928726Z',
      '2026-01-14T12:42:25.000000Z',
    ],
    sender: 'urn:osh:process:datasink:commandstream#drone',
    currentStatus: 'COMPLETED',
    parameters: {
      locationVectorLLA: {
        Latitude: 24.180652098637896,
        Longitude: 120.64924139592034,
        AltitudeAGL: 105.0,
      },
      returnToStart: false,
      hoverSeconds: 0,
    },
    links: [
      {
        rel: 'self',
        href: '/commands/0o1qr7kupc33cgmqj0',
        type: 'application/json',
      },
    ],
  };

  it('extracts all fields from a full Command (cross-refs excluded)', () => {
    const result: Command = parseCommand(fullCommandFixture);

    expect(result.id).toBe('0o1qr7kupc33cgmqj0');
    expect(result.issueTime).toBe('2026-01-14T12:42:21.910351Z');
    expect(typeof result.issueTime).toBe('string');
    expect(result.sender).toBe(
      'urn:osh:process:datasink:commandstream#drone'
    );
    expect(result.currentStatus).toBe('COMPLETED');
    expect(result.parameters).toEqual({
      locationVectorLLA: {
        Latitude: 24.180652098637896,
        Longitude: 120.64924139592034,
        AltitudeAGL: 105.0,
      },
      returnToStart: false,
      hoverSeconds: 0,
    });
    expect(result.links).toEqual([
      {
        rel: 'self',
        href: '/commands/0o1qr7kupc33cgmqj0',
        type: 'application/json',
      },
    ]);

    // Cross-reference field extracted as typed property
    expect(result.controlStreamId).toBe('0o10');
  });

  it('handles a minimal Command with only required fields', () => {
    const input = {
      id: 'cmd-minimal',
      issueTime: '2026-01-14T12:42:21.910351Z',
      parameters: { action: 'takeoff' },
    };

    const result: Command = parseCommand(input);

    expect(result.id).toBe('cmd-minimal');
    expect(result.issueTime).toBe('2026-01-14T12:42:21.910351Z');
    expect(result.parameters).toEqual({ action: 'takeoff' });
    expect(result.executionTime).toBeUndefined();
    expect(result.sender).toBeUndefined();
    expect(result.currentStatus).toBeUndefined();
    expect(result.links).toBeUndefined();
  });

  it('normalizes a valid currentStatus via normalizeStatusCode()', () => {
    const input = {
      id: 'cmd-status-valid',
      issueTime: '2026-01-14T12:42:21.910351Z',
      parameters: {},
      currentStatus: 'COMPLETED',
    };

    const result: Command = parseCommand(input);

    expect(result.currentStatus).toBe('COMPLETED');
  });

  it('omits currentStatus when value is unrecognized', () => {
    const input = {
      id: 'cmd-status-invalid',
      issueTime: '2026-01-14T12:42:21.910351Z',
      parameters: {},
      currentStatus: 'UNKNOWN_STATUS',
    };

    const result: Command = parseCommand(input);

    expect(result.currentStatus).toBeUndefined();
    expect(result).not.toHaveProperty('currentStatus');
  });

  it('parses executionTime as a TimeInterval via parseValidTime()', () => {
    const input = {
      id: 'cmd-exec-time',
      issueTime: '2026-01-14T12:42:21.910351Z',
      parameters: {},
      executionTime: [
        '2026-01-14T12:42:21.928726Z',
        '2026-01-14T12:42:25.000000Z',
      ],
    };

    const result: Command = parseCommand(input);

    // executionTime is a TimeInterval (not a string)
    expect(result.executionTime?.start).toEqual(
      new Date('2026-01-14T12:42:21.928726Z')
    );
    expect(result.executionTime?.end).toEqual(
      new Date('2026-01-14T12:42:25.000000Z')
    );
  });

  it('omits executionTime when absent (command not yet executed)', () => {
    const input = {
      id: 'cmd-no-exec',
      issueTime: '2026-01-14T12:42:21.910351Z',
      parameters: {},
    };

    const result: Command = parseCommand(input);

    expect(result.executionTime).toBeUndefined();
    expect(result).not.toHaveProperty('executionTime');
  });

  it('passes through complex nested parameters exactly', () => {
    const nestedParams = {
      locationVectorLLA: {
        Latitude: 24.180652098637896,
        Longitude: 120.64924139592034,
        AltitudeAGL: 105.0,
      },
      returnToStart: false,
      hoverSeconds: 0,
    };
    const input = {
      id: 'cmd-params',
      issueTime: '2026-01-14T12:42:21.910351Z',
      parameters: nestedParams,
    };

    const result: Command = parseCommand(input);

    expect(result.parameters).toEqual(nestedParams);
  });

  it('throws on non-object input', () => {
    expect(() => parseCommand(null)).toThrow(
      'parseCommand: input must be a non-null object'
    );
    expect(() => parseCommand(42)).toThrow(
      'parseCommand: input must be a non-null object'
    );
    expect(() => parseCommand('string')).toThrow(
      'parseCommand: input must be a non-null object'
    );
  });
});

/**
 * Tests for normalizeStatusCode() utility.
 *
 * Shared utility used by parseCommand() (optional currentStatus) and
 * parseCommandStatus() (required statusCode). Validates against the
 * 9 CommandStatusCodes defined in model.ts.
 */
describe('normalizeStatusCode', () => {
  it('returns typed CommandStatusCode for valid codes', () => {
    expect(normalizeStatusCode('COMPLETED')).toBe('COMPLETED');
    expect(normalizeStatusCode('PENDING')).toBe('PENDING');
    expect(normalizeStatusCode('EXECUTING')).toBe('EXECUTING');
    expect(normalizeStatusCode('ACCEPTED')).toBe('ACCEPTED');
    expect(normalizeStatusCode('REJECTED')).toBe('REJECTED');
    expect(normalizeStatusCode('SCHEDULED')).toBe('SCHEDULED');
    expect(normalizeStatusCode('UPDATED')).toBe('UPDATED');
    expect(normalizeStatusCode('CANCELED')).toBe('CANCELED');
    expect(normalizeStatusCode('FAILED')).toBe('FAILED');
  });

  it('returns undefined for unrecognized strings', () => {
    expect(normalizeStatusCode('UNKNOWN')).toBeUndefined();
    expect(normalizeStatusCode('completed')).toBeUndefined();
    expect(normalizeStatusCode('')).toBeUndefined();
  });

  it('returns undefined for non-string input', () => {
    expect(normalizeStatusCode(42)).toBeUndefined();
    expect(normalizeStatusCode(true)).toBeUndefined();
    expect(normalizeStatusCode(null)).toBeUndefined();
    expect(normalizeStatusCode({})).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(normalizeStatusCode(undefined)).toBeUndefined();
  });
});

/**
 * Tests for parseCommandStatus().
 *
 * CommandStatus shares the time asymmetry with Command: `reportTime` is a
 * string instant (pass-through), `executionTime` is a time interval. The key
 * distinction is that `statusCode` is **required** with a `'PENDING'` fallback,
 * unlike `currentStatus` on Command which is optional.
 *
 * Fixtures derived from real OSH response data (Smoke Test #10, Finding F38).
 *
 * @see https://docs.ogc.org/is/23-002/23-002.html#_command_resources
 */
describe('parseCommandStatus', () => {
  // Fixture derived from OSH Smoke Test #10 F38 response — full CommandStatus
  const fullCommandStatusFixture = {
    id: '0o507bcujr5gcdi2racar7kupc33emq3o0',
    'command@id': '0o1qr7kupc33cgmqj0',
    reportTime: '2026-01-14T12:42:21.928728Z',
    statusCode: 'COMPLETED',
    percentCompletion: 100,
    executionTime: [
      '2026-01-14T12:42:21.928726Z',
      '2026-01-14T12:42:25.000000Z',
    ],
    message: 'Command executed successfully',
    links: [
      {
        rel: 'self',
        href: '/commandStatuses/0o507bcujr5gcdi2racar7kupc33emq3o0',
        type: 'application/json',
      },
    ],
  };

  it('extracts all fields from a full CommandStatus (cross-refs excluded)', () => {
    const result: CommandStatus = parseCommandStatus(
      fullCommandStatusFixture
    );

    expect(result.id).toBe('0o507bcujr5gcdi2racar7kupc33emq3o0');
    expect(result.reportTime).toBe('2026-01-14T12:42:21.928728Z');
    expect(typeof result.reportTime).toBe('string');
    expect(result.statusCode).toBe('COMPLETED');
    expect(result.percentCompletion).toBe(100);
    expect(result.executionTime?.start).toEqual(
      new Date('2026-01-14T12:42:21.928726Z')
    );
    expect(result.executionTime?.end).toEqual(
      new Date('2026-01-14T12:42:25.000000Z')
    );
    expect(result.message).toBe('Command executed successfully');
    expect(result.links).toEqual([
      {
        rel: 'self',
        href: '/commandStatuses/0o507bcujr5gcdi2racar7kupc33emq3o0',
        type: 'application/json',
      },
    ]);

    // Cross-reference field extracted as typed property
    expect(result.commandId).toBe('0o1qr7kupc33cgmqj0');
  });

  it('handles a minimal CommandStatus with only required fields', () => {
    const input = {
      id: 'cmdstatus-minimal',
      reportTime: '2026-01-14T12:42:21.928728Z',
      statusCode: 'PENDING',
    };

    const result: CommandStatus = parseCommandStatus(input);

    expect(result.id).toBe('cmdstatus-minimal');
    expect(result.reportTime).toBe('2026-01-14T12:42:21.928728Z');
    expect(result.statusCode).toBe('PENDING');
    expect(result.percentCompletion).toBeUndefined();
    expect(result.executionTime).toBeUndefined();
    expect(result.message).toBeUndefined();
    expect(result.links).toBeUndefined();
  });

  it('normalizes a valid statusCode via normalizeStatusCode()', () => {
    const input = {
      id: 'cs-valid-status',
      reportTime: '2026-01-14T12:42:21.928728Z',
      statusCode: 'COMPLETED',
    };

    const result: CommandStatus = parseCommandStatus(input);

    expect(result.statusCode).toBe('COMPLETED');
  });

  it('falls back to PENDING when statusCode is invalid or absent', () => {
    // Invalid status code
    const inputInvalid = {
      id: 'cs-invalid-status',
      reportTime: '2026-01-14T12:42:21.928728Z',
      statusCode: 'UNKNOWN_STATUS',
    };

    const resultInvalid: CommandStatus = parseCommandStatus(inputInvalid);
    expect(resultInvalid.statusCode).toBe('PENDING');
    expect(resultInvalid.statusCode).not.toBeUndefined();

    // Absent status code
    const inputAbsent = {
      id: 'cs-absent-status',
      reportTime: '2026-01-14T12:42:21.928728Z',
    };

    const resultAbsent: CommandStatus = parseCommandStatus(inputAbsent);
    expect(resultAbsent.statusCode).toBe('PENDING');
    expect(resultAbsent.statusCode).not.toBeUndefined();
  });

  it('extracts percentCompletion when present as a number', () => {
    const input = {
      id: 'cs-percent',
      reportTime: '2026-01-14T12:42:21.928728Z',
      statusCode: 'EXECUTING',
      percentCompletion: 75,
    };

    const result: CommandStatus = parseCommandStatus(input);

    expect(result.percentCompletion).toBe(75);
  });

  it('parses executionTime as a TimeInterval via parseValidTime()', () => {
    const input = {
      id: 'cs-exec-time',
      reportTime: '2026-01-14T12:42:21.928728Z',
      statusCode: 'COMPLETED',
      executionTime: [
        '2026-01-14T12:42:21.928726Z',
        '2026-01-14T12:42:25.000000Z',
      ],
    };

    const result: CommandStatus = parseCommandStatus(input);

    expect(result.executionTime?.start).toEqual(
      new Date('2026-01-14T12:42:21.928726Z')
    );
    expect(result.executionTime?.end).toEqual(
      new Date('2026-01-14T12:42:25.000000Z')
    );
  });

  it('throws on non-object input', () => {
    expect(() => parseCommandStatus(null)).toThrow(
      'parseCommandStatus: input must be a non-null object'
    );
    expect(() => parseCommandStatus(42)).toThrow(
      'parseCommandStatus: input must be a non-null object'
    );
    expect(() => parseCommandStatus('string')).toThrow(
      'parseCommandStatus: input must be a non-null object'
    );
  });
});
