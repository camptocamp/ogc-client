import {
  CSAPI_PART1_CONFORMANCE_PREFIX,
  CSAPI_PART2_CONFORMANCE_PREFIX,
  checkHasConnectedSystems,
  parseCollectionParameters,
} from './info.js';

describe('info parsing utilities', () => {
  describe('parseCollectionParameters', () => {
    let doc;
    describe('with a dictionary', () => {
      beforeEach(() => {
        doc = {
          title: 'Airports',
          description:
            'A centre point for all major airports including a name.',
          properties: {
            name: {
              title: 'Name',
              type: 'string',
            },
            creationDate: {
              type: 'date',
            },
            geom: {
              $ref: 'https://geojson.org/schema/Point.json',
              title: 'Point',
            },
            geom2: {
              $ref: 'https://geojson.org/schema/Polygon.json',
            },
            geom3: {
              $ref: 'https://geojson.org/schema/LineString.json',
            },
            geom4: {
              $ref: 'https://geojson.org/schema/Geometry.json',
            },
          },
          additionalProperties: false,
          type: 'object',
          $schema: 'https://json-schema.org/draft/2019-09/schema',
          $id: 'https://my.server.org/sample-data/collections/airports/queryables',
        };
      });
      it('parses the parameters', () => {
        expect(parseCollectionParameters(doc)).toEqual([
          { name: 'name', title: 'Name', type: 'string' },
          { name: 'creationDate', type: 'date' },
          { name: 'geom', type: 'point', title: 'Point' },
          { name: 'geom2', type: 'polygon' },
          { name: 'geom3', type: 'linestring' },
          { name: 'geom4', type: 'geometry' },
        ]);
      });
    });
    describe('with an array of values', () => {
      beforeEach(() => {
        doc = [
          'relevance',
          'dateStamp',
          'createDate',
          'resourceTitleObject.default.keyword',
          'rating',
          'popularity',
        ];
      });
      it('parses the parameters, assuming string type', () => {
        expect(parseCollectionParameters(doc)).toEqual([
          { name: 'relevance', type: 'string' },
          { name: 'dateStamp', type: 'string' },
          { name: 'createDate', type: 'string' },
          { name: 'resourceTitleObject.default.keyword', type: 'string' },
          { name: 'rating', type: 'string' },
          { name: 'popularity', type: 'string' },
        ]);
      });
    });
  });

  describe('checkHasConnectedSystems', () => {
    it('exports the canonical Part 1 and Part 2 URI prefixes', () => {
      expect(CSAPI_PART1_CONFORMANCE_PREFIX).toBe(
        'http://www.opengis.net/spec/ogcapi-connectedsystems-1/'
      );
      expect(CSAPI_PART2_CONFORMANCE_PREFIX).toBe(
        'http://www.opengis.net/spec/ogcapi-connectedsystems-2/'
      );
    });

    // Captured live from https://129-80-248-53.sslip.io/csapi-go/conformance
    // on 2026-04-29. csapi-go is the OGC reference Go implementation; it follows
    // the published OGC 23-001/23-002 standards and declares NEITHER /conf/core
    // nor /conf/dynamic-data. Issue #186.
    const csgoConformance = [
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson',
      'http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-common-2/1.0/conf/collections',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/api-common',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/system',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/deployment',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/procedure',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/sf',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/property',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/subsystem',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/geojson',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/advanced-filtering',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/api-common',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/datastream',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/observation',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/controlstream',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/command',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/create-replace-delete',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/system-event',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/system-history',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/json',
    ];

    // Captured live from http://45.55.99.236:8080/sensorhub/api/conformance on
    // 2026-04-29. OSH declares a non-spec /conf/core class (regression case)
    // alongside the spec-correct identifiers.
    const oshConformance = [
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/system',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/deployment',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/procedure',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/sf',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/property',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/sensorml',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/geojson',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/datastream',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/controlstream',
      'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/json',
    ];

    const featuresOnlyConformance = [
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson',
      'http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/core',
    ];

    it('returns true for csapi-go (spec-conformant: no /conf/core, no /conf/dynamic-data)', () => {
      expect(checkHasConnectedSystems([csgoConformance])).toBe(true);
    });

    it('returns true for OSH (declares non-spec /conf/core; regression)', () => {
      expect(checkHasConnectedSystems([oshConformance])).toBe(true);
    });

    it('returns true when only Part 2 classes are declared', () => {
      expect(
        checkHasConnectedSystems([
          [
            'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
            'http://www.opengis.net/spec/ogcapi-connectedsystems-2/1.0/conf/datastream',
          ],
        ])
      ).toBe(true);
    });

    it('returns true for legacy draft-era /conf/core declaration', () => {
      expect(
        checkHasConnectedSystems([
          [
            'http://www.opengis.net/spec/ogcapi-connectedsystems-1/1.0/conf/core',
          ],
        ])
      ).toBe(true);
    });

    it('returns false for a Features-only server', () => {
      expect(checkHasConnectedSystems([featuresOnlyConformance])).toBe(false);
    });

    it('returns false for an empty conformance list', () => {
      expect(checkHasConnectedSystems([[]])).toBe(false);
    });
  });
});
