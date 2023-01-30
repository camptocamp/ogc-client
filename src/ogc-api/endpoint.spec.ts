import OgcApiEndpoint from './endpoint';
import { readFile } from 'fs/promises';
import * as path from 'path';

const FIXTURES_ROOT = path.join(__dirname, '../../fixtures/ogc-api');

// setup fetch to read local fixtures
beforeAll(() => {
  window.fetch = (urlOrInfo) =>
    new Promise(async (resolve) => {
      const url = new URL(
        urlOrInfo instanceof URL || typeof urlOrInfo === 'string'
          ? urlOrInfo
          : urlOrInfo.url
      );
      const queryPath = url.pathname;
      const format = url.searchParams.get('f') || 'html';
      const filePath = `${path.join(FIXTURES_ROOT, queryPath)}.${format}`;
      const contents = await readFile(filePath, {
        encoding: 'utf8',
      });
      resolve({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve(JSON.parse(contents)),
      } as Response);
    });
});

describe('OgcApiEndpoint', () => {
  let endpoint: OgcApiEndpoint;
  describe('nominal case', () => {
    beforeEach(() => {
      endpoint = new OgcApiEndpoint('http://local/sample-data');
    });
    describe('#info', () => {
      it('returns endpoint info', async () => {
        await expect(endpoint.info).resolves.toEqual({
          title: 'OS Open Zoomstack',
          description:
            'OS Open Zoomstack is a comprehensive vector basemap showing coverage of Great Britain at a national level, right down to street-level detail.',
          attribution:
            'Contains OS data © Crown copyright and database right 2021.',
        });
      });
    });
    describe('#conformanceClasses', () => {
      it('returns conformance classes', async () => {
        await expect(endpoint.conformanceClasses).resolves.toEqual([
          'http://www.opengis.net/spec/cql2/0.0/conf/advanced-comparison-operators',
          'http://www.opengis.net/spec/cql2/0.0/conf/array-operators',
          'http://www.opengis.net/spec/cql2/0.0/conf/basic-cql2',
          'http://www.opengis.net/spec/cql2/0.0/conf/basic-spatial-operators',
          'http://www.opengis.net/spec/cql2/0.0/conf/case-insensitive-comparison',
          'http://www.opengis.net/spec/cql2/0.0/conf/cql2-json',
          'http://www.opengis.net/spec/cql2/0.0/conf/cql2-text',
          'http://www.opengis.net/spec/cql2/0.0/conf/property-property',
          'http://www.opengis.net/spec/cql2/0.0/conf/spatial-operators',
          'http://www.opengis.net/spec/cql2/0.0/conf/temporal-operators',
          'http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/core',
          'http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/html',
          'http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/json',
          'http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/oas30',
          'http://www.opengis.net/spec/ogcapi-common-2/0.0/conf/collections',
          'http://www.opengis.net/spec/ogcapi-common-2/0.0/conf/html',
          'http://www.opengis.net/spec/ogcapi-common-2/0.0/conf/json',
          'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
          'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson',
          'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/html',
          'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30',
          'http://www.opengis.net/spec/ogcapi-features-2/1.0/conf/crs',
          'http://www.opengis.net/spec/ogcapi-features-3/0.0/conf/features-filter',
          'http://www.opengis.net/spec/ogcapi-features-3/0.0/conf/filter',
          'http://www.opengis.net/spec/ogcapi-styles-1/0.0/conf/core',
          'http://www.opengis.net/spec/ogcapi-styles-1/0.0/conf/manage-styles',
          'http://www.opengis.net/spec/ogcapi-styles-1/0.0/conf/mapbox-styles',
          'http://www.opengis.net/spec/ogcapi-styles-1/0.0/conf/sld-10',
          'http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/core',
          'http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/dataset-tilesets',
          'http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/mvt',
          'http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/tileset',
          'http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/tilesets-list',
          'http://www.opengis.net/spec/tms/2.0/conf/json-tilematrixset',
          'http://www.opengis.net/spec/tms/2.0/conf/json-tilematrixsetlimits',
          'http://www.opengis.net/spec/tms/2.0/conf/json-tilesetmetadata',
          'http://www.opengis.net/spec/tms/2.0/conf/tilematrixset',
          'http://www.opengis.net/spec/tms/2.0/conf/tilematrixsetlimits',
          'http://www.opengis.net/spec/tms/2.0/conf/tilesetmetadata',
          'http://www.opengis.net/spec/ogcapi-records-1/1.0/conf/html',
          'http://www.opengis.net/spec/ogcapi-records-1/1.0/conf/json',
          'http://www.opengis.net/spec/ogcapi-records-1/1.0/conf/core',
          'http://www.opengis.net/spec/ogcapi-records-1/1.0/conf/opensearch',
          'http://www.opengis.net/spec/ogcapi-records-1/1.0/conf/sorting',
        ]);
      });
    });
    describe('#allCollections', () => {
      it('returns collection ids', async () => {
        await expect(endpoint.allCollections).resolves.toEqual([
          'airports',
          'boundaries',
          'contours',
          'district_buildings',
          'etl',
          'foreshore',
          'greenspace',
          'land',
          'local_buildings',
          'names',
          'national_parks',
          'rail',
          'railway_stations',
          'roads_local',
          'roads_national',
          'roads_regional',
          'sites',
          'surfacewater',
          'urban_areas',
          'waterlines',
          'woodland',
          'dutch-metadata',
        ]);
      });
    });
    describe('#featureCollections', () => {
      it('returns collection ids', async () => {
        await expect(endpoint.featureCollections).resolves.toEqual([
          'airports',
          'boundaries',
          'contours',
          'district_buildings',
          'etl',
          'foreshore',
          'greenspace',
          'land',
          'local_buildings',
          'names',
          'national_parks',
          'rail',
          'railway_stations',
          'roads_local',
          'roads_national',
          'roads_regional',
          'sites',
          'surfacewater',
          'urban_areas',
          'waterlines',
          'woodland',
        ]);
      });
    });
    describe('#recordCollections', () => {
      it('returns collection ids', async () => {
        await expect(endpoint.recordCollections).resolves.toEqual([
          'dutch-metadata',
        ]);
      });
    });
    describe('#hasTiles', () => {
      it('returns true', async () => {
        await expect(endpoint.hasTiles).resolves.toBe(true);
      });
    });
    describe('#hasStyles', () => {
      it('returns true', async () => {
        await expect(endpoint.hasStyles).resolves.toBe(true);
      });
    });
    describe('#hasFeatures', () => {
      it('returns true', async () => {
        await expect(endpoint.hasFeatures).resolves.toBe(true);
      });
    });
    describe('#hasRecords', () => {
      it('returns true', async () => {
        await expect(endpoint.hasRecords).resolves.toBe(true);
      });
    });
    describe('#getCollectionInfo', () => {
      it('returns airports collection info', async () => {
        await expect(
          endpoint.getCollectionInfo('airports')
        ).resolves.toStrictEqual({
          title: 'Airports',
          description:
            'A centre point for all major airports including a name.',
          id: 'airports',
          extent: {
            spatial: {
              bbox: [
                [
                  -7.942759150065165,
                  49.901607895996534,
                  1.9957427933628138,
                  60.133709755754,
                ],
              ],
              crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
            },
          },
          itemType: 'feature',
          crs: [
            'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
            'http://www.opengis.net/def/crs/EPSG/0/27700',
            'http://www.opengis.net/def/crs/EPSG/0/4258',
            'http://www.opengis.net/def/crs/EPSG/0/4326',
            'http://www.opengis.net/def/crs/EPSG/0/3857',
          ],
          storageCrs: 'http://www.opengis.net/def/crs/EPSG/0/27700',
          itemCount: 46,
        });
      });
      it('returns dutch-metadata collection info', async () => {
        await expect(
          endpoint.getCollectionInfo('dutch-metadata')
        ).resolves.toStrictEqual({
          id: 'dutch-metadata',
          title: 'Sample metadata records from Dutch Nationaal georegister',
          description:
            'Sample metadata records from Dutch Nationaal georegister',
          keywords: ['netherlands', 'open data', 'georegister'],
          extent: {
            spatial: {
              bbox: [[3.37, 50.75, 7.21, 53.47]],
              crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
            },
          },
          itemType: 'record',
        });
      });
      it('returns roads_national collection info', async () => {
        await expect(
          endpoint.getCollectionInfo('roads_national')
        ).resolves.toStrictEqual({
          title: 'National Roads',
          description:
            'Lines representing the road network. A road is defined as a metalled way for vehicles.',
          id: 'roads_national',
          extent: {
            spatial: {
              bbox: [
                [
                  -6.4956758012099645,
                  50.08021976237488,
                  2.383883951687144,
                  58.54688148276149,
                ],
              ],
              crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
            },
          },
          itemType: 'feature',
          crs: [
            'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
            'http://www.opengis.net/def/crs/EPSG/0/27700',
            'http://www.opengis.net/def/crs/EPSG/0/4258',
            'http://www.opengis.net/def/crs/EPSG/0/4326',
            'http://www.opengis.net/def/crs/EPSG/0/3857',
          ],
          storageCrs: 'http://www.opengis.net/def/crs/EPSG/0/27700',
          itemCount: 123905,
        });
      });
    });
  });
});
