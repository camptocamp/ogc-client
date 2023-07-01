import { parseCollectionParameters } from './info';

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
});
