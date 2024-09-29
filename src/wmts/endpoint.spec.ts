import WmtsEndpoint from './endpoint.js';
import { useCache } from '../shared/cache.js';
// @ts-expect-error ts-migrate(7016)
import ogcsample from '../../fixtures/wmts/ogcsample.xml';
// @ts-expect-error ts-migrate(7016)
import arcgis from '../../fixtures/wmts/arcgis.xml';
// @ts-expect-error ts-migrate(7016)
import ign from '../../fixtures/wmts/ign.xml';
// @ts-expect-error ts-migrate(7016)
import capabilitiesWgs84 from '../../fixtures/wmts/capabilities_wgs84.xml';
import { buildOpenLayersTileGrid } from './ol-tilegrid.js';

jest.mock('../shared/cache', () => ({
  useCache: jest.fn((factory) => factory()),
}));

jest.mock('./ol-tilegrid', () => ({
  buildOpenLayersTileGrid: jest.fn(() => ({ tileGrid: true })),
}));

const global = window as any;

describe('WmtsEndpoint', () => {
  let endpoint: WmtsEndpoint;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OGC WMTS', () => {
    beforeEach(() => {
      global.fetchResponseFactory = () => ogcsample;
      endpoint = new WmtsEndpoint('https://my.test.service/ogc/wmts?bb=c');
    });

    it('makes a getcapabilities request', async () => {
      await endpoint.isReady();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://my.test.service/ogc/wmts?bb=c&SERVICE=WMTS&REQUEST=GetCapabilities',
        { method: 'GET' }
      );
    });

    describe('caching', () => {
      beforeEach(async () => {
        await endpoint.isReady();
      });
      it('uses cache once', () => {
        expect(useCache).toHaveBeenCalledTimes(1);
      });
      it('stores the parsed capabilities in cache', async () => {
        await expect(
          (useCache as any).mock.results[0].value
        ).resolves.toMatchObject({
          info: {
            title: 'Web Map Tile Service',
          },
        });
      });
    });

    describe('#isReady', () => {
      it('resolves with the endpoint object', async () => {
        await expect(endpoint.isReady()).resolves.toEqual(endpoint);
      });
    });

    describe('#getLayers', () => {
      it('returns a list of layers', async () => {
        await endpoint.isReady();
        expect(endpoint.getLayers()).toEqual([
          expect.objectContaining({
            name: 'BlueMarbleNextGeneration',
            title: 'Blue Marble Next Generation',
          }),
        ]);
      });
    });

    describe('#getLayerByName', () => {
      it('returns a layer', async () => {
        await endpoint.isReady();
        expect(
          endpoint.getLayerByName('BlueMarbleNextGeneration')
        ).toMatchObject({
          abstract: 'Blue Marble Next Generation NASA Product',
          name: 'BlueMarbleNextGeneration',
          defaultStyle: 'DarkBlue',
          dimensions: [
            {
              defaultValue: '20110805',
              identifier: 'Time',
              values: [],
            },
            {
              defaultValue: 'abcd',
              identifier: 'OtherDimension',
              values: [],
            },
          ],
          latLonBoundingBox: [-180, -90, 180, 90],
        });
      });
    });

    describe('#getLayerResourceUrl', () => {
      it('returns a layer resource url without type hint', async () => {
        await endpoint.isReady();
        expect(
          endpoint.getLayerResourceLink('BlueMarbleNextGeneration')
        ).toEqual({
          encoding: 'REST',
          format: 'image/png',
          url: 'http://www.example.com/wmts/coastlines/{TileMatrix}/{TileRow}/{TileCol}.png',
        });
      });
      it('returns a layer resource url with type hint', async () => {
        await endpoint.isReady();
        expect(
          endpoint.getLayerResourceLink(
            'BlueMarbleNextGeneration',
            'image/jpeg'
          )
        ).toEqual({
          encoding: 'KVP',
          format: 'image/jpeg',
          url: 'http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?',
        });
      });
    });

    describe('#getSingleLayerName', () => {
      it('returns the layer name', async () => {
        await endpoint.isReady();
        expect(endpoint.getSingleLayerName()).toBe('BlueMarbleNextGeneration');
      });
    });

    describe('#getDefaultDimensions', () => {
      it('returns a specific matrix set', async () => {
        await endpoint.isReady();
        expect(
          endpoint.getDefaultDimensions('BlueMarbleNextGeneration')
        ).toEqual({ OtherDimension: 'abcd', Time: '20110805' });
      });
    });

    describe('#getOpenLayersTileGrid', () => {
      it('returns a tile grid using the first matrix set', async () => {
        await endpoint.isReady();
        const tileGrid = await endpoint.getOpenLayersTileGrid(
          'BlueMarbleNextGeneration'
        );
        expect(buildOpenLayersTileGrid).toHaveBeenCalledWith(
          {
            crs: 'urn:ogc:def:crs:OGC:1.3:CRS84',
            identifier: 'BigWorldPixel',
            tileMatrices: expect.arrayContaining([
              {
                identifier: '10000m',
                matrixHeight: 5,
                matrixWidth: 7,
                scaleDenominator: 33130800.83133142,
                tileHeight: 480,
                tileWidth: 640,
                topLeft: [-180, 90],
              },
            ]),
            wellKnownScaleSet: 'urn:ogc:def:wkss:OGC:1.0:GlobalCRS84Pixel',
          },
          []
        );
        expect(tileGrid).toEqual({ tileGrid: true });
      });
      it('returns a tile grid using a specific matrix set', async () => {
        await endpoint.isReady();
        await endpoint.getOpenLayersTileGrid(
          'BlueMarbleNextGeneration',
          'google3857'
        );
        expect(buildOpenLayersTileGrid).toHaveBeenCalledWith(
          {
            boundingBox: [
              1799448.394855, 6124949.74777, 1848250.442089, 6162571.828177,
            ],
            crs: 'urn:ogc:def:crs:EPSG:6.18:3:3857',
            identifier: 'google3857',
            tileMatrices: expect.arrayContaining([
              {
                identifier: '0',
                matrixHeight: 1,
                matrixWidth: 1,
                scaleDenominator: 559082264.029,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
            ]),
            wellKnownScaleSet: 'urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible',
          },
          []
        );
      });
    });

    describe('#getMatrixSets', () => {
      it('returns a list of matrix sets', async () => {
        await endpoint.isReady();
        expect(endpoint.getMatrixSets()).toEqual([
          expect.objectContaining({
            identifier: 'google3857',
          }),
          expect.objectContaining({
            identifier: 'BigWorldPixel',
          }),
          expect.objectContaining({
            identifier: 'BigWorld',
          }),
          expect.objectContaining({
            identifier: 'google3857subset',
          }),
        ]);
      });
    });

    describe('#getMatrixSetByIdentifier', () => {
      it('returns a specific matrix set', async () => {
        await endpoint.isReady();
        // TODO
      });
    });

    describe('#getServiceInfo', () => {
      it('returns service info', async () => {
        await endpoint.isReady();
        expect(endpoint.getServiceInfo()).toEqual({
          abstract:
            'Service that contrains the map\n            access interface to some TileMatrixSets\n        ',
          constraints: 'none',
          fees: 'none',
          keywords: ['tile', 'tile matrix set', 'map'],
          name: 'OGC WMTS',
          provider: {
            name: 'MiraMon',
            site: 'http://www.creaf.uab.cat/miramon',
            contact: {
              name: 'Joan Maso Pau',
              position: 'Senior Software Engineer',
              phone: '+34 93 581 1312',
              fax: '+34 93 581 4151',
              address: {
                deliveryPoint: 'Fac Ciencies UAB',
                city: 'Bellaterra',
                administrativeArea: 'Barcelona',
                postalCode: '08193',
                country: 'Spain',
              },
              email: 'joan.maso@uab.cat',
            },
          },
          title: 'Web Map Tile Service',
          getTileUrls: {
            kvp: 'http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?',
          },
        });
      });
    });

    describe('#getTileUrl', () => {
      it('returns a full tile url (KVP)', async () => {
        await endpoint.isReady();
        expect(
          endpoint.getTileUrl(
            'BlueMarbleNextGeneration',
            'DarkBlue',
            'BigWorldPixel',
            '3',
            2,
            1,
            'image/gif'
          )
        ).toEqual(
          'http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?layer=BlueMarbleNextGeneration&style=DarkBlue&tilematrixset=BigWorldPixel&Service=WMTS&Request=GetTile&Format=image%2Fgif&TileMatrix=3&TileCol=1&TileRow=2'
        );
      });
      it('returns a full tile url (REST)', async () => {
        await endpoint.isReady();
        expect(
          endpoint.getTileUrl(
            'BlueMarbleNextGeneration',
            'thickAndRed',
            'google3857subset',
            '18',
            2,
            3
          )
        ).toBe('http://www.example.com/wmts/coastlines/18/2/3.png');
      });
    });
  });

  describe('ArcGIS WMTS', () => {
    beforeEach(() => {
      global.fetchResponseFactory = () => arcgis;
      endpoint = new WmtsEndpoint('https://my.test.service/ogc/wmts?bb=c');
    });

    describe('#getLayers', () => {
      it('returns a list of layers', async () => {
        await endpoint.isReady();
        expect(endpoint.getLayers()).toEqual([
          expect.objectContaining({
            name: 'Demographics_USA_Population_Density',
            title: 'Demographics_USA_Population_Density',
          }),
        ]);
      });
    });

    describe('#getLayerByName', () => {
      it('returns a layer', async () => {
        await endpoint.isReady();
        expect(
          endpoint.getLayerByName('Demographics_USA_Population_Density')
        ).toMatchObject({
          abstract: '',
          name: 'Demographics_USA_Population_Density',
          defaultStyle: 'default',
          dimensions: [],
          latLonBoundingBox: [
            -178.2278219969978, 18.910787002877576, -66.95000499993604,
            71.38957425051252,
          ],
        });
      });
    });

    describe('#getMatrixSets', () => {
      it('returns a list of matrix sets', async () => {
        await endpoint.isReady();
        expect(endpoint.getMatrixSets()).toEqual([
          expect.objectContaining({
            identifier: 'default028mm',
          }),
          expect.objectContaining({
            identifier: 'GoogleMapsCompatible',
          }),
        ]);
      });
    });

    describe('#getServiceInfo', () => {
      it('returns service info', async () => {
        await endpoint.isReady();
        expect(endpoint.getServiceInfo()).toEqual({
          abstract: '',
          constraints: '',
          fees: '',
          getTileUrls: {
            kvp: 'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS?',
            rest: 'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS/tile/1.0.0/',
          },
          keywords: [],
          name: 'OGC WMTS',
          title: 'Demographics_USA_Population_Density',
          provider: {
            name: '',
            site: '',
            contact: {
              name: '',
              position: '',
              phone: '',
              fax: '',
              address: {
                deliveryPoint: '',
                city: '',
                administrativeArea: '',
                postalCode: '',
                country: '',
              },
              email: '',
            },
          },
        });
      });
    });

    describe('#getTileUrl', () => {
      it('returns a full tile url (REST)', async () => {
        await endpoint.isReady();
        expect(
          endpoint.getTileUrl(
            'Demographics_USA_Population_Density',
            'default',
            'default028mm',
            '3',
            2,
            1
          )
        ).toEqual(
          'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS/tile/1.0.0/Demographics_USA_Population_Density/default/default028mm/3/2/1.png'
        );
      });
      it('returns a full tile url with type hint (REST)', async () => {
        await endpoint.isReady();
        expect(
          endpoint.getTileUrl(
            'Demographics_USA_Population_Density',
            'default',
            'default028mm',
            '3',
            2,
            1,
            'image/jpeg'
          )
        ).toBe(
          'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS/tile/1.0.0/Demographics_USA_Population_Density/default/default028mm/3/2/1.jpeg'
        );
      });
    });
  });

  describe('IGN WMTS', () => {
    beforeEach(() => {
      global.fetchResponseFactory = () => ign;
      endpoint = new WmtsEndpoint('https://my.test.service/ogc/wmts?bb=c');
    });

    describe('#getOpenLayersTileGrid', () => {
      it('returns a tile grid including tile limits', async () => {
        await endpoint.isReady();
        await endpoint.getOpenLayersTileGrid('ORTHOIMAGERY.ORTHOPHOTOS');
        expect(buildOpenLayersTileGrid).toHaveBeenCalledWith(
          {
            crs: 'EPSG:3857',
            identifier: 'PM',
            tileMatrices: expect.arrayContaining([
              {
                identifier: '0',
                matrixHeight: 1,
                matrixWidth: 1,
                scaleDenominator: 559082264.0287179,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508, 20037508],
              },
            ]),
          },
          expect.arrayContaining([
            {
              maxTileCol: 1,
              maxTileRow: 1,
              minTileCol: 0,
              minTileRow: 0,
              tileMatrix: '0',
            },
            {
              maxTileCol: 2,
              maxTileRow: 2,
              minTileCol: 0,
              minTileRow: 0,
              tileMatrix: '1',
            },
            {
              maxTileCol: 1024,
              maxTileRow: 1024,
              minTileCol: 0,
              minTileRow: 31,
              tileMatrix: '10',
            },
            {
              maxTileCol: 2048,
              maxTileRow: 2048,
              minTileCol: 0,
              minTileRow: 62,
              tileMatrix: '11',
            },
            {
              maxTileCol: 4096,
              maxTileRow: 4096,
              minTileCol: 0,
              minTileRow: 125,
              tileMatrix: '12',
            },
          ])
        );
      });
    });
  });

  describe('WMTS with 2 layers', () => {
    beforeEach(() => {
      global.fetchResponseFactory = () => capabilitiesWgs84;
      endpoint = new WmtsEndpoint('https://my.test.service/ogc/wmts?bb=c');
    });
    describe('getSingleLayerName', () => {
      it('returns null', async () => {
        await endpoint.isReady();
        expect(endpoint.getSingleLayerName()).toBe(null);
      });
    });
  });
});
