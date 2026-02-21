import {
  CSAPIResourceTypes,
  CommandStatusCodes,
  SystemTypeUris,
} from './model.js';
import type {
  CSAPIResourceType,
  CommandStatusCode,
  SystemTypeUri,
  System,
  Deployment,
  Procedure,
  SamplingFeature,
  Property,
  Datastream,
  Observation,
  ControlStream,
  Command,
  CommandStatus,
  QueryOptions,
  SystemQueryOptions,
  PropertyQueryOptions,
  FeatureCollection,
  ItemCollection,
} from './model.js';

describe('CSAPIResourceTypes', () => {
  test('contains exactly 9 resource types', () => {
    expect(CSAPIResourceTypes).toHaveLength(9);
  });

  test('includes all Part 1 resource types', () => {
    const part1: CSAPIResourceType[] = [
      'systems',
      'deployments',
      'samplingFeatures',
      'procedures',
      'properties',
    ];
    part1.forEach((rt) => {
      expect(CSAPIResourceTypes).toContain(rt);
    });
  });

  test('includes all Part 2 resource types', () => {
    const part2: CSAPIResourceType[] = [
      'datastreams',
      'observations',
      'controlStreams',
      'commands',
    ];
    part2.forEach((rt) => {
      expect(CSAPIResourceTypes).toContain(rt);
    });
  });

  test('values are unique', () => {
    const unique = new Set(CSAPIResourceTypes);
    expect(unique.size).toBe(CSAPIResourceTypes.length);
  });
});

describe('CommandStatusCodes', () => {
  test('contains exactly 9 status codes', () => {
    expect(CommandStatusCodes).toHaveLength(9);
  });

  test('includes all defined status codes', () => {
    const expected: CommandStatusCode[] = [
      'PENDING',
      'ACCEPTED',
      'REJECTED',
      'SCHEDULED',
      'UPDATED',
      'CANCELED',
      'EXECUTING',
      'FAILED',
      'COMPLETED',
    ];
    expected.forEach((code) => {
      expect(CommandStatusCodes).toContain(code);
    });
  });

  test('values are unique', () => {
    const unique = new Set(CommandStatusCodes);
    expect(unique.size).toBe(CommandStatusCodes.length);
  });
});

describe('SystemTypeUris', () => {
  test('contains exactly 5 system type URIs', () => {
    expect(SystemTypeUris).toHaveLength(5);
  });

  test('includes all SOSA system types', () => {
    const expected: SystemTypeUri[] = [
      'http://www.w3.org/ns/sosa/Sensor',
      'http://www.w3.org/ns/sosa/Actuator',
      'http://www.w3.org/ns/sosa/Platform',
      'http://www.w3.org/ns/sosa/Sampler',
      'http://www.w3.org/ns/sosa/System',
    ];
    expected.forEach((uri) => {
      expect(SystemTypeUris).toContain(uri);
    });
  });

  test('all URIs use the SOSA namespace', () => {
    SystemTypeUris.forEach((uri) => {
      expect(uri).toMatch(/^http:\/\/www\.w3\.org\/ns\/sosa\//);
    });
  });
});

describe('Type compatibility - Part 1 GeoJSON resources', () => {
  test('System satisfies the interface contract', () => {
    const system: System = {
      id: 'sys-001',
      type: 'Feature',
      properties: {
        featureType: 'http://www.w3.org/ns/sosa/Sensor',
        uid: 'urn:example:sensor:001',
        name: 'Temperature Sensor',
      },
      geometry: { type: 'Point', coordinates: [0, 0] },
      links: [],
    };
    expect(system.type).toBe('Feature');
    expect(system.properties.featureType).toBe(
      'http://www.w3.org/ns/sosa/Sensor'
    );
    expect(system.properties.uid).toBe('urn:example:sensor:001');
    expect(system.properties.name).toBe('Temperature Sensor');
  });

  test('System with optional properties', () => {
    const system: System = {
      id: 'sys-002',
      type: 'Feature',
      properties: {
        featureType: 'http://www.w3.org/ns/sosa/Platform',
        uid: 'urn:example:platform:002',
        name: 'Weather Station',
        description: 'An automated weather station',
        assetType: 'Equipment',
        validTime: { start: new Date('2024-01-01') },
      },
      geometry: null,
      links: [{ rel: 'self', type: 'application/geo+json', title: '', href: '/systems/sys-002' }],
    };
    expect(system.properties.assetType).toBe('Equipment');
    expect(system.properties.validTime?.start).toBeInstanceOf(Date);
  });

  test('Deployment requires validTime', () => {
    const deployment: Deployment = {
      id: 'dep-001',
      type: 'Feature',
      properties: {
        featureType: 'http://www.w3.org/ns/sosa/Deployment',
        uid: 'urn:example:deployment:001',
        name: 'Field Campaign 2024',
        validTime: {
          start: new Date('2024-06-01'),
          end: new Date('2024-12-31'),
        },
      },
      geometry: { type: 'Point', coordinates: [10, 50] },
      links: [],
    };
    expect(deployment.properties.validTime.start).toBeInstanceOf(Date);
    expect(deployment.properties.validTime.end).toBeInstanceOf(Date);
  });

  test('Procedure geometry is always null', () => {
    const procedure: Procedure = {
      id: 'proc-001',
      type: 'Feature',
      properties: {
        featureType: 'http://www.w3.org/ns/sosa/Sensor',
        uid: 'urn:example:procedure:001',
        name: 'Temperature Measurement',
      },
      geometry: null,
      links: [],
    };
    expect(procedure.geometry).toBeNull();
  });

  test('SamplingFeature satisfies the interface contract', () => {
    const sf: SamplingFeature = {
      id: 'sf-001',
      type: 'Feature',
      properties: {
        featureType: 'http://www.w3.org/ns/sosa/Sample',
        uid: 'urn:example:sf:001',
        name: 'Monitoring Well A',
      },
      geometry: { type: 'Point', coordinates: [5, 45] },
      links: [{ rel: 'sampledFeature', type: '', title: '', href: '/features/land-001' }],
    };
    expect(sf.type).toBe('Feature');
    expect(sf.links).toHaveLength(1);
  });
});

describe('Type compatibility - Property (non-GeoJSON)', () => {
  test('Property satisfies the interface contract', () => {
    const prop: Property = {
      label: 'Air Temperature',
      uniqueId: 'urn:example:property:air-temp',
      baseProperty: 'http://vocab.nerc.ac.uk/collection/P01/current/TEMPPR01/',
    };
    expect(prop.label).toBe('Air Temperature');
    expect(prop.uniqueId).toBe('urn:example:property:air-temp');
    expect(prop.baseProperty).toContain('TEMPPR01');
  });

  test('Property with optional fields', () => {
    const prop: Property = {
      id: 'prop-001',
      label: 'Mean Air Temperature',
      description: 'Mean temperature measured over 10 minutes',
      uniqueId: 'urn:example:property:mean-air-temp',
      baseProperty: 'http://vocab.nerc.ac.uk/collection/P01/current/TEMPPR01/',
      objectType: 'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement',
      statistic: 'http://www.opengis.net/def/property/OGC/0/Mean',
    };
    expect(prop.id).toBe('prop-001');
    expect(prop.statistic).toContain('Mean');
  });
});

describe('Type compatibility - Part 2 resources', () => {
  test('Datastream satisfies the interface contract', () => {
    const ds: Datastream = {
      id: 'ds-001',
      name: 'Temperature Observations',
      formats: ['application/json'],
      observedProperties: ['urn:example:property:air-temp'],
      phenomenonTime: {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      },
      resultTime: {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      },
      resultType: 'measure',
      live: true,
      links: [],
    };
    expect(ds.live).toBe(true);
    expect(ds.observedProperties).toHaveLength(1);
    expect(ds.resultType).toBe('measure');
  });

  test('Observation satisfies the interface contract', () => {
    const obs: Observation = {
      id: 'obs-001',
      resultTime: '2024-06-15T12:00:00Z',
      result: 23.5,
    };
    expect(obs.resultTime).toBe('2024-06-15T12:00:00Z');
    expect(obs.result).toBe(23.5);
  });

  test('ControlStream satisfies the interface contract', () => {
    const cs: ControlStream = {
      id: 'cs-001',
      name: 'Actuator Commands',
      formats: ['application/json'],
      controlledProperties: ['urn:example:property:angle'],
      issueTime: null,
      executionTime: null,
      live: false,
      async: true,
      links: [],
    };
    expect(cs.async).toBe(true);
    expect(cs.controlledProperties).toHaveLength(1);
  });

  test('Command satisfies the interface contract', () => {
    const cmd: Command = {
      id: 'cmd-001',
      issueTime: '2024-06-15T12:00:00Z',
      parameters: { angle: 45, speed: 'fast' },
    };
    expect(cmd.parameters).toHaveProperty('angle', 45);
    expect(cmd.parameters).toHaveProperty('speed', 'fast');
  });

  test('CommandStatus satisfies the interface contract', () => {
    const status: CommandStatus = {
      id: 'status-001',
      reportTime: '2024-06-15T12:00:01Z',
      statusCode: 'ACCEPTED',
    };
    expect(status.statusCode).toBe('ACCEPTED');
    expect(CommandStatusCodes).toContain(status.statusCode);
  });

  test('CommandStatus with optional fields', () => {
    const status: CommandStatus = {
      id: 'status-002',
      reportTime: '2024-06-15T12:05:00Z',
      statusCode: 'EXECUTING',
      percentCompletion: 42,
      message: 'Processing angle adjustment',
    };
    expect(status.percentCompletion).toBe(42);
    expect(status.message).toContain('angle');
  });
});

describe('Type compatibility - Query options', () => {
  test('QueryOptions base interface', () => {
    const opts: QueryOptions = {
      limit: 10,
      offset: 0,
      bbox: [0, 0, 10, 10],
      q: 'temperature',
    };
    expect(opts.limit).toBe(10);
    expect(opts.bbox).toHaveLength(4);
  });

  test('QueryOptions supports uid parameter', () => {
    const opts: QueryOptions = {
      uid: 'urn:example:sensor:001',
    };
    expect(opts.uid).toBe('urn:example:sensor:001');

    const optsArray: QueryOptions = {
      uid: ['urn:example:sensor:001', 'urn:example:sensor:002'],
    };
    expect(optsArray.uid).toHaveLength(2);
  });

  test('SystemQueryOptions extends QueryOptions', () => {
    const opts: SystemQueryOptions = {
      limit: 50,
      parent: 'sys-parent-001',
      procedureId: 'proc-001',
      observedPropertyId: 'urn:example:property:temp',
      recursive: true,
    };
    expect(opts.parent).toBe('sys-parent-001');
    expect(opts.recursive).toBe(true);
  });

  test('PropertyQueryOptions supports system and baseProperty parameters', () => {
    const opts: PropertyQueryOptions = {
      system: 'sys-001',
      baseProperty: 'urn:qudt:Temperature',
      limit: 20,
      q: 'temperature',
    };
    expect(opts.system).toBe('sys-001');
    expect(opts.baseProperty).toBe('urn:qudt:Temperature');
    expect(opts.limit).toBe(20);
  });
});

describe('Type compatibility - Collection types', () => {
  test('FeatureCollection wraps GeoJSON features', () => {
    const collection: FeatureCollection<System> = {
      type: 'FeatureCollection',
      features: [
        {
          id: 'sys-001',
          type: 'Feature',
          properties: {
            featureType: 'http://www.w3.org/ns/sosa/Sensor',
            uid: 'urn:example:sensor:001',
            name: 'Sensor 1',
          },
          links: [],
        },
      ],
      links: [],
      numberReturned: 1,
      numberMatched: 1,
    };
    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(1);
    expect(collection.numberReturned).toBe(1);
  });

  test('ItemCollection wraps Part 2 resources', () => {
    const collection: ItemCollection<Observation> = {
      items: [
        {
          id: 'obs-001',
          resultTime: '2024-06-15T12:00:00Z',
          result: 23.5,
        },
      ],
      links: [],
      numberReturned: 1,
    };
    expect(collection.items).toHaveLength(1);
    expect(collection.numberReturned).toBe(1);
  });
});
