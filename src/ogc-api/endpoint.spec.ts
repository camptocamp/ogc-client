import OgcApiEndpoint from './endpoint.js';
import { readFile, stat } from 'fs/promises';
import * as path from 'path';
import { EndpointError } from '../shared/errors.js';

const FIXTURES_ROOT = path.join(__dirname, '../../fixtures/ogc-api');

// setup fetch to read local fixtures
beforeAll(() => {
  window.fetch = jest.fn().mockImplementation(async (urlOrInfo) => {
    const url = new URL(
      urlOrInfo instanceof URL || typeof urlOrInfo === 'string'
        ? urlOrInfo
        : urlOrInfo.url
    );

    // if we're on the root path (e.g. /sample-data/), only answer if there's a trailing slash
    // this is made to mimic the behavior of a webapp deployed on http://host.com/webapp/, where
    // querying http://host.com/webapp would return a 404
    if (url.pathname.split('/').length === 2 && !url.pathname.endsWith('/')) {
      return {
        ok: false,
        status: 404,
        headers: new Headers(),
        clone: function () {
          return this;
        },
      } as Response;
    }

    const queryPath = url.pathname.replace(/\/$/, ''); // remove trailing slash
    const format = url.searchParams.get('f') || 'html';
    const filePath = `${path.join(FIXTURES_ROOT, queryPath)}.${format}`;
    try {
      await stat(filePath);
    } catch (e) {
      return {
        ok: false,
        status: 404,
        headers: new Headers(),
        clone: function () {
          return this;
        },
      } as Response;
    }
    const contents = await readFile(filePath, {
      encoding: 'utf8',
    });
    return {
      ok: true,
      headers: new Headers(),
      clone: function () {
        return this;
      },
      json: () =>
        new Promise((resolve) => {
          resolve(JSON.parse(contents));
        }),
    } as Response;
  });
});

jest.useFakeTimers();

describe('OgcApiEndpoint', () => {
  let endpoint: OgcApiEndpoint;

  afterEach(async () => {
    // this will exhaust all microtasks, effectively preventing rejected promises from leaking between tests
    await jest.runAllTimersAsync();
  });

  describe('nominal case', () => {
    beforeEach(() => {
      endpoint = new OgcApiEndpoint('http://local/sample-data/');
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
      it('uses shared fetch', async () => {
        jest.clearAllMocks();
        // create the endpoint three times separately
        new OgcApiEndpoint('http://local/sample-data/').info;
        new OgcApiEndpoint('http://local/sample-data/').info;
        new OgcApiEndpoint('http://local/sample-data/').info;
        expect(window.fetch).toHaveBeenCalledTimes(1);
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
          { name: 'airports', hasFeatures: true },
          { name: 'boundaries', hasFeatures: true },
          { name: 'contours', hasFeatures: true },
          { name: 'district_buildings', hasFeatures: true },
          { name: 'etl', hasFeatures: true },
          { name: 'foreshore', hasFeatures: true },
          { name: 'greenspace', hasFeatures: true },
          { name: 'land', hasFeatures: true },
          { name: 'local_buildings', hasFeatures: true },
          { name: 'names', hasFeatures: true },
          { name: 'national_parks', hasFeatures: true },
          { name: 'rail', hasFeatures: true },
          { name: 'railway_stations', hasFeatures: true },
          { name: 'roads_local', hasFeatures: true },
          { name: 'roads_national', hasFeatures: true },
          { name: 'roads_regional', hasFeatures: true },
          { name: 'sites', hasFeatures: true },
          { name: 'surfacewater', hasFeatures: true },
          { name: 'urban_areas', hasFeatures: true },
          { name: 'waterlines', hasFeatures: true },
          { name: 'woodland', hasFeatures: true },
          { name: 'dutch-metadata', hasRecords: true },
          { name: 'missing-feature-type-metadata', hasFeatures: true },
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
          'missing-feature-type-metadata',
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
          itemFormats: [
            'text/html',
            'application/vnd.ogc.fg+json',
            'application/geo+json',
            'application/flatgeobuf',
            'application/vnd.ogc.fg+json;compatibility=geojson',
          ],
          bulkDownloadLinks: {},
          jsonDownloadLink: null,
          extent: {
            spatial: {
              bbox: [
                [
                  -7.942759150065165, 49.901607895996534, 1.9957427933628138,
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
          queryables: [
            {
              name: 'name',
              title: 'Name',
              type: 'string',
            },
            {
              name: 'geom',
              type: 'point',
            },
          ],
          sortables: [
            {
              name: 'name',
              title: 'Name',
              type: 'string',
            },
          ],
          supportedTileMatrixSets: [],
          mapTileFormats: [],
          vectorTileFormats: [],
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
          itemFormats: [
            'application/geo+json',
            'application/ld+json',
            'text/html',
          ],
          bulkDownloadLinks: {},
          jsonDownloadLink: null,
          keywords: ['netherlands', 'open data', 'georegister'],
          extent: {
            spatial: {
              bbox: [[3.37, 50.75, 7.21, 53.47]],
              crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
            },
          },
          itemType: 'record',
          queryables: [
            {
              name: 'geometry',
              type: 'geometry',
            },
            {
              name: 'created',
              title: 'created',
              type: 'string',
            },
            {
              name: 'updated',
              title: 'updated',
              type: 'string',
            },
            {
              name: 'type',
              title: 'type',
              type: 'string',
            },
            {
              name: 'title',
              title: 'title',
              type: 'string',
            },
            {
              name: 'description',
              title: 'description',
              type: 'string',
            },
            {
              name: 'providers',
              title: 'providers',
              type: 'string',
            },
            {
              name: 'externalIds',
              title: 'externalIds',
              type: 'string',
            },
            {
              name: 'themes',
              title: 'themes',
              type: 'string',
            },
            {
              name: 'q',
              title: 'q',
              type: 'string',
            },
          ],
          sortables: [],
          supportedTileMatrixSets: [],
          mapTileFormats: [],
          vectorTileFormats: [],
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
          itemFormats: [
            'application/vnd.ogc.fg+json',
            'application/geo+json',
            'application/flatgeobuf',
            'application/vnd.ogc.fg+json;compatibility=geojson',
            'text/html',
          ],
          bulkDownloadLinks: {},
          jsonDownloadLink: null,
          extent: {
            spatial: {
              bbox: [
                [
                  -6.4956758012099645, 50.08021976237488, 2.383883951687144,
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
          queryables: [
            {
              name: 'type',
              title: 'Type',
              type: 'string',
            },
            {
              name: 'name',
              title: 'Name',
              type: 'string',
            },
            {
              name: 'number',
              title: 'Number',
              type: 'string',
            },
            {
              name: 'level',
              title: 'Level',
              type: 'integer',
            },
            {
              name: 'geom',
              type: 'linestring',
            },
          ],
          sortables: [
            {
              name: 'name',
              title: 'Name',
              type: 'string',
            },
            {
              name: 'number',
              title: 'Number',
              type: 'string',
            },
          ],
          supportedTileMatrixSets: [],
          mapTileFormats: [],
          vectorTileFormats: [],
        });
      });
    });
    describe('#getCollectionItems', () => {
      it('returns airports collection items', async () => {
        await expect(
          endpoint.getCollectionItems('airports')
        ).resolves.toStrictEqual([
          {
            type: 'Feature',
            id: 1,
            geometry: { type: 'Point', coordinates: [-1.2918826, 59.8783475] },
            properties: { name: 'Sumburgh Airport' },
          },
          {
            type: 'Feature',
            id: 2,
            geometry: { type: 'Point', coordinates: [-1.2438161, 60.1918282] },
            properties: { name: 'Tingwall Airport' },
          },
          {
            type: 'Feature',
            id: 3,
            geometry: { type: 'Point', coordinates: [-2.8998525, 58.9579506] },
            properties: { name: 'Kirkwall Airport' },
          },
          {
            type: 'Feature',
            id: 4,
            geometry: { type: 'Point', coordinates: [-6.3295078, 58.2138995] },
            properties: { name: 'Port-Adhair Steòrnabhaigh/Stornoway Airport' },
          },
          {
            type: 'Feature',
            id: 5,
            geometry: { type: 'Point', coordinates: [-3.094033, 58.458363] },
            properties: { name: "Wick John O'Groats Airport" },
          },
          {
            type: 'Feature',
            id: 6,
            geometry: { type: 'Point', coordinates: [-7.3610346, 57.4843261] },
            properties: {
              name: 'Port-adhair Bheinn na Faoghla/Benbecula Airport',
            },
          },
          {
            type: 'Feature',
            id: 7,
            geometry: { type: 'Point', coordinates: [-7.4487268, 57.0254269] },
            properties: { name: 'Port-adhair Bharraigh/Barra Airport' },
          },
          {
            type: 'Feature',
            id: 8,
            geometry: { type: 'Point', coordinates: [-4.0493507, 57.5431458] },
            properties: { name: 'Inverness Airport' },
          },
          {
            type: 'Feature',
            id: 9,
            geometry: { type: 'Point', coordinates: [-2.200068, 57.202807] },
            properties: { name: 'Aberdeen International Airport' },
          },
          {
            type: 'Feature',
            id: 10,
            geometry: { type: 'Point', coordinates: [-6.869044, 56.5011563] },
            properties: { name: 'Tiree Airport' },
          },
        ]);
      });
      it('returns dutch-metadata collection items', async () => {
        await expect(
          endpoint.getCollectionItems('dutch-metadata')
        ).resolves.toStrictEqual([
          {
            id: '35149dfb-31d3-431c-a8bc-12a4034dac48',
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [4.690751953125, 52.358740234375],
                  [4.690751953125, 52.6333984375],
                  [5.020341796875, 52.6333984375],
                  [5.020341796875, 52.358740234375],
                  [4.690751953125, 52.358740234375],
                ],
              ],
            },
            properties: {
              created: '2021-12-08',
              updated: '2022-06-10T01:27:47Z',
              type: 'dataset',
              title: 'Kaartboeck 1635',
              description:
                'Data uit kaartboeken van de periode 1635 tot 1775. De kaartboeken werden door het waterschap gebruikt om er op toe te zien dat de eigenaren geen water in beslag namen door demping.\nDe percelen op de kaart zijn naar de huidige maatstaven vrij nauwkeurig gemeten en voorzien van een administratie met de eigenaren. bijzondere locaties van molens werven en beroepen worden in de boeken vermeld. Alle 97 kaarten aan een geven een zeer gedetailleerd beeld van de Voorzaan, Nieuwe Haven en de Achterzaan. De bladen Oost en West van de zaan zijn vrij nauwkeurig. De bladen aan de Voorzaan zijn een schetsmatige weergave van de situatie. De kaart van de Nieuwe Haven si weer nauwkeurig te noemen.',
              providers: [
                'Team Geo, geo-informatie@zaanstad.nl, Gemeente Zaanstad',
              ],
              externalIds: [
                {
                  scheme: 'default',
                  value: '35149dfb-31d3-431c-a8bc-12a4034dac48',
                },
              ],
              themes: [
                {
                  concepts: [
                    'ARGEOLOGIE',
                    'MONUMENTEN',
                    'KADASTER',
                    'KAARTBOEK',
                    'KAARTBOECK',
                    'HISTORIE',
                  ],
                },
              ],
              extent: {
                spatial: {
                  bbox: [
                    [
                      4.690751953125, 52.358740234375, 5.020341796875,
                      52.6333984375,
                    ],
                  ],
                  crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
                },
                temporal: {
                  interval: [null, null],
                  trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
                },
              },
            },
            links: [
              {
                href: 'https://maps-intern.zaanstad.gem.local/geoserver/wms?SERVICE=WMS',
                rel: 'item',
                title: 'geo:kaartboeck',
                type: 'OGC:WMS',
              },
              {
                href: 'https://maps-intern.zaanstad.gem.local/geoserver/wfs?SERVICE=WFS',
                rel: 'item',
                title: 'geo:kaartboeck',
                type: 'OGC:WFS',
              },
              {
                href: 'https://maps-intern.zaanstad.gem.local/geoserver/wfs?SERVICE=WFS&version=1.0.0&request=GetFeature&typeName=geo:kaartboeck&outputFormat=csv',
                rel: 'item',
                type: 'download',
              },
              {
                href: 'https://maps-intern.zaanstad.gem.local/geoserver/wfs?SERVICE=WFS&version=1.0.0&request=GetFeature&typeName=geo:kaartboeck&outputFormat=shape-zip',
                rel: 'item',
                type: 'download',
              },
            ],
          },
          {
            id: 'ffffffaa-4087-59ec-9ea7-8416f58e99dd',
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [4.4552947, 52.3348457],
                  [4.4552947, 53.388444],
                  [7.135964, 53.388444],
                  [7.135964, 52.3348457],
                  [4.4552947, 52.3348457],
                ],
              ],
            },
            properties: {
              created: '2022-06-01',
              updated: '2022-06-10T01:27:47Z',
              type: 'dataset',
              title: 'Diepteligging onderkant keileem (t.o.v. NAP)',
              description:
                'Diepteligging van de onderkant (basis) van keileem in Drenthe, in meters ten opzichte van NAP.',
              providers: [
                'Team Gis/Cartografie, post@drenthe.nl, Provincie Drenthe',
              ],
              externalIds: [
                {
                  scheme: 'default',
                  value: 'ffffffaa-4087-59ec-9ea7-8416f58e99dd',
                },
              ],
              themes: [
                {
                  concepts: [
                    'beleidsinstrument',
                    'bodem',
                    'grondwaterstand',
                    'landbouw',
                    'landbouwgrond',
                    'waterhuishouding',
                  ],
                  scheme: null,
                },
              ],
              extent: {
                spatial: {
                  bbox: [[4.4552947, 52.3348457, 7.135964, 53.388444]],
                  crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
                },
                temporal: {
                  interval: [null, null],
                  trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
                },
              },
            },
            links: [
              {
                href: 'https://kaartportaal.drenthe.nl/server/services/GDB_actueel/GBI_KEILEEM_DIEPTE_ONDER_NAP_R/MapServer/WMSServer',
                rel: 'item',
                title: '0',
                type: 'OGC:WMS',
              },
            ],
          },
          {
            id: '59352e7f-3792-4e17-bd73-9bba84a98890',
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [4.79, 51.857],
                  [4.79, 52.305],
                  [5.63, 52.305],
                  [5.63, 51.857],
                  [4.79, 51.857],
                ],
              ],
            },
            properties: {
              created: '2021-06-30',
              updated: '2022-06-10T01:27:47Z',
              type: 'dataset',
              title: 'Clusters geluid - wegen gecumuleerd',
              description:
                'Clusters (omtreklijn) gebaseerd op gemeentegrenzen. Per cluster zijn de aantallen woningen en gevoelige bestemmingen per GES-score geteld. Bij de gevoelige bestemmingen is onderscheid gemaakt in 3 categorien: Ziekenhuizen, Scholen en dagverblijven voor jeugd, Verpleeg en verzorgingshuizen.',
              providers: ['GIS, GIS@provincie-utrecht.nl, Provincie Utrecht'],
              externalIds: [
                {
                  scheme: 'default',
                  value: '59352e7f-3792-4e17-bd73-9bba84a98890',
                },
              ],
              themes: [
                {
                  concepts: [
                    'GELUIDHINDER',
                    'GELUIDSZONES',
                    'PROVINCIALE WEGEN',
                    'VERKEERSLAWAAI',
                    'WET GELUIDHINDER',
                  ],
                  scheme: null,
                },
                {
                  concepts: ['Informatief'],
                  scheme: null,
                },
              ],
              extent: {
                spatial: {
                  bbox: [[4.79, 51.857, 5.63, 52.305]],
                  crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
                },
                temporal: {
                  interval: [null, null],
                  trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
                },
              },
            },
            links: [
              {
                href: 'https://download.geodata-utrecht.nl/download/vector/59352e7f-3792-4e17-bd73-9bba84a98890',
                rel: 'item',
                type: 'landingpage',
              },
              {
                href: 'https://services.geodata-utrecht.nl/geoserver/m01_4_overlast_hinder_mgkp/wfs',
                rel: 'item',
                title: 'Clusters_geluid_-_wegen_gecumuleerd',
                type: 'OGC:WFS',
              },
              {
                href: 'https://services.geodata-utrecht.nl/geoserver/m01_4_overlast_hinder_mgkp/wms',
                rel: 'item',
                title: 'Clusters_geluid_-_wegen_gecumuleerd',
                type: 'OGC:WMS',
              },
            ],
          },
          {
            id: '0ec79c96-898f-40da-adc7-673eb4749685',
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [4.1407, 52.004],
                  [4.1407, 52.9215],
                  [4.8927, 52.9215],
                  [4.8927, 52.004],
                  [4.1407, 52.004],
                ],
              ],
            },
            properties: {
              created: '2022-02-02',
              updated: '2022-06-10T01:27:47Z',
              type: 'dataset',
              title: 'Geesten van Holland',
              description:
                "In de dataset 'Geesten' zijn de locaties opgenomen van middeleeuwse akkercomplexen op de strandwallen in Noord- en Zuid-Holland.",
              providers: [
                'InfoDesk, info@cultureelerfgoed.nl, Rijksdienst voor het Cultureel Erfgoed',
              ],
              externalIds: [
                {
                  scheme: 'default',
                  value: '0ec79c96-898f-40da-adc7-673eb4749685',
                },
              ],
              themes: [
                {
                  concepts: [],
                },
              ],
              extent: {
                spatial: {
                  bbox: [[4.1407, 52.004, 4.8927, 52.9215]],
                  crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
                },
                temporal: {
                  interval: [null, null],
                  trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
                },
              },
            },
            links: [
              {
                href: 'https://services.rce.geovoorziening.nl/landschapsatlas/wms?&request=GetCapabilities',
                rel: 'item',
                title: 'Geesten',
              },
              {
                href: 'https://services.rce.geovoorziening.nl/landschapsatlas/wfs?&request=GetCapabilities',
                rel: 'item',
                title: 'landschapsatlas:Geesten',
              },
            ],
          },
          {
            id: '364c5d7a-d6ec-11ea-87d0-0242ac130003',
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [3.2, 50.75],
                  [3.2, 53.7],
                  [7.22, 53.7],
                  [7.22, 50.75],
                  [3.2, 50.75],
                ],
              ],
            },
            properties: {
              created: '2021-06-18',
              updated: '2022-06-10T01:27:47Z',
              type: 'service',
              title: 'Grondwaterstandsonderzoek, downloadservice',
              description:
                'Gegevens over grondwaterstandsonderzoek (Groundwaterlevel data in het Engels) zijn opgeslagen in de basisregistratie ondergrond (BRO). Het registratieobject grondwaterstandonderzoek bevat de metingen van de variatie in de stand van het grondwater dat in een bekende grondwatermonitoringput met een zekere buis wordt ontsloten.\nMet het monitoren van het grondwater gebeurt al lange tijd, op vele locaties in ons land. Met die informatie is het mogelijk om karakteristieke kenmerken van de beweging van het grondwater vast te stellen, ruimtelijke patronen te herkennen en trendmatige veranderingen te analyseren.\nBelangrijke kenmerken zijn bijvoorbeeld de hoogste en laatste grondwaterstand die in een bepaald gebied zijn te verwachten als gevolg van het jaarlijkse seizoenpatroon. Die kennis is niet alleen van belang voor de landbouw en natuurontwikkeling, maar ook voor het ontwerpen van nieuwe woonwijken en infrastructuur.\nDe meetgegevens geven inzicht in de reactie van het grondwater op  veranderingen zoals de verlaging van een polderpeil, of grondwaterwinning. Op basis van die informatie kunnen voorspellingen worden gedaan over het verloop van de grondwaterstand in de toekomst. Hoe langer de tijdreeksen zijn, des te nauwkeuriger de voorspellingen zijn over het lange termijn gedrag van het grondwater.\nEen van de belangrijke uitdagingen van nu is het voorspellen van de invloed van de klimaatverandering op het grondwatersysteem. Zowel in nationaal als internationaal verband worden richtlijnen ontwikkeld voor een duurzaam beleid en beheer van onze grondwatersystemen.',
              providers: [
                'support@broservicedesk.nl, TNO Geologische Dienst Nederland',
              ],
              externalIds: [
                {
                  scheme: 'default',
                  value: '364c5d7a-d6ec-11ea-87d0-0242ac130003',
                },
              ],
              themes: [
                {
                  concepts: ['infoMapAccessService'],
                },
                {
                  concepts: [
                    'basisregistratie ondergrond',
                    'bro',
                    'GMN',
                    'grondwatermonitoring',
                    'grondwatermonitoringnet',
                    'grondwateronderzoek',
                    'grondwaterstand',
                  ],
                  scheme: null,
                },
              ],
              extent: {
                spatial: {
                  bbox: [[3.2, 50.75, 7.22, 53.7]],
                  crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
                },
                temporal: {
                  interval: [null, null],
                  trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
                },
              },
            },
            links: [],
          },
          {
            id: '7B40133214B7456CE053D2041EACD771',
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [6.105, 52.601],
                  [6.105, 53.213],
                  [7.109, 53.213],
                  [7.109, 52.601],
                  [6.105, 52.601],
                ],
              ],
            },
            properties: {
              created: '2022-06-01',
              updated: '2022-06-10T01:27:47Z',
              type: 'dataset',
              title: 'Hemelhelderheidskaart',
              description:
                'Hemelhelderheid Drenthe met kasverlichting gedoofd (2015-2016). De grootheid luminantie (helderheid) kent verschillende eenheden en die worden in de kaart weergegeven. De eenheid candela per vierkante meter is de eenheid die verlichtingsdeskundigen gebruiken om te meten hoeveel licht ergens op straalt. De gebruikte eenheid mcd/m2 is een duizendste cd/m2. De eenheid magnitude wordt gebruikt door sterrenkundigen. Hoe helderder de hemel, hoe hoger het getal in candela per vierkante meter, hoe meer licht er van de hemel komt.',
              providers: [
                'Team Gis/Cartografie, post@drenthe.nl, Provincie Drenthe',
              ],
              externalIds: [
                {
                  scheme: 'default',
                  value: '7B40133214B7456CE053D2041EACD771',
                },
              ],
              themes: [
                {
                  concepts: ['locaties'],
                  scheme: null,
                },
              ],
              extent: {
                spatial: {
                  bbox: [[6.105, 52.601, 7.109, 53.213]],
                  crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
                },
                temporal: {
                  interval: [null, null],
                  trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
                },
              },
            },
            links: [
              {
                href: 'https://kaartportaal.drenthe.nl/server/services/GDB_actueel/GBI_MILIEU_HEMELHELDERHEID_V/MapServer/WMSServer',
                rel: 'item',
                title: '0',
                type: 'OGC:WMS',
              },
              {
                href: 'https://kaartportaal.drenthe.nl/server/services/GDB_actueel/GBI_MILIEU_HEMELHELDERHEID_V/MapServer/WFSServer',
                rel: 'item',
                title: 'esri:Hemelhelderheidskaart',
                type: 'OGC:WFS',
              },
            ],
          },
          {
            id: '1da54925-0085-4972-bdec-47bef653fc16',
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [3.15, 50.6],
                  [3.15, 53.6],
                  [7.3, 53.6],
                  [7.3, 50.6],
                  [3.15, 50.6],
                ],
              ],
            },
            properties: {
              created: '2020-12-21',
              updated: '2022-06-10T01:27:47Z',
              type: 'service',
              title: 'WarmteAtlas WMS',
              description:
                'Atlas voor kaarten over het warmte gebruik (industrie, glastuinbouw en huishoudens) en potentieel kaarten voor de productie van duurzame warmte en de aanwezigheid van nog niet benutte restwarmte.',
              providers: [
                'klantcontact, klantcontact@rvo.nl, Rijksdienst voor Ondernemend Nederland (RvO)',
              ],
              externalIds: [
                {
                  scheme: 'default',
                  value: '1da54925-0085-4972-bdec-47bef653fc16',
                },
              ],
              themes: [
                {
                  concepts: [
                    'infoMapAccessService',
                    'Energie',
                    'Warmte',
                    'Biogas',
                    'Aardwarmte',
                    'Thermische Energie Oppervlaktewater TEO',
                    'Warmte Koude Opslag WKO',
                    'Gebouwde Omgeving',
                    'Industrie',
                    'CO2 emissie',
                    'Glastuinbouw',
                    'Grote Stook Installaties',
                    'IBIS Bedrijventerreinen',
                    'Grote Gebouwen',
                    'Warmtenetten',
                    'Aardwarmte',
                    'Biomassa',
                    'Energie vraag',
                    'Woonkernen',
                    'Kassen',
                    'WarmteAtlas',
                  ],
                },
                {
                  concepts: ['Energiebronnen'],
                  scheme: null,
                },
                {
                  concepts: [
                    'Energie',
                    'Warmte',
                    'Industrie',
                    'Kassen',
                    'Bedrijventerreinen',
                    'Grote Stook Installaties',
                    'Grote Gebouwen',
                    'Woonkernen',
                    'Warmtenetten',
                    'Warmte Vraag',
                    'Warmte Potentieel',
                    'Nationaal',
                    'Glastuinbouw',
                    'WarmteAtlas',
                    'Energie Verbruik',
                    'Energie',
                    null,
                  ],
                  scheme: null,
                },
              ],
              extent: {
                spatial: {
                  bbox: [[3.15, 50.6, 7.3, 53.6]],
                  crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
                },
                temporal: {
                  interval: [null, null],
                  trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
                },
              },
            },
            links: [
              {
                href: 'https://rvo.b3p.nl/geoserver/WarmteAtlas/wms?',
                rel: 'item',
                title: 'WarmteAtlas WMS',
                type: 'OGC:WMS',
              },
            ],
          },
          {
            id: 'efc55744-a8f5-40e1-8d15-1ffa7a018988',
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [3.37087, 50.7539],
                  [3.37087, 53.4658],
                  [7.21097, 53.4658],
                  [7.21097, 50.7539],
                  [3.37087, 50.7539],
                ],
              ],
            },
            properties: {
              created: '2021-12-22',
              updated: '2022-06-10T01:27:47Z',
              type: 'dataset',
              title: 'DANK-Delfstofwinning op land: zand, grind en klei',
              description:
                'De kaart geeft de geologische winbare hoeveelheid zand, grind en klei weer wanneer er niet meer dan maximaal 5 meter aan deklaag moet worden afgegraven.\n\n                    Voor de productie van veel bouwmaterialen wordt gebruik gemaakt van oppervlaktedelfstoffen. In Nederland is jaarlijks circa 150 miljoen ton aan bouwgrondstoffen nodig. Een deel daarvan komt uit het buitenland, een deel wordt verkregen door hergebruik (15 tot 20 %), maar nog steeds wordt een groot deel verkregen uit primaire winning.\n\n                    Sinds 1900 is de winning van ophoogzand op verschillende locaties uitgevoerd door maaiveldverlaging in het kader van\n                    landbouwkundige verbeteringen (ruilverkaveling).\n                    Sinds de jaren zeventig is er een afname in oppervlakkig ontgronden door toenemende maatschappelijke weerstand en strengere wetgevingen. Zandwinning vindt nu voornamelijk plaats in geconcentreerde winputten. Aanvullend vindt winning plaats middels het "werk met werk maken" principe. Hierin wordt bijvoorbeeld in nieuwbouwprojecten zand gewonnen voor gebruik in het project en tegelijkertijd waterberging gecre\u00eberd.\n                    Voor winning van oppervlaktedelfstoffen is per jaar circa 400 hectare oppervlakte van ons land noodzakelijk. Ongeveer de helft daarvan, circa 200 hectare, blijft achter als diep water. De andere 200 hectare krijgt via herinrichting een nieuwe ruimtelijke bestemming, bijvoorbeeld als natuur- of recreatiegebied. Alternatief is de winning van zand uit het IJsselmeer, de Randmeren en de Noordzee. De winning van grind is vooral voorzien plaats te vinden uit de maaswerken in Limburg.\n                    De winning en reservering van zand en grind zijn bij de wet geregeld en land based winlocaties worden door de provincie aangewezen. De winning van zand en grind legt een ruimtebeslag die enerzijds kan conflicteren met ander gebruik, anderzijds kan ook de winning samengaan met inrichtingsvraagstukken zoals het geven van ruimte voor de rivieren en tijdelijke waterberging.',
              providers: [
                'atlasnatuurlijkkapitaal@rivm.nl, Atlas Natuurlijk Kapitaal',
              ],
              externalIds: [
                {
                  scheme: 'default',
                  value: 'efc55744-a8f5-40e1-8d15-1ffa7a018988',
                },
              ],
              themes: [
                {
                  concepts: ['winning zand grid diepte nederland'],
                },
              ],
              extent: {
                spatial: {
                  bbox: [[3.37087, 50.7539, 7.21097, 53.4658]],
                  crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
                },
                temporal: {
                  interval: [null, null],
                  trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
                },
              },
            },
            links: [
              {
                href: 'http://data.rivm.nl/geo/ank/wms?',
                rel: 'item',
                title:
                  'd022_delftstofwinning_op_land_en_in_binnenwateren_rivier',
                type: 'OGC:WMS',
              },
              {
                href: 'https://data.rivm.nl/meta/srv/api/records/efc55744-a8f5-40e1-8d15-1ffa7a018988/attachments/DANK022_delfstofwinning_op_land_en_in_binnenwateren_rivier.zip',
                rel: 'item',
                title:
                  'DANK022_delfstofwinning_op_land_en_in_binnenwateren_rivier.zip',
                type: 'download',
              },
            ],
          },
          {
            id: '826735d1-1467-4888-9829-61019c033431',
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [4.690751953125, 52.358740234375],
                  [4.690751953125, 52.6333984375],
                  [5.020341796875, 52.6333984375],
                  [5.020341796875, 52.358740234375],
                  [4.690751953125, 52.358740234375],
                ],
              ],
            },
            properties: {
              created: '2021-11-17',
              updated: '2022-06-10T01:27:47Z',
              type: 'dataset',
              title: 'Luchtfoto 2018',
              description:
                'Een luchtfoto is een afbeelding van een gedeelte van het aardoppervlak, gefotografeerd van uit een hoog standpunt los van het aardoppervlak, veelal vanuit een luchtvaartuig.',
              providers: [
                'Team Geo, geo-informatie@zaanstad.nl, Gemeente Zaanstad',
              ],
              externalIds: [
                {
                  scheme: 'default',
                  value: '826735d1-1467-4888-9829-61019c033431',
                },
              ],
              themes: [
                {
                  concepts: [
                    'FOTO',
                    'LUCHTFOTO',
                    'REFERENTIEKAART',
                    'TOPOGRAFIE',
                    '2018',
                    'LUFO',
                    null,
                  ],
                },
              ],
              extent: {
                spatial: {
                  bbox: [
                    [
                      4.690751953125, 52.358740234375, 5.020341796875,
                      52.6333984375,
                    ],
                  ],
                  crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
                },
                temporal: {
                  interval: [null, null],
                  trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
                },
              },
            },
            links: [
              {
                href: 'https://tiles.zaanstad.nl/mapproxy/service?SERVICE=WMS',
                rel: 'item',
                title: 'Lufo2018-kleur',
                type: 'OGC:WMS',
              },
              {
                href: 'https://tiles.zaanstad.nl/mapproxy/service?SERVICE=WFS',
                rel: 'item',
                title: 'Lufo2018-kleur',
                type: 'OGC:WFS',
              },
              {
                href: 'https://tiles.zaanstad.nl/mapproxy/service?SERVICE=WFS&version=1.0.0&request=GetFeature&typeName=Lufo2018-kleur&outputFormat=csv',
                rel: 'item',
                title: 'CSV',
                type: 'download',
              },
              {
                href: 'https://tiles.zaanstad.nl/mapproxy/service?SERVICE=WFS&version=1.0.0&request=GetFeature&typeName=Lufo2018-kleur&outputFormat=shape-zip',
                rel: 'item',
                title: 'Shape-zip',
                type: 'download',
              },
            ],
          },
          {
            id: 'b7d2fd24-8cd8-4965-a997-69eb1a987b5a',
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [3.37087, 50.7539],
                  [3.37087, 53.4658],
                  [7.21097, 53.4658],
                  [7.21097, 50.7539],
                  [3.37087, 50.7539],
                ],
              ],
            },
            properties: {
              created: '2019-04-16',
              updated: '2022-06-10T01:27:47Z',
              type: 'dataset',
              title: 'Zonpotentie velden',
              description:
                'In deze kaartlaag zijn denkbare locaties voor zonnepanelen in veldopstelling aangegeven. Het gaat hier om kleine terreinen (tussen 0,5 en 1,0 hectare), middelgrote terreinen (tussen 1,0 en 3,0 hectare) en grote terreinen (3,0 hectare en groter). Te zien zijn gras- en akkerlanden buiten de bebouwing, exclusief gebieden die tot Natura2000 behoren.\n\nVoor iedere locatie is aangegeven wat het plaatsbare schaduwvrije zon-PV-vermogen is, uitgaande van schaduwvrije velden en 0,65 MWp vermogen per hectare grond.\n\nTevens is de verwachte jaarlijkse kWh-opbrengst aangeduid (900 kWh/kWp), evenals het aantal huishoudens dat van groene stroom kan worden voorzien met deze opbrengst (3.300 kWh/huishouden).\nDe selectie van locaties is expliciet niet gemaakt op basis van politieke voorkeuren of richtlijnen van gemeenten dan wel provincies, bijvoorbeeld met betrekking tot de (on)wenselijkheid van zonnevelden op landbouwgronden.\n\nToekomstige uitbreiding (1)\nGewerkt wordt aan een weergave van de kaartlaag met daarin relevante netdata verwerkt. Concreet gaat dit dan om de afstanden van denkbare locaties tot aan het middenspanningsnet of het dichtstbijzijnde onder-, regel- of schakelstation.\n\nToekomstige uitbreiding (2)\nTevens wordt gewerkt aan weergave van de kaartlaag met daarin zoninstralingsdata op de denkbare locaties voor zonnepanelen in veldopstelling. Hiermee wordt het schaduweffect van objecten op en rond het terrein inzichtelijk gemaakt.',
              providers: ['atlasleefomgeving@rivm.nl, Atlas Leefomgeving'],
              externalIds: [
                {
                  scheme: 'default',
                  value: 'b7d2fd24-8cd8-4965-a997-69eb1a987b5a',
                },
              ],
              themes: [
                {
                  concepts: ['zonnepanelen', 'energie'],
                  scheme: null,
                },
              ],
              extent: {
                spatial: {
                  bbox: [[3.37087, 50.7539, 7.21097, 53.4658]],
                  crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
                },
                temporal: {
                  interval: [null, null],
                  trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
                },
              },
            },
            links: [
              {
                href: 'http://geodata.rivm.nl/geoserver/nea/wms?',
                rel: 'item',
                title: 'Greenspread_20181101_v_zonnevelden',
                type: 'OGC:WMS',
              },
              {
                href: 'http://geodata.rivm.nl/geoserver/nea/wms?',
                rel: 'item',
                title: 'Greenspread_20181101_v_zonnevelden',
                type: 'OGC:WFS',
              },
            ],
          },
        ]);
      });
      it('returns roads_national collection items', async () => {
        await expect(
          endpoint.getCollectionItems('roads_national')
        ).resolves.toStrictEqual([
          {
            type: 'Feature',
            id: 1,
            geometry: {
              type: 'LineString',
              coordinates: [
                [-3.7146553, 58.0895513],
                [-3.7171409, 58.0885901],
              ],
            },
            properties: { type: 'Primary', number: 'A9', level: 0 },
          },
          {
            type: 'Feature',
            id: 2,
            geometry: {
              type: 'LineString',
              coordinates: [
                [-3.7461507, 58.0813773],
                [-3.7469084, 58.0810599],
                [-3.7506235, 58.0802469],
              ],
            },
            properties: { type: 'Primary', number: 'A9', level: 0 },
          },
          {
            type: 'Feature',
            id: 3,
            geometry: {
              type: 'LineString',
              coordinates: [
                [-3.7450719, 58.0818592],
                [-3.7461507, 58.0813773],
              ],
            },
            properties: { type: 'Primary', number: 'A9', level: 0 },
          },
          {
            type: 'Feature',
            id: 4,
            geometry: {
              type: 'LineString',
              coordinates: [
                [-3.7380837, 58.0842815],
                [-3.7401187, 58.08358],
                [-3.7420469, 58.0831224],
                [-3.7437685, 58.0826047],
                [-3.7450719, 58.0818592],
              ],
            },
            properties: { type: 'Primary', number: 'A9', level: 0 },
          },
          {
            type: 'Feature',
            id: 5,
            geometry: {
              type: 'LineString',
              coordinates: [
                [-3.7373997, 58.0845154],
                [-3.7380837, 58.0842815],
              ],
            },
            properties: { type: 'Primary', number: 'A9', level: 0 },
          },
          {
            type: 'Feature',
            id: 6,
            geometry: {
              type: 'LineString',
              coordinates: [
                [-3.7171409, 58.0885901],
                [-3.7174653, 58.0884718],
                [-3.7195617, 58.087902],
                [-3.721399, 58.0875031],
                [-3.7256251, 58.0868944],
                [-3.7289353, 58.0862476],
                [-3.7321928, 58.0859159],
                [-3.7333858, 58.0856841],
                [-3.7353467, 58.0851992],
                [-3.7373997, 58.0845154],
              ],
            },
            properties: { type: 'Primary', number: 'A9', level: 0 },
          },
          {
            type: 'Feature',
            id: 7,
            geometry: {
              type: 'LineString',
              coordinates: [
                [-3.7638606, 58.0763091],
                [-3.7704891, 58.0745642],
              ],
            },
            properties: { type: 'Primary', number: 'A9', level: 0 },
          },
          {
            type: 'Feature',
            id: 8,
            geometry: {
              type: 'LineString',
              coordinates: [
                [-3.7099634, 58.0917321],
                [-3.71127, 58.0910318],
                [-3.7127532, 58.0903683],
                [-3.7146553, 58.0895513],
              ],
            },
            properties: { type: 'Primary', number: 'A9', level: 0 },
          },
          {
            type: 'Feature',
            id: 9,
            geometry: {
              type: 'LineString',
              coordinates: [
                [-3.7036866, 58.0950811],
                [-3.7038614, 58.0950389],
                [-3.7056711, 58.0945655],
                [-3.7064724, 58.0942942],
                [-3.7072678, 58.0938973],
                [-3.707711, 58.0935859],
                [-3.7088797, 58.0924832],
                [-3.7099634, 58.0917321],
              ],
            },
            properties: { type: 'Primary', number: 'A9', level: 0 },
          },
          {
            type: 'Feature',
            id: 10,
            geometry: {
              type: 'LineString',
              coordinates: [
                [-3.7036866, 58.0950811],
                [-3.7029109, 58.0952652],
              ],
            },
            properties: { type: 'Primary', number: 'A9', level: 0 },
          },
        ]);
      });
    });
    describe('#getCollectionItem', () => {
      it('returns one airports collection item', async () => {
        await expect(
          endpoint.getCollectionItem('airports', '1')
        ).resolves.toStrictEqual({
          geometry: {
            coordinates: [-1.2918826, 59.8783475],
            type: 'Point',
          },
          id: 1,
          links: [
            {
              href: 'https://demo.ldproxy.net/zoomstack/collections/airports/items/1?f=json',
              rel: 'self',
              title: 'This document',
              type: 'application/geo+json',
            },
            {
              href: 'https://demo.ldproxy.net/zoomstack/collections/airports/items/1?f=jsonfgc',
              rel: 'alternate',
              title: 'This document as JSON-FG (GeoJSON Compatibility Mode)',
              type: 'application/vnd.ogc.fg+json;compatibility=geojson',
            },
            {
              href: 'https://demo.ldproxy.net/zoomstack/collections/airports/items/1?f=fgb',
              rel: 'alternate',
              title: 'This document as FlatGeobuf',
              type: 'application/flatgeobuf',
            },
            {
              href: 'https://demo.ldproxy.net/zoomstack/collections/airports/items/1?f=html',
              rel: 'alternate',
              title: 'This document as HTML',
              type: 'text/html',
            },
            {
              href: 'https://demo.ldproxy.net/zoomstack/collections/airports/items/1?f=jsonfg',
              rel: 'alternate',
              title: 'This document as JSON-FG',
              type: 'application/vnd.ogc.fg+json',
            },
            {
              href: 'https://demo.ldproxy.net/zoomstack/collections/airports?f=json',
              rel: 'collection',
              title: 'The collection the feature belongs to',
              type: 'application/json',
            },
          ],
          properties: {
            name: 'Sumburgh Airport',
          },
          type: 'Feature',
        });
      });
      it('returns dutch-metadata collection item', async () => {
        await expect(
          endpoint.getCollectionItem(
            'dutch-metadata',
            '35149dfb-31d3-431c-a8bc-12a4034dac48'
          )
        ).resolves.toStrictEqual({
          geometry: {
            coordinates: [
              [
                [4.690751953125, 52.358740234375],
                [4.690751953125, 52.6333984375],
                [5.020341796875, 52.6333984375],
                [5.020341796875, 52.358740234375],
                [4.690751953125, 52.358740234375],
              ],
            ],
            type: 'Polygon',
          },
          id: '35149dfb-31d3-431c-a8bc-12a4034dac48',
          links: [
            {
              href: 'https://maps-intern.zaanstad.gem.local/geoserver/wms?SERVICE=WMS',
              rel: 'item',
              title: 'geo:kaartboeck',
              type: 'OGC:WMS',
            },
            {
              href: 'https://maps-intern.zaanstad.gem.local/geoserver/wfs?SERVICE=WFS',
              rel: 'item',
              title: 'geo:kaartboeck',
              type: 'OGC:WFS',
            },
            {
              href: 'https://maps-intern.zaanstad.gem.local/geoserver/wfs?SERVICE=WFS&version=1.0.0&request=GetFeature&typeName=geo:kaartboeck&outputFormat=csv',
              rel: 'item',
              type: 'download',
            },
            {
              href: 'https://maps-intern.zaanstad.gem.local/geoserver/wfs?SERVICE=WFS&version=1.0.0&request=GetFeature&typeName=geo:kaartboeck&outputFormat=shape-zip',
              rel: 'item',
              type: 'download',
            },
            {
              href: 'https://demo.pygeoapi.io/master?f=json',
              rel: 'root',
              title: 'The landing page of this server as JSON',
              type: 'application/json',
            },
            {
              href: 'https://demo.pygeoapi.io/master?f=html',
              rel: 'root',
              title: 'The landing page of this server as HTML',
              type: 'text/html',
            },
            {
              href: 'https://demo.pygeoapi.io/master/collections/dutch-metadata/items/35149dfb-31d3-431c-a8bc-12a4034dac48?f=json',
              rel: 'self',
              title: 'This document as GeoJSON',
              type: 'application/geo+json',
            },
            {
              href: 'https://demo.pygeoapi.io/master/collections/dutch-metadata/items/35149dfb-31d3-431c-a8bc-12a4034dac48?f=jsonld',
              rel: 'alternate',
              title: 'This document as RDF (JSON-LD)',
              type: 'application/ld+json',
            },
            {
              href: 'https://demo.pygeoapi.io/master/collections/dutch-metadata/items/35149dfb-31d3-431c-a8bc-12a4034dac48?f=html',
              rel: 'alternate',
              title: 'This document as HTML',
              type: 'text/html',
            },
            {
              href: 'https://demo.pygeoapi.io/master/collections/dutch-metadata',
              rel: 'collection',
              title: 'Sample metadata records from Dutch Nationaal georegister',
              type: 'application/json',
            },
          ],
          properties: {
            description:
              'Data uit kaartboeken van de periode 1635 tot 1775. De kaartboeken werden door het waterschap gebruikt om er op toe te zien dat de eigenaren geen water in beslag namen door demping.\nDe percelen op de kaart zijn naar de huidige maatstaven vrij nauwkeurig gemeten en voorzien van een administratie met de eigenaren. bijzondere locaties van molens werven en beroepen worden in de boeken vermeld. Alle 97 kaarten aan een geven een zeer gedetailleerd beeld van de Voorzaan, Nieuwe Haven en de Achterzaan. De bladen Oost en West van de zaan zijn vrij nauwkeurig. De bladen aan de Voorzaan zijn een schetsmatige weergave van de situatie. De kaart van de Nieuwe Haven si weer nauwkeurig te noemen.',
            extent: {
              spatial: {
                bbox: [
                  [
                    4.690751953125, 52.358740234375, 5.020341796875,
                    52.6333984375,
                  ],
                ],
                crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
              },
              temporal: {
                interval: [null, null],
                trs: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
              },
            },
            externalIds: [
              {
                scheme: 'default',
                value: '35149dfb-31d3-431c-a8bc-12a4034dac48',
              },
            ],
            providers: [
              'Team Geo, geo-informatie@zaanstad.nl, Gemeente Zaanstad',
            ],
            created: '2021-12-08',
            updated: '2022-06-10T01:27:47Z',
            themes: [
              {
                concepts: [
                  'ARGEOLOGIE',
                  'MONUMENTEN',
                  'KADASTER',
                  'KAARTBOEK',
                  'KAARTBOECK',
                  'HISTORIE',
                ],
              },
            ],
            title: 'Kaartboeck 1635',
            type: 'dataset',
          },
          type: 'Feature',
        });
      });
    });
    describe('#getCollectionItemsUrl', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'warn');
      });
      it('returns the first available URL for the collection items if no mime-type specified', async () => {
        await expect(
          endpoint.getCollectionItemsUrl('airports')
        ).resolves.toEqual(
          'https://my.server.org/sample-data/collections/airports/items?f=html'
        );
      });
      it('selects the URL using JSON-FG if asJson is specified', async () => {
        await expect(
          endpoint.getCollectionItemsUrl('airports', {
            asJson: true,
          })
        ).resolves.toEqual(
          'https://my.server.org/sample-data/collections/airports/items?f=jsonfg'
        );
      });
      it('returns the correct URL for the collection items an a given mime-type', async () => {
        await expect(
          endpoint.getCollectionItemsUrl('airports', {
            limit: 101,
            query: 'name=Sumburgh Airport',
            outputFormat: 'application/geo+json',
          })
        ).resolves.toEqual(
          'https://my.server.org/sample-data/collections/airports/items?f=json&name=Sumburgh+Airport&limit=101'
        );
      });
      it('outputs a warning if the required format is not a known mime-type for the collection', async () => {
        await expect(
          endpoint.getCollectionItemsUrl('airports', {
            limit: 101,
            query: 'name=Sumburgh Airport',
            outputFormat: 'shapefile',
          })
        ).resolves.toEqual(
          'https://my.server.org/sample-data/collections/airports/items?f=shapefile&name=Sumburgh+Airport&limit=101'
        );
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining(
            'The following output format type was not found in the collection'
          )
        );
      });
    });
    describe('#tileMatrixSets', () => {
      it('returns the correct tile matrix sets', async () => {
        const result = await endpoint.tileMatrixSets;
        expect(result).toEqual(['WebMercatorQuad']);
      });
    });
  });
  describe('a failure happens while parsing the endpoint capabilities', () => {
    beforeEach(() => {
      endpoint = new OgcApiEndpoint('http://local/sample-data/notjson'); // not actually json
    });
    describe('#info', () => {
      it('throws an explicit error', async () => {
        await expect(endpoint.info).rejects.toEqual(
          new EndpointError(
            `The endpoint appears non-conforming, the following error was encountered:
The document at http://local/sample-data/notjson?f=json does not appear to be valid JSON. Error was: Unexpected token 'h', "hello world
" is not valid JSON`
          )
        );
      });
    });
  });

  describe('querying a nested path of the endpoint', () => {
    describe('on collections path', () => {
      beforeEach(() => {
        endpoint = new OgcApiEndpoint('http://local/sample-data/collections');
      });
      it('correctly parses endpoint info and collections', async () => {
        await expect(endpoint.info).resolves.toEqual({
          title: 'OS Open Zoomstack',
          description:
            'OS Open Zoomstack is a comprehensive vector basemap showing coverage of Great Britain at a national level, right down to street-level detail.',
          attribution:
            'Contains OS data © Crown copyright and database right 2021.',
        });
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
          'missing-feature-type-metadata',
        ]);
      });
    });
    describe('on a single collection path', () => {
      beforeEach(() => {
        endpoint = new OgcApiEndpoint(
          'http://local/sample-data/collections/airports'
        );
      });
      it('correctly parses endpoint info, keep a single collection', async () => {
        await expect(endpoint.info).resolves.toEqual({
          title: 'OS Open Zoomstack',
          description:
            'OS Open Zoomstack is a comprehensive vector basemap showing coverage of Great Britain at a national level, right down to street-level detail.',
          attribution:
            'Contains OS data © Crown copyright and database right 2021.',
        });
        await expect(endpoint.featureCollections).resolves.toEqual([
          'airports',
        ]);
      });
    });
    describe('on a single collection items path', () => {
      beforeEach(() => {
        endpoint = new OgcApiEndpoint(
          'http://local/sample-data/collections/airports/items'
        );
      });
      it('correctly parses endpoint info, keep a single collection', async () => {
        await expect(endpoint.info).resolves.toEqual({
          title: 'OS Open Zoomstack',
          description:
            'OS Open Zoomstack is a comprehensive vector basemap showing coverage of Great Britain at a national level, right down to street-level detail.',
          attribution:
            'Contains OS data © Crown copyright and database right 2021.',
        });
        await expect(endpoint.featureCollections).resolves.toEqual([
          'airports',
        ]);
      });
    });
    describe('on a JSON document which is not part of a valid endpoint', () => {
      beforeEach(() => {
        endpoint = new OgcApiEndpoint('http://local/invalid/');
      });
      it('throws an explicit error', async () => {
        await expect(endpoint.info).rejects.toEqual(
          new EndpointError(
            `The endpoint appears non-conforming, the following error was encountered:
Could not find a root JSON document containing both a link with rel='data' and a link with rel='conformance'.`
          )
        );
      });
    });
    describe('on a non-existing link', () => {
      beforeEach(() => {
        endpoint = new OgcApiEndpoint('http://local/nonexisting');
      });
      it('throws an explicit error', async () => {
        await expect(endpoint.info).rejects.toEqual(
          new EndpointError(
            `The endpoint appears non-conforming, the following error was encountered:
The document at http://local/nonexisting?f=json could not be fetched.`
          )
        );
      });
    });
  });

  describe('alternate implementation', () => {
    describe('nominal case', () => {
      beforeEach(() => {
        endpoint = new OgcApiEndpoint('http://local/sample-data-2/collections');
      });
      describe('#info', () => {
        it('returns endpoint info', async () => {
          await expect(endpoint.info).resolves.toEqual({
            description: 'data-api provides an API to access datas',
            title: 'geOrchestra Data API',
          });
        });
      });
      describe('#conformanceClasses', () => {
        it('returns conformance classes', async () => {
          await expect(endpoint.conformanceClasses).resolves.toEqual([
            'http://www.opengis.net/spec/ogcapi-features-1/1.0/req/oas30',
            'http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/json',
            'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
            'http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/oas30',
            'http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/landing-page',
            'http://www.opengis.net/spec/ogcapi-features-2/1.0/conf/crs',
            'http://www.opengis.net/spec/ogcapi-common-2/1.0/conf/collections',
            'http://www.opengis.net/spec/ogcapi-features-5/1.0/conf/schemas',
            'http://www.opengis.net/spec/ogcapi-features-3/1.0/conf/queryables',
            'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson',
            'http://www.opengis.net/spec/ogcapi-features-3/1.0/conf/queryables-query-parameters',
            'http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/core',
            'http://www.opengis.net/spec/ogcapi-features-5/1.0/req/core-roles-features',
            'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/html',
          ]);
        });
      });
      describe('#allCollections', () => {
        it('returns collection ids', async () => {
          await expect(endpoint.allCollections).resolves.toEqual([
            { name: 'aires-covoiturage', hasFeatures: true },
            { name: 'antenne', hasFeatures: true },
            { name: 'armoires', hasFeatures: true },
            { name: 'boite_branchement', hasFeatures: true },
            { name: 'collecteur_gravitaire', hasFeatures: true },
            { name: 'equipements_culturels', hasRecords: true },
            { name: 'etalab_parcelle', hasFeatures: true },
            { name: 'gendarmeries', hasRecords: true },
            { name: 'mel_commune_llh', hasFeatures: true },
            { name: 'ne_10m_admin_0_countries', hasFeatures: true },
            { name: 'ouvrage_surfacique', hasFeatures: true },
          ]);
        });
      });
      describe('#getCollectionInfo', () => {
        it('returns a collection info', async () => {
          await expect(
            endpoint.getCollectionInfo('aires-covoiturage')
          ).resolves.toStrictEqual({
            crs: ['http://www.opengis.net/def/crs/OGC/1.3/CRS84', 'EPSG:4326'],
            itemFormats: ['text/html', 'application/geo+json'],
            bulkDownloadLinks: {
              'application/geo+json':
                'https://my.server.org/sample-data-2/collections/aires-covoiturage/items?f=geojson&limit=-1',
              'application/json':
                'https://my.server.org/sample-data-2/collections/aires-covoiturage/items?f=json&limit=-1',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                'https://my.server.org/sample-data-2/collections/aires-covoiturage/items?f=ooxml&limit=-1',
              'application/x-shapefile':
                'https://my.server.org/sample-data-2/collections/aires-covoiturage/items?f=shapefile&limit=-1',
              'text/csv;charset=UTF-8':
                'https://my.server.org/sample-data-2/collections/aires-covoiturage/items?f=csv&limit=-1',
            },
            jsonDownloadLink:
              'https://my.server.org/sample-data-2/collections/aires-covoiturage/items?f=geojson&limit=-1',
            id: 'aires-covoiturage',
            itemType: 'feature',
            mapTileFormats: [],
            queryables: [],
            sortables: [],
            supportedTileMatrixSets: [],
            title: 'aires-covoiturage',
            vectorTileFormats: [],
          });
        });
      });

      describe('#getCollectionItemsUrl', () => {
        it('selects the URL using GeoJson if asJson is specified', async () => {
          await expect(
            endpoint.getCollectionItemsUrl('aires-covoiturage', {
              asJson: true,
            })
          ).resolves.toEqual(
            'https://my.server.org/sample-data-2/collections/aires-covoiturage/items?f=geojson'
          );
        });
      });
    });
  });

  describe('url with trailing ?', () => {
    beforeEach(() => {
      endpoint = new OgcApiEndpoint(
        'http://local/sample-data/collections/airports/items?'
      );
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
  });

  describe('endpoint with tiles', () => {
    describe('nominal case', () => {
      beforeEach(() => {
        endpoint = new OgcApiEndpoint('http://local/gnosis-earth/');
      });
      describe('#hasTiles', () => {
        it('returns true', async () => {
          await expect(endpoint.hasTiles).resolves.toBe(true);
        });
      });
      describe('#tileMatrixSets', () => {
        it('returns tile matrix sets', async () => {
          await expect(endpoint.tileMatrixSets).resolves.toEqual([
            'CDB1GlobalGrid',
            'GlobalCRS84Pixel',
            'GlobalCRS84Scale',
            'GNOSISGlobalGrid',
            'GoogleCRS84Quad',
            'ISEA9R',
            'WebMercatorQuad',
            'WorldCRS84Quad',
            'WorldMercatorWGS84Quad',
          ]);
        });
      });
      describe('#allCollections', () => {
        it('returns collection ids', async () => {
          await expect(endpoint.allCollections).resolves.toEqual([
            { name: 'NaturalEarth', hasFeatures: true },
            { name: 'NaturalEarth__raster', hasFeatures: true },
            {
              name: 'NaturalEarth__raster__HYP_HR_SR_OB_DR',
              hasMapTiles: true,
              hasFeatures: true,
            },
            {
              name: 'NaturalEarth__raster__NE1_HR_LC_SR_W_DR',
              hasMapTiles: true,
              hasFeatures: true,
            },
            {
              name: 'NaturalEarth__raster__NE2_HR_LC_SR_W_DR',
              hasMapTiles: true,
              hasFeatures: true,
            },
            { name: 'NaturalEarth__physical', hasFeatures: true },
            {
              name: 'NaturalEarth__physical__ne_10m_lakes_pluvial',
              hasMapTiles: true,
              hasVectorTiles: true,
              hasFeatures: true,
            },
          ]);
        });
      });
      describe('#vectorTileCollections', () => {
        it('returns vector tile collection ids', async () => {
          await expect(endpoint.vectorTileCollections).resolves.toEqual([
            'NaturalEarth__physical__ne_10m_lakes_pluvial',
          ]);
        });
      });
      describe('#mapTileCollections', () => {
        it('returns map tile collection ids', async () => {
          await expect(endpoint.mapTileCollections).resolves.toEqual([
            'NaturalEarth__raster__HYP_HR_SR_OB_DR',
            'NaturalEarth__raster__NE1_HR_LC_SR_W_DR',
            'NaturalEarth__raster__NE2_HR_LC_SR_W_DR',
            'NaturalEarth__physical__ne_10m_lakes_pluvial',
          ]);
        });
      });
      describe('#getVectorTileUrl', () => {
        it('returns the correct url', async () => {
          await expect(
            endpoint.getVectorTilesetUrl(
              'NaturalEarth__physical__ne_10m_lakes_pluvial',
              'GlobalCRS84Pixel'
            )
          ).resolves.toEqual(
            'http://local/gnosis-earth/collections/NaturalEarth__physical__ne_10m_lakes_pluvial/tiles/GlobalCRS84Pixel?f=json'
          );
        });
      });
      describe('#getMapTileUrl', () => {
        it('returns the correct url', async () => {
          await expect(
            endpoint.getMapTilesetUrl(
              'NaturalEarth__physical__ne_10m_lakes_pluvial',
              'GlobalCRS84Pixel'
            )
          ).resolves.toEqual(
            'http://local/gnosis-earth/collections/NaturalEarth__physical__ne_10m_lakes_pluvial/map/tiles/GlobalCRS84Pixel?f=json'
          );
        });
      });
    });
  });

  describe('endpoint with styles', () => {
    beforeEach(() => {
      endpoint = new OgcApiEndpoint('http://local/sample-data/');
    });
    describe('#allStyles', () => {
      it('returns a list of styles', async () => {
        await expect(endpoint.allStyles()).resolves.toEqual([
          {
            title: 'Deuteranopia',
            id: 'Deuteranopia',
            formats: ['application/vnd.esri.lyr'],
          },
          {
            title: 'OS Open Zoomstack - Light',
            id: 'Light',
            formats: [
              'application/vnd.esri.lyr',
              'application/vnd.mapbox.style+json',
            ],
          },
          {
            title: 'OS Open Zoomstack - Night',
            id: 'Night',
            formats: [
              'application/vnd.esri.lyr',
              'application/vnd.mapbox.style+json',
            ],
          },
          {
            title: 'OS Open Zoomstack - Outdoor',
            id: 'Outdoor',
            formats: [
              'application/vnd.esri.lyr',
              'application/vnd.mapbox.style+json',
            ],
          },
          {
            title: 'OS Open Zoomstack - Outdoor with Hillshade',
            id: 'OutdoorHillshade',
            formats: ['application/vnd.mapbox.style+json'],
          },
          {
            title: 'OS Open Zoomstack - Road',
            id: 'Road',
            formats: [
              'application/vnd.esri.lyr',
              'application/vnd.mapbox.style+json',
            ],
          },
          {
            title: 'Tritanopia',
            id: 'Tritanopia',
            formats: ['application/vnd.esri.lyr'],
          },
        ]);
      });
    });
    describe('#allStyles for a given collection', () => {
      it('returns a list of styles', async () => {
        await expect(endpoint.allStyles('airports')).resolves.toEqual([
          {
            title: 'Deuteranopia',
            id: 'Deuteranopia',
            formats: [
              'application/vnd.qgis.qml',
              'application/vnd.ogc.sld+xml;version=1.0',
            ],
          },
          {
            title: 'Light',
            id: 'Light',
            formats: [
              'application/vnd.qgis.qml',
              'application/vnd.ogc.sld+xml;version=1.0',
              'application/vnd.mapbox.style+json',
            ],
          },
          {
            title: 'Night',
            id: 'Night',
            formats: [
              'application/vnd.qgis.qml',
              'application/vnd.ogc.sld+xml;version=1.0',
              'application/vnd.mapbox.style+json',
            ],
          },
          {
            title: 'Outdoor',
            id: 'Outdoor',
            formats: [
              'application/vnd.qgis.qml',
              'application/vnd.ogc.sld+xml;version=1.0',
              'application/vnd.mapbox.style+json',
            ],
          },
          {
            title: 'Road',
            id: 'Road',
            formats: [
              'application/vnd.qgis.qml',
              'application/vnd.ogc.sld+xml;version=1.0',
              'application/vnd.mapbox.style+json',
            ],
          },
          {
            title: 'Tritanopia',
            id: 'Tritanopia',
            formats: [
              'application/vnd.qgis.qml',
              'application/vnd.ogc.sld+xml;version=1.0',
            ],
          },
          {
            title: 'OS Open Zoomstack - Outdoor with Hillshade',
            id: 'OutdoorHillshade',
            formats: ['application/vnd.mapbox.style+json'],
          },
        ]);
      });
    });
    describe('#getStyle', () => {
      it('returns style metadata', async () => {
        await expect(endpoint.getStyle('Deuteranopia')).resolves.toEqual({
          title: 'Deuteranopia',
          id: 'Deuteranopia',
          scope: 'style',
          stylesheetFormats: ['application/vnd.esri.lyr'],
          stylesheets: [
            {
              title: 'ArcGIS',
              version: 'n/a',
              specification: 'https://www.esri.com/',
              native: true,
              link: {
                rel: 'stylesheet',
                type: 'application/vnd.esri.lyr',
                title: "Style in format 'ArcGIS'",
                href: 'http://local/zoomstack/styles/Deuteranopia?f=lyr',
              },
            },
          ],
        });
      });
    });
    describe('#getStyle for a given collection', () => {
      it('returns style metadata', async () => {
        await expect(
          endpoint.getStyle('Tritanopia', 'airports')
        ).resolves.toEqual({
          title: 'Tritanopia',
          id: 'Tritanopia',
          scope: 'style',
          stylesheetFormats: [
            'application/vnd.qgis.qml',
            'application/vnd.ogc.sld+xml;version=1.0',
          ],
          stylesheets: [
            {
              title: 'QGIS',
              version: '3.16',
              specification:
                'https://docs.qgis.org/3.16/en/docs/user_manual/appendices/qgis_file_formats.html#qml-the-qgis-style-file-format',
              native: true,
              link: {
                rel: 'stylesheet',
                type: 'application/vnd.qgis.qml',
                title: "Style in format 'QGIS'",
                href: 'https://my.server.org/sample-data/collections/airports/styles/Tritanopia?f=qml',
              },
            },
            {
              title: 'SLD 1.0',
              version: '1.0',
              specification: 'https://www.ogc.org/standards/sld',
              native: true,
              link: {
                rel: 'stylesheet',
                type: 'application/vnd.ogc.sld+xml;version=1.0',
                title: "Style in format 'SLD 1.0'",
                href: 'https://my.server.org/sample-data/collections/airports/styles/Tritanopia?f=sld10',
              },
            },
          ],
        });
      });
    });
    describe('#getStylesheetUrl', () => {
      it('returns the correct stylesheet URL', async () => {
        await expect(
          endpoint.getStylesheetUrl('Deuteranopia', 'application/vnd.esri.lyr')
        ).resolves.toEqual('http://local/zoomstack/styles/Deuteranopia?f=lyr');
      });
    });
    describe('#getStylesheetUrl with type Mapbox', () => {
      it('returns the correct stylesheet URL', async () => {
        await expect(
          endpoint.getStylesheetUrl('Road', 'application/vnd.mapbox.style+json')
        ).resolves.toEqual('http://local/zoomstack/styles/Road?f=mbs');
      });
    });
    describe('#getStylesheetUrl for a given collection', () => {
      it('returns the correct stylesheet URL', async () => {
        await expect(
          endpoint.getStylesheetUrl(
            'Tritanopia',
            'application/vnd.ogc.sld+xml;version=1.0',
            'airports'
          )
        ).resolves.toEqual(
          'https://my.server.org/sample-data/collections/airports/styles/Tritanopia?f=sld10'
        );
      });
    });
  });
  describe('endpoint with query params', () => {
    describe('on collections path', () => {
      beforeEach(() => {
        endpoint = new OgcApiEndpoint(
          'http://local/sample-data/collections?foo=bar'
        );
      });
      it('correctly parses endpoint info and collections', async () => {
        await expect(endpoint.info).resolves.toEqual({
          title: 'OS Open Zoomstack',
          description:
            'OS Open Zoomstack is a comprehensive vector basemap showing coverage of Great Britain at a national level, right down to street-level detail.',
          attribution:
            'Contains OS data © Crown copyright and database right 2021.',
        });
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
          'missing-feature-type-metadata',
        ]);
      });
    });
  });
});
