import { createCSAPIBuilder } from './factory.js';
import CSAPIQueryBuilder from './url_builder.js';
import type { CSAPICollectionRef } from './model.js';

/** Convenience helper: build a `links` array with CSAPI-conformant rels. */
const csapiLink = (rel: string, href: string) => ({
  rel,
  type: 'application/json',
  title: rel,
  href,
});

describe('createCSAPIBuilder (value-shaped)', () => {
  const collectionWithCsapiLinks: CSAPICollectionRef = {
    id: 'iot-sensors',
    title: 'IoT Sensors',
    links: [
      csapiLink(
        'self',
        'http://local/csapi/sample-data-hub/collections/iot-sensors'
      ),
      csapiLink('ogc-cs:systems', 'http://local/csapi/sample-data-hub/systems'),
      csapiLink(
        'ogc-cs:deployments',
        'http://local/csapi/sample-data-hub/deployments'
      ),
      csapiLink(
        'ogc-cs:datastreams',
        'http://local/csapi/sample-data-hub/datastreams'
      ),
    ],
  };

  const collectionWithoutCsapiLinks: CSAPICollectionRef = {
    id: 'weather-stations',
    links: [
      csapiLink('self', 'http://local/csapi/sample-data-hub/weather-stations'),
    ],
  };

  it('returns a CSAPIQueryBuilder whose availableResources reflects collection links', () => {
    const builder = createCSAPIBuilder(
      collectionWithCsapiLinks,
      new Map<string, string>()
    );

    expect(builder).toBeInstanceOf(CSAPIQueryBuilder);
    expect(builder.availableResources).toEqual(
      new Set(['systems', 'deployments', 'datastreams'])
    );
  });

  it('returns a builder with empty availableResources when the collection has no CSAPI links', () => {
    const builder = createCSAPIBuilder(
      collectionWithoutCsapiLinks,
      new Map<string, string>()
    );

    expect(builder).toBeInstanceOf(CSAPIQueryBuilder);
    expect(builder.availableResources).toEqual(new Set());
  });

  it('accepts a ReadonlyMap of resource URLs without mutating it', () => {
    const resourceUrls = new Map<string, string>([
      ['systems', 'http://local/csapi/top-level/systems'],
    ]);
    const readonlyView: ReadonlyMap<string, string> = resourceUrls;

    const builder = createCSAPIBuilder(collectionWithCsapiLinks, readonlyView);

    expect(builder).toBeInstanceOf(CSAPIQueryBuilder);

    // Mutating the original map after construction must not affect the
    // builder's URL output (verifies the defensive `new Map(...)` copy
    // in the factory).
    const before = builder.getSystems();
    resourceUrls.set('systems', 'http://attacker.example/systems');
    const after = builder.getSystems();
    expect(after).toBe(before);
    expect(after).toContain('http://local/csapi/top-level/systems');
  });

  it('builds independent builders for distinct collections', () => {
    const collectionA: CSAPICollectionRef = {
      id: 'alpha-sensors',
      links: [
        csapiLink('self', 'http://local/csapi/multi-hub/alpha'),
        csapiLink(
          'ogc-cs:systems',
          'http://local/csapi/multi-hub/alpha/systems'
        ),
      ],
    };
    const collectionB: CSAPICollectionRef = {
      id: 'beta-network',
      links: [
        csapiLink('self', 'http://local/csapi/multi-hub/beta'),
        csapiLink(
          'ogc-cs:systems',
          'http://local/csapi/multi-hub/beta/systems'
        ),
        csapiLink(
          'ogc-cs:datastreams',
          'http://local/csapi/multi-hub/beta/datastreams'
        ),
      ],
    };

    const builderA = createCSAPIBuilder(collectionA, new Map());
    const builderB = createCSAPIBuilder(collectionB, new Map());

    expect(builderA.availableResources).toEqual(new Set(['systems']));
    expect(builderB.availableResources).toEqual(
      new Set(['systems', 'datastreams'])
    );
  });

  it('is a pure synchronous factory (no awaits, no I/O)', () => {
    const builder = createCSAPIBuilder(collectionWithCsapiLinks, new Map());

    // Pure factory: returns a builder synchronously, not a Promise.
    expect(builder).not.toBeInstanceOf(Promise);
    expect(builder).toBeInstanceOf(CSAPIQueryBuilder);
  });
});
