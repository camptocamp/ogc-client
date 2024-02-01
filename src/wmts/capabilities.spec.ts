import {
  readInfoFromCapabilities,
  readLayersFromCapabilities,
  readMatrixSetsFromCapabilities,
} from './capabilities';
import { parseXmlString } from '../shared/xml-utils';
// @ts-ignore
import ogcsample from '../../fixtures/wmts/ogcsample.xml';
// @ts-ignore
import arcgis from '../../fixtures/wmts/arcgis.xml';
// @ts-ignore
import ign from '../../fixtures/wmts/ign.xml';

describe('WMTS Capabilities', () => {
  describe('readInfoFromCapabilities', () => {
    describe('ogcsample.xml', () => {
      it('parses the service info', () => {
        const doc = parseXmlString(ogcsample);
        expect(readInfoFromCapabilities(doc)).toEqual({
          abstract:
            'Service that contrains the map\n            access interface to some TileMatrixSets\n        ',
          constraints: 'none',
          fees: 'none',
          keywords: ['tile', 'tile matrix set', 'map'],
          name: 'OGC WMTS',
          title: 'Web Map Tile Service',
          getTileUrls: {
            kvp: 'http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?',
          },
        });
      });
    });
    describe('arcgis.xml', () => {
      it('parses the service info', () => {
        const doc = parseXmlString(arcgis);
        expect(readInfoFromCapabilities(doc)).toEqual({
          abstract: '',
          constraints: '',
          fees: '',
          keywords: [],
          name: 'OGC WMTS',
          title: 'Demographics_USA_Population_Density',
          getTileUrls: {
            rest: 'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS/tile/1.0.0/',
            kvp: 'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS?',
          },
        });
      });
    });
    describe('ign.xml', () => {
      it('parses the service info', () => {
        const doc = parseXmlString(ign);
        expect(readInfoFromCapabilities(doc)).toEqual({
          abstract:
            "\n            Ce service permet la visualisation de couches de données raster IGN au travers d'un flux WMTS\n        ",
          constraints:
            "\n            Conditions Générales d'Utilisation disponibles ici :\n            http://professionnels.ign.fr/doc/Conditions_d_utilisation_des_licences_et_des_services_en_ligne.pdf\n        ",
          fees: 'licences',
          keywords: [
            'Unités administratives',
            'Limites administratives',
            'Surfaces bâties',
            'Réseaux de transport',
            'Routes',
            'Réseaux ferroviaires',
            'Aérodromes',
            'Réseau hydrographique',
            'Parcelles cadastrales',
            'Bâtiments',
            "Services d'utilité publique et services publics",
            'Réseaux de transport',
            'Hydrographie',
            'Photographies aériennes',
            'Cartes',
            'Cartes historiques',
            'Altitude',
          ],
          name: 'OGC WMTS',
          title: 'Service de visualisation WMTS',
          getTileUrls: {
            kvp: 'http://wxs.ign.fr/geoportail/wmts?',
          },
        });
      });
    });
  });

  describe('readMatrixSetsFromCapabilities', () => {
    describe('ogcsample.xml', () => {
      it('parses the matrix sets', () => {
        const doc = parseXmlString(ogcsample);
        expect(readMatrixSetsFromCapabilities(doc)).toEqual([
          {
            boundingBox: [
              1799448.394855, 6124949.74777, 1848250.442089, 6162571.828177,
            ],
            crs: 'urn:ogc:def:crs:EPSG:6.18:3:3857',
            identifier: 'google3857',
            tileMatrices: [
              {
                identifier: '0',
                matrixHeight: 1,
                matrixWidth: 1,
                scaleDenominator: 559082264.029,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '1',
                matrixHeight: 2,
                matrixWidth: 2,
                scaleDenominator: 279541132.015,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '2',
                matrixHeight: 4,
                matrixWidth: 4,
                scaleDenominator: 139770566.007,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '3',
                matrixHeight: 8,
                matrixWidth: 8,
                scaleDenominator: 69885283.0036,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '4',
                matrixHeight: 16,
                matrixWidth: 16,
                scaleDenominator: 34942641.5018,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '5',
                matrixHeight: 32,
                matrixWidth: 32,
                scaleDenominator: 17471320.7509,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '6',
                matrixHeight: 64,
                matrixWidth: 64,
                scaleDenominator: 8735660.37545,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '7',
                matrixHeight: 128,
                matrixWidth: 128,
                scaleDenominator: 4367830.18773,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '8',
                matrixHeight: 256,
                matrixWidth: 256,
                scaleDenominator: 2183915.09386,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '9',
                matrixHeight: 512,
                matrixWidth: 512,
                scaleDenominator: 1091957.54693,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '10',
                matrixHeight: 1024,
                matrixWidth: 1024,
                scaleDenominator: 545978.773466,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '11',
                matrixHeight: 2048,
                matrixWidth: 2048,
                scaleDenominator: 272989.386733,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '12',
                matrixHeight: 4096,
                matrixWidth: 4096,
                scaleDenominator: 136494.693366,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '13',
                matrixHeight: 8192,
                matrixWidth: 8192,
                scaleDenominator: 68247.3466832,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '14',
                matrixHeight: 16384,
                matrixWidth: 16384,
                scaleDenominator: 34123.6733416,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '15',
                matrixHeight: 32768,
                matrixWidth: 32768,
                scaleDenominator: 17061.8366708,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '16',
                matrixHeight: 65536,
                matrixWidth: 65536,
                scaleDenominator: 8530.9183354,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '17',
                matrixHeight: 131072,
                matrixWidth: 131072,
                scaleDenominator: 4265.4591677,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '18',
                matrixHeight: 262144,
                matrixWidth: 262144,
                scaleDenominator: 2132.72958385,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
              {
                identifier: '19',
                matrixHeight: 524288,
                matrixWidth: 524288,
                scaleDenominator: 1066.36479193,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.3428, 20037508.3428],
              },
            ],
            wellKnownScaleSet: 'urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible',
          },
          {
            crs: 'urn:ogc:def:crs:OGC:1.3:CRS84',
            identifier: 'BigWorldPixel',
            tileMatrices: [
              {
                identifier: '10000m',
                matrixHeight: 5,
                matrixWidth: 7,
                scaleDenominator: 33130800.83133142,
                tileHeight: 480,
                tileWidth: 640,
                topLeft: [-180, 90],
              },
              {
                identifier: '20000m',
                matrixHeight: 3,
                matrixWidth: 4,
                scaleDenominator: 66261601.66266284,
                tileHeight: 480,
                tileWidth: 640,
                topLeft: [-180, 90],
              },
              {
                identifier: '40000m',
                matrixHeight: 2,
                matrixWidth: 2,
                scaleDenominator: 132523203.3253257,
                tileHeight: 480,
                tileWidth: 640,
                topLeft: [-180, 90],
              },
              {
                identifier: '60000m',
                matrixHeight: 1,
                matrixWidth: 1,
                scaleDenominator: 198784804.9879885,
                tileHeight: 480,
                tileWidth: 640,
                topLeft: [-180, 90],
              },
              {
                identifier: '120000m',
                matrixHeight: 1,
                matrixWidth: 1,
                scaleDenominator: 397569609.9759771,
                tileHeight: 480,
                tileWidth: 640,
                topLeft: [-180, 90],
              },
              {
                identifier: '240000m',
                matrixHeight: 1,
                matrixWidth: 1,
                scaleDenominator: 795139219.9519541,
                tileHeight: 480,
                tileWidth: 640,
                topLeft: [-180, 90],
              },
            ],
            wellKnownScaleSet: 'urn:ogc:def:wkss:OGC:1.0:GlobalCRS84Pixel',
          },
          {
            crs: 'urn:ogc:def:crs:OGC:1.3:CRS84',
            identifier: 'BigWorld',
            tileMatrices: [
              {
                identifier: '1e6',
                matrixHeight: 50000,
                matrixWidth: 60000,
                scaleDenominator: 1000000,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-180, 84],
              },
              {
                identifier: '2.5e6',
                matrixHeight: 7000,
                matrixWidth: 9000,
                scaleDenominator: 2500000,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-180, 84],
              },
            ],
          },
          {
            crs: 'urn:ogc:def:crs:EPSG:6.18:3:3857',
            identifier: 'google3857subset',
            tileMatrices: [
              {
                identifier: '18',
                matrixHeight: 1,
                matrixWidth: 1,
                scaleDenominator: 2132.72958385,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-10000000, 10000000],
              },
              {
                identifier: '18',
                matrixHeight: 2,
                matrixWidth: 2,
                scaleDenominator: 1066.36479193,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-10000000, 10000000],
              },
            ],
          },
        ]);
      });
    });
    describe('arcgis.xml', () => {
      it('parses the matrix sets', () => {
        const doc = parseXmlString(arcgis);
        expect(readMatrixSetsFromCapabilities(doc)).toEqual([
          {
            crs: 'urn:ogc:def:crs:EPSG::3857',
            identifier: 'default028mm',
            tileMatrices: expect.arrayContaining([
              {
                identifier: '0',
                matrixHeight: 1,
                matrixWidth: 1,
                scaleDenominator: 559082264.0285016,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.342787, 20037508.342787],
              },
              {
                identifier: '1',
                matrixHeight: 1,
                matrixWidth: 1,
                scaleDenominator: 279541132.01425034,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.342787, 20037508.342787],
              },
              {
                identifier: '2',
                matrixHeight: 2,
                matrixWidth: 2,
                scaleDenominator: 139770566.00712562,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.342787, 20037508.342787],
              },
            ]),
          },
          {
            crs: 'urn:ogc:def:crs:EPSG:6.18.3:3857',
            identifier: 'GoogleMapsCompatible',
            wellKnownScaleSet: 'urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible',
            tileMatrices: expect.arrayContaining([
              {
                identifier: '0',
                matrixHeight: 1,
                matrixWidth: 1,
                scaleDenominator: 559082264.0287178,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.34278925, 20037508.34278925],
              },
              {
                identifier: '1',
                matrixHeight: 2,
                matrixWidth: 2,
                scaleDenominator: 279541132.0143589,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.34278925, 20037508.34278925],
              },
              {
                identifier: '2',
                matrixHeight: 4,
                matrixWidth: 4,
                scaleDenominator: 139770566.0071794,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508.34278925, 20037508.34278925],
              },
            ]),
          },
        ]);
      });
    });
    describe('ign.xml', () => {
      it('parses the matrix sets', () => {
        const doc = parseXmlString(ign);
        expect(readMatrixSetsFromCapabilities(doc)).toEqual([
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
              {
                identifier: '1',
                matrixHeight: 2,
                matrixWidth: 2,
                scaleDenominator: 279541132.0143589,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508, 20037508],
              },
              {
                identifier: '2',
                matrixHeight: 4,
                matrixWidth: 4,
                scaleDenominator: 139770566.0071794,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508, 20037508],
              },
            ]),
          },
          {
            crs: 'EPSG:3857',
            identifier: 'Prefixed',
            tileMatrices: [
              {
                identifier: '0',
                matrixHeight: 1,
                matrixWidth: 1,
                scaleDenominator: 559082264.0287179,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508, 20037508],
              },
              {
                identifier: '1',
                matrixHeight: 2,
                matrixWidth: 2,
                scaleDenominator: 279541132.0143589,
                tileHeight: 256,
                tileWidth: 256,
                topLeft: [-20037508, 20037508],
              },
            ],
          },
        ]);
      });
    });
  });

  describe('readLayersFromCapabilities', () => {
    describe('ogcsample.xml', () => {
      it('parses the layers', () => {
        const doc = parseXmlString(ogcsample);
        expect(readLayersFromCapabilities(doc)).toEqual([
          {
            name: 'BlueMarbleNextGeneration',
            title: 'Blue Marble Next Generation',
            abstract: 'Blue Marble Next Generation NASA Product',
            latLonBoundingBox: [-180, -90, 180, 90],
            styles: [
              {
                name: 'DarkBlue',
                title: 'Dark Blue',
                legendUrl:
                  'http://www.miramon.uab.es/wmts/Coastlines/coastlines_darkBlue.png',
              },
              {
                name: 'thickAndRed',
                title: 'Thick And Red',
              },
            ],
            defaultStyle: 'DarkBlue',
            matrixSets: [
              {
                identifier: 'BigWorldPixel',
                crs: 'urn:ogc:def:crs:EPSG:6.18:3:3857',
                limits: [],
              },
              {
                identifier: 'google3857',
                crs: 'urn:ogc:def:crs:EPSG:6.18:3:3857',
                limits: [],
              },
              {
                identifier: 'google3857subset',
                crs: 'urn:ogc:def:crs:EPSG:6.18:3:3857',
                limits: [],
              },
            ],
            resourceUrls: [
              {
                encoding: 'REST',
                format: 'image/png',
                url: 'http://www.example.com/wmts/coastlines/{TileMatrix}/{TileRow}/{TileCol}.png',
              },
              {
                encoding: 'KVP',
                format: 'image/jpeg',
                url: 'http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?',
              },
              {
                encoding: 'KVP',
                format: 'image/gif',
                url: 'http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?',
              },
            ],
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
          },
        ]);
      });
    });
    describe('arcgis.xml', () => {
      it('parses the layers', () => {
        const doc = parseXmlString(arcgis);
        expect(readLayersFromCapabilities(doc)).toEqual([
          {
            abstract: '',
            defaultStyle: 'default',
            dimensions: [],
            latLonBoundingBox: [
              -178.2278219969978, 18.910787002877576, -66.95000499993604,
              71.38957425051252,
            ],
            matrixSets: [
              {
                identifier: 'default028mm',
                crs: 'urn:ogc:def:crs:EPSG::3857',
                limits: [],
              },
              {
                identifier: 'GoogleMapsCompatible',
                crs: 'urn:ogc:def:crs:EPSG::3857',
                limits: [],
              },
            ],
            name: 'Demographics_USA_Population_Density',
            styles: [
              {
                name: 'default',
                title: 'Default Style',
              },
            ],
            title: 'Demographics_USA_Population_Density',
            resourceUrls: [
              {
                encoding: 'REST',
                format: 'image/png',
                url: 'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS/tile/1.0.0/Demographics_USA_Population_Density/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
              },
              {
                encoding: 'REST',
                format: 'image/jpeg',
                url: 'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS/tile/1.0.0/Demographics_USA_Population_Density/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg',
              },
              {
                encoding: 'KVP',
                format: 'image/png',
                url: 'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS?',
              },
            ],
          },
        ]);
      });
    });
    describe('ign.xml', () => {
      it('parses the layers', () => {
        const doc = parseXmlString(ign);
        expect(readLayersFromCapabilities(doc)).toEqual([
          {
            abstract: 'Photographies aériennes',
            defaultStyle: 'normal',
            dimensions: [],
            latLonBoundingBox: [-180, -86, 180, 84],
            matrixSets: [
              {
                identifier: 'PM',
                crs: 'EPSG:3857',
                limits: expect.arrayContaining([
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
                    maxTileCol: 4,
                    maxTileRow: 4,
                    minTileCol: 0,
                    minTileRow: 0,
                    tileMatrix: '2',
                  },
                ]),
              },
              {
                identifier: 'Prefixed',
                crs: 'EPSG:3857',
                limits: [
                  {
                    maxTileCol: 1,
                    maxTileRow: 1,
                    minTileCol: 0,
                    minTileRow: 0,
                    tileMatrix: 'Prefixed:0',
                  },
                  {
                    maxTileCol: 2,
                    maxTileRow: 2,
                    minTileCol: 0,
                    minTileRow: 0,
                    tileMatrix: 'Prefixed:1',
                  },
                ],
              },
            ],
            name: 'ORTHOIMAGERY.ORTHOPHOTOS',
            resourceUrls: [
              {
                encoding: 'KVP',
                format: 'image/jpeg',
                url: 'http://wxs.ign.fr/geoportail/wmts?',
              },
            ],
            styles: [
              {
                legendUrl: 'http://www.geoportail.gouv.fr/depot/LEGEND.jpg',
                name: 'normal',
                title: 'Données Brutes',
              },
            ],
            title: 'Photographies aériennes',
          },
        ]);
      });
    });
  });
});
