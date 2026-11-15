import {
  readInfoFromCapabilities,
  readLayersFromCapabilities,
  readOperationUrlsFromCapabilities,
  readVersionFromCapabilities,
} from './capabilities.js';
// @ts-expect-error ts-migrate(7016)
import capabilities130 from '../../fixtures/wms/capabilities-brgm-1-3-0.xml';
// @ts-expect-error ts-migrate(7016)
import capabilities111 from '../../fixtures/wms/capabilities-brgm-1-1-1.xml';
// @ts-expect-error ts-migrate(7016)
import capabilitiesIfremer130 from '../../fixtures/wms/capabilities-ifremer-1-3-0.xml';
// @ts-expect-error ts-migrate(7016)
import capabilitiesIfremer111 from '../../fixtures/wms/capabilities-ifremer-1-1-1.xml';
// @ts-expect-error ts-migrate(7016)
import capabilitiesIfremer110 from '../../fixtures/wms/capabilities-ifremer-1-1-0.xml';
import { parseXmlString } from '../shared/xml-utils.js';
import type { WmsLayerFull } from './model.js';

describe('WMS capabilities', () => {
  describe('readVersionFromCapabilities', () => {
    it('finds the correct version (1.3.0)', () => {
      const doc = parseXmlString(capabilities130);
      expect(readVersionFromCapabilities(doc)).toBe('1.3.0');
    });
    it('finds the correct version (1.1.1)', () => {
      const doc = parseXmlString(capabilities111);
      expect(readVersionFromCapabilities(doc)).toBe('1.1.1');
    });
  });

  describe('readLayersFromCapabilities', () => {
    const attribution = {
      title: 'Brgm',
      url: 'http://www.brgm.fr/',
      logoUrl: 'http://mapsref.brgm.fr/legendes/brgm_logo.png',
    };
    const styles = [
      {
        name: 'default',
        title: 'default',
      },
    ];
    const availableCrs = [
      'EPSG:4326',
      'CRS:84',
      'EPSG:3857',
      'EPSG:4171',
      'EPSG:2154',
    ];
    const expectedLayers = [
      {
        abstract:
          "Ensemble des services d'accès aux données sur la géologie, l'hydrogéologie et la gravimétrie, diffusées par le BRGM",
        attribution,
        availableCrs,
        boundingBoxes: {
          'CRS:84': [-180, -90, 180, 90],
          'EPSG:2154': [-1e15, -1e15, 1e15, 1e15],
          'EPSG:3857': [-1e15, -1e15, 1e15, 1e15],
          'EPSG:4171': [-180, -90, 180, 90],
          'EPSG:4326': [-180, -90, 180, 90],
        },
        keywords: [
          'Géologie',
          'BRGM',
          'INSPIRE:ViewService',
          'infoMapAccessService',
          'WMS 1.1.1',
          'WMS 1.3.0',
          'SLD 1.1.0',
        ],
        name: 'GEOSERVICES_GEOLOGIE',
        queryable: false,
        opaque: false,
        styles: [
          {
            legendUrl: expect.stringContaining(
              'http://geoservices.brgm.fr/geologie?language=fre',
            ),
            name: 'default',
            title: 'default',
          },
        ],
        title: 'GéoServices : géologie, hydrogéologie et gravimétrie',
        children: [
          {
            abstract: 'Cartes géologiques',
            attribution,
            availableCrs,
            boundingBoxes: {
              'CRS:84': [-180, -90, 180, 90],
              'EPSG:2154': [-1e15, -1e15, 1e15, 1e15],
              'EPSG:3857': [-1e15, -1e15, 1e15, 1e15],
              'EPSG:4171': [-180, -90, 180, 90],
              'EPSG:4326': [-180, -90, 180, 90],
            },
            keywords: [],
            name: 'GEOLOGIE',
            queryable: false,
            opaque: false,
            styles,
            title: 'Cartes géologiques',
            children: [
              {
                abstract:
                  'BD Scan-Million-Géol est la base de données géoréférencées de la carte géologique image à 1/1 000 000',
                attribution: {
                  logoUrl: 'http://mapsref.brgm.fr/legendes/brgm_logo.png',
                  title: 'BRGM (modified attribution)',
                  url: 'http://www.brgm.fr/',
                },
                availableCrs: [
                  'EPSG:4326',
                  'EPSG:3857',
                  'CRS:84',
                  'EPSG:32620',
                  'EPSG:32621',
                ],
                boundingBoxes: {
                  'CRS:84': [-5.86764, 41.1701, 11.0789, 51.1419],
                  'EPSG:32620': [4.26677e6, 6.57018e6, 6.28215e6, 8.59738e6],
                  'EPSG:32621': [3.93464e6, 6.12146e6, 5.93425e6, 8.11543e6],
                  'EPSG:3857': [-653183, 5.03746e6, 1.2333e6, 6.64644e6],
                  'EPSG:4326': [-5.86764, 41.1701, 11.0789, 51.1419],
                },
                keywords: ['Geologie', 'INSPIRE:Geology', 'Geology'],
                maxScaleDenominator: 1e7,
                minScaleDenominator: 200000,
                metadata: [
                  {
                    format: 'text/xml',
                    type: 'TC211',
                    url: 'http://www.geocatalogue.fr/api-public/servicesRest?Service=CSW&Request=GetRecordById&Version=2.0.2&id=BR_CAR_ADA&outputSchema=http://www.isotc211.org/2005/gmd&elementSetName=full',
                  },
                ],
                name: 'SCAN_F_GEOL1M',
                queryable: false,
                opaque: false,
                styles: [
                  {
                    legendUrl:
                      'http://mapsref.brgm.fr/legendes/geoservices/Geologie1000_legende.jpg',
                    name: 'inspire_common:DEFAULT',
                    title: 'inspire_common:DEFAULT',
                  },
                  {
                    legendUrl:
                      'http://mapsref.brgm.fr/legendes/geoservices/Geologie1000_legende_other.jpg',
                    name: 'inspire_common:OTHER',
                    title: 'inspire_common:OTHER',
                  },
                ],
                title: 'Carte géologique image de la France au million',
              },
              {
                abstract:
                  'BD Scan-Géol-250 est la base de données géoréférencées des cartes géologiques image à 1/250 000. Utilisation scientifique, technique, pédagogique',
                attribution,
                availableCrs: [
                  'EPSG:4326',
                  'EPSG:3857',
                  'CRS:84',
                  'EPSG:32620',
                  'EPSG:32621',
                ],
                boundingBoxes: {
                  'CRS:84': [-6.20495, 41.9671, 12.2874, 51.2917],
                  'EPSG:32620': [4.23619e6, 6.6238e6, 6.21236e6, 8.70077e6],
                  'EPSG:32621': [3.9038e6, 6.1856e6, 5.89555e6, 8.21306e6],
                  'EPSG:3857': [-690732, 5.15606e6, 1.36783e6, 6.67306e6],
                  'EPSG:4326': [-6.20495, 41.9671, 12.2874, 51.2917],
                },
                keywords: ['Geologie', 'INSPIRE:Geology', 'Geology'],
                maxScaleDenominator: 500000,
                minScaleDenominator: 80000,
                name: 'SCAN_F_GEOL250',
                metadata: [
                  {
                    format: 'text/xml',
                    type: 'TC211',
                    url: 'http://www.geocatalogue.fr/api-public/servicesRest?Service=CSW&Request=GetRecordById&Version=2.0.2&id=BR_CAR_ACA&outputSchema=http://www.isotc211.org/2005/gmd&elementSetName=full',
                  },
                ],
                queryable: true,
                opaque: true,
                styles,
                title: 'Carte géologique image de la France au 1/250000',
              },
              {
                abstract:
                  "BD Scan-Géol-50 est la base de données géoréférencées des cartes géologiques 'papier' à 1/50 000",
                attribution,
                availableCrs: [
                  'EPSG:4326',
                  'EPSG:3857',
                  'CRS:84',
                  'EPSG:32620',
                  'EPSG:32621',
                ],
                boundingBoxes: {
                  'CRS:84': [-12.2064, 40.681, 11.894, 52.1672],
                  'EPSG:32620': [3.88148e6, 6.13796e6, 6.31307e6, 8.70752e6],
                  'EPSG:32621': [3.52434e6, 5.74736e6, 5.97375e6, 8.23867e6],
                  'EPSG:3857': [-1.35881e6, 4.96541e6, 1.32403e6, 6.83041e6],
                  'EPSG:4326': [-12.2064, 40.681, 11.894, 52.1672],
                },
                keywords: ['Geologie', 'INSPIRE:Geology', 'Geology'],
                maxScaleDenominator: 251000,
                minScaleDenominator: 9000,
                name: 'SCAN_D_GEOL50',
                metadata: [
                  {
                    format: 'text/xml',
                    type: 'TC211',
                    url: 'http://www.geocatalogue.fr/api-public/servicesRest?Service=CSW&Request=GetRecordById&Version=2.0.2&id=72cc8d40-1bb6-41a3-8376-9734f23336ff&outputSchema=http://www.isotc211.org/2005/gmd&elementSetName=full',
                  },
                ],
                queryable: true,
                opaque: true,
                styles,
                title: 'Carte géologique image de la France au 1/50 000e',
                children: [
                  {
                    abstract: '',
                    attribution,
                    availableCrs: [
                      'EPSG:4326',
                      'EPSG:3857',
                      'CRS:84',
                      'EPSG:32620',
                      'EPSG:32621',
                    ],
                    boundingBoxes: {
                      'CRS:84': [-12.2064, 40.681, 11.894, 52.1672],
                      'EPSG:32620': [
                        3.88148e6, 6.13796e6, 6.31307e6, 8.70752e6,
                      ],
                      'EPSG:32621': [
                        3.52434e6, 5.74736e6, 5.97375e6, 8.23867e6,
                      ],
                      'EPSG:3857': [
                        -1.35881e6, 4.96541e6, 1.32403e6, 6.83041e6,
                      ],
                      'EPSG:4326': [-12.2064, 40.681, 11.894, 52.1672],
                    },
                    keywords: [],
                    maxScaleDenominator: 251000,
                    minScaleDenominator: 9000,
                    name: 'INHERIT_SCALE',
                    queryable: false,
                    opaque: false,
                    styles,
                    title: 'Inherited scale denominators',
                  },
                ],
              },
              {
                abstract: '',
                attribution: {
                  logoUrl: 'http://mapsref.brgm.fr/legendes/brgm_logo.png',
                  title: 'Brgm',
                  url: 'http://www.brgm.fr/',
                },
                availableCrs: [
                  'EPSG:4326',
                  'CRS:84',
                  'EPSG:3857',
                  'EPSG:4171',
                  'EPSG:2154',
                ],
                boundingBoxes: {
                  'CRS:84': [-180, -90, 180, 90],
                  'EPSG:2154': [-1e15, -1e15, 1e15, 1e15],
                  'EPSG:3857': [-1e15, -1e15, 1e15, 1e15],
                  'EPSG:4171': [-180, -90, 180, 90],
                  'EPSG:4326': [-180, -90, 180, 90],
                },
                keywords: [],
                name: 'INHERIT_BBOX',
                queryable: false,
                opaque: false,
                styles: [
                  {
                    name: 'default',
                    title: 'default',
                  },
                ],
                title: 'Inherited bounding boxes',
              },
            ],
          },
        ],
      },
    ];
    it('reads the layers (1.3.0)', () => {
      const doc = parseXmlString(capabilities130);
      expect(readLayersFromCapabilities(doc)).toEqual(expectedLayers);
    });
    it('reads 1.3.0 bounding boxes in latitude-first order for geographic CRSs', () => {
      const doc = parseXmlString(`<?xml version="1.0"?>
        <WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms">
          <Capability>
            <Layer>
              <Name>L</Name>
              <Title>L</Title>
              <CRS>EPSG:4326</CRS>
              <CRS>EPSG:4269</CRS>
              <BoundingBox CRS="EPSG:4326" minx="30" miny="-100" maxx="40" maxy="-90"/>
              <BoundingBox CRS="EPSG:4269" minx="30" miny="-100" maxx="40" maxy="-90"/>
            </Layer>
          </Capability>
        </WMS_Capabilities>`);
      const [layer] = readLayersFromCapabilities(doc);
      expect(layer.boundingBoxes).toEqual({
        'EPSG:4326': [-100, 30, -90, 40],
        'EPSG:4269': [-100, 30, -90, 40],
      });
    });
    it('reads the layers (1.1.1)', () => {
      const doc = parseXmlString(capabilities111);
      expect(
        readLayersFromCapabilities(doc).map(fixupScaleDenominators),
      ).toEqual(expectedLayers);
    });
  });

  describe('layer dimensions', () => {
    const expectedLayers = [
      expect.objectContaining({
        timeDimension: {
          defaultValue: new Date('2012-12-01T00:00:00.000Z'),
          multipleValues: true,
          name: 'time',
          nearestValue: false,
          values: [
            new Date('2012-01-01T00:00:00.000Z'),
            new Date('2012-02-01T00:00:00.000Z'),
            new Date('2012-03-01T00:00:00.000Z'),
            new Date('2012-04-01T00:00:00.000Z'),
            new Date('2012-05-01T00:00:00.000Z'),
            new Date('2012-06-01T00:00:00.000Z'),
            new Date('2012-07-01T00:00:00.000Z'),
            new Date('2012-08-01T00:00:00.000Z'),
            new Date('2012-09-01T00:00:00.000Z'),
            new Date('2012-10-01T00:00:00.000Z'),
            new Date('2012-11-01T00:00:00.000Z'),
            new Date('2012-12-01T00:00:00.000Z'),
          ],
          current: true,
          isTime: true,
        },
        elevationDimension: {
          defaultValue: -1,
          multipleValues: false,
          name: 'elevation',
          nearestValue: false,
          units: 'm',
          values: [
            -1, -3, -5, -10, -15, -20, -25, -30, -35, -40, -45, -50, -55, -60,
            -65, -70, -75, -80, -85, -90, -95, -100, -110, -120, -130, -140,
            -150, -160, -170, -180, -190, -200, -210, -220, -230, -240, -250,
            -260, -270, -280, -290, -300, -310, -320, -330, -340, -350, -360,
            -370, -380, -390, -400, -410, -420, -430, -440, -450, -460, -470,
            -480, -490, -500, -510, -520, -530, -540, -550, -560, -570, -580,
            -590, -600, -610, -620, -630, -640, -650, -660, -670, -680, -690,
            -700, -710, -720, -730, -740, -750, -760, -770, -780, -790, -800,
            -820, -840, -860, -880, -900, -920, -940, -960, -980, -1000, -1020,
            -1040, -1060, -1080, -1100, -1120, -1140, -1160, -1180, -1200,
            -1220, -1240, -1260, -1280, -1300, -1320, -1340, -1360, -1380,
            -1400, -1420, -1440, -1460, -1480, -1500, -1520, -1540, -1560,
            -1580, -1600, -1620, -1640, -1660, -1680, -1700, -1720, -1740,
            -1760, -1780, -1800, -1820, -1840, -1860, -1880, -1900, -1920,
            -1940, -1960, -1980, -2000, -2500, -3000, -3500, -4000, -4500,
            -5000, -5500,
          ],
        },
        otherDimensions: [
          {
            multipleValues: true,
            name: 'text_dimension',
            nearestValue: false,
            units: 'my_units',
            values: ['first', 'second', 'third'],
          },
        ],
        name: 'BVF2',
      }),
      expect.objectContaining({
        otherDimensions: [
          {
            multipleValues: true,
            name: 'text_dimension',
            nearestValue: false,
            units: 'my_units',
            values: ['first', 'second', 'third'],
          },
        ],
        name: 'MNT_DIFF_2008_2012_DUNKERQUE_EST',
      }),
      expect.objectContaining({
        timeDimension: {
          current: false,
          defaultValue: new Date('2024-12-18T00:00:00.000Z'),
          isTime: true,
          multipleValues: false,
          name: 'time',
          nearestValue: false,
          values: [
            new Date('2017-11-09T00:00:00.000Z'),
            new Date('2018-03-07T00:00:00.000Z'),
            new Date('2018-10-25T00:00:00.000Z'),
            new Date('2019-03-27T00:00:00.000Z'),
            new Date('2019-11-21T00:00:00.000Z'),
            new Date('2020-06-16T00:00:00.000Z'),
            new Date('2020-09-24T00:00:00.000Z'),
            new Date('2021-06-23T00:00:00.000Z'),
            new Date('2021-11-26T00:00:00.000Z'),
            new Date('2022-05-12T00:00:00.000Z'),
            new Date('2022-10-28T00:00:00.000Z'),
            new Date('2023-05-04T00:00:00.000Z'),
            new Date('2024-06-27T00:00:00.000Z'),
            new Date('2024-12-18T00:00:00.000Z'),
            new Date('2025-05-22T00:00:00.000Z'),
          ],
        },
        otherDimensions: [
          {
            multipleValues: true,
            name: 'text_dimension',
            nearestValue: false,
            units: 'my_units',
            values: ['hello', 'world'],
          },
        ],
        name: 'MNT_LeucateLaFranqui_2017_auj.',
      }),
      expect.objectContaining({
        timeDimension: {
          current: false,
          defaultValue: new Date('2026-08-01T00:00:00.000Z'),
          isTime: true,
          multipleValues: false,
          name: 'time',
          nearestValue: false,
          values: {
            begin: new Date('2017-10-01T00:00:00.000Z'),
            end: new Date('2026-08-01T00:00:00.000Z'),
            period: {
              days: 0,
              hours: 0,
              minutes: 1,
              months: 0,
              seconds: 0,
              years: 0,
            },
          },
        },
        elevationDimension: {
          multipleValues: false,
          name: 'elevation',
          nearestValue: false,
          unitSymbol: 'm',
          units: 'CRS:88',
          values: {
            begin: 0,
            end: 10000,
            resolution: 100,
          },
        },
        otherDimensions: [
          {
            multipleValues: true,
            name: 'text_dimension',
            nearestValue: false,
            units: 'my_units',
            values: ['first', 'second', 'third'],
          },
          {
            current: false,
            isTime: true,
            multipleValues: true,
            name: 'SEASONAL_TIME',
            nearestValue: false,
            values: {
              begin: new Date('2017-10-01T00:00:00.000Z'),
              end: new Date('2026-08-01T00:00:00.000Z'),
              period: {
                days: 0,
                hours: 0,
                minutes: 1,
                months: 0,
                seconds: 0,
                years: 0,
              },
            },
          },
          {
            defaultValue: 300,
            multipleValues: false,
            name: 'temperature',
            nearestValue: false,
            unitSymbol: 'K',
            units: 'Kelvin',
            values: [230, 300, 400],
          },
        ],
        name: 'SeasonalUserAliasLayer',
      }),
    ];
    it('reads the dimensions (1.3.0)', () => {
      const doc = parseXmlString(capabilitiesIfremer130);
      const layers = readLayersFromCapabilities(doc)[0].children;
      expect(layers).toEqual(expectedLayers);
      expect(layers[1]).not.toHaveProperty('timeDimension');
      expect(layers[1]).not.toHaveProperty('elevationDimension');
      expect(layers[2]).not.toHaveProperty('elevationDimension');
    });
    it('reads the dimensions (1.1.1)', () => {
      const doc = parseXmlString(capabilitiesIfremer111);
      const layers = readLayersFromCapabilities(doc)[0].children;
      expect(layers).toEqual(expectedLayers);
      expect(layers[1]).not.toHaveProperty('timeDimension');
      expect(layers[1]).not.toHaveProperty('elevationDimension');
      expect(layers[2]).not.toHaveProperty('elevationDimension');
    });
    it('reads the dimensions (1.1.0)', () => {
      const doc = parseXmlString(capabilitiesIfremer110);
      const layers = readLayersFromCapabilities(doc)[0].children;
      expect(layers).toEqual(expectedLayers);
      expect(layers[1]).not.toHaveProperty('timeDimension');
      expect(layers[1]).not.toHaveProperty('elevationDimension');
      expect(layers[2]).not.toHaveProperty('elevationDimension');
    });
    it('skips a 1.1.1 Dimension with no matching Extent (no values)', () => {
      const doc = parseXmlString(`<?xml version="1.0"?>
        <WMT_MS_Capabilities version="1.1.1">
          <Capability>
            <Layer>
              <Layer queryable="1">
                <Name>weather</Name>
                <Title>Weather</Title>
                <Dimension name="time" units="ISO8601"/>
              </Layer>
            </Layer>
          </Capability>
        </WMT_MS_Capabilities>`);
      const [layer] = readLayersFromCapabilities(doc)[0].children;
      expect(layer.timeDimension).toBeUndefined();
    });
    it('inherits parent dimensions, child redefinition overriding by name', () => {
      const doc = parseXmlString(`<?xml version="1.0"?>
        <WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms">
          <Capability>
            <Layer>
              <Title>Root</Title>
              <Dimension name="time" units="ISO8601" default="2024-01-01T00:00:00Z">2024-01-01T00:00:00Z</Dimension>
              <Dimension name="elevation" units="EPSG:5030" default="0">0,1000</Dimension>
              <Layer queryable="1">
                <Name>weather</Name>
                <Title>Weather</Title>
                <Dimension name="elevation" units="EPSG:5030" default="3000">3000,5000</Dimension>
              </Layer>
            </Layer>
          </Capability>
        </WMS_Capabilities>`);
      const [layer] = readLayersFromCapabilities(doc)[0].children;
      expect(layer.timeDimension).toEqual({
        name: 'time',
        isTime: true,
        defaultValue: new Date('2024-01-01T00:00:00Z'),
        values: [new Date('2024-01-01T00:00:00Z')],
        nearestValue: false,
        multipleValues: false,
        current: false,
      });
      expect(layer.elevationDimension).toEqual({
        name: 'elevation',
        units: 'EPSG:5030',
        defaultValue: 3000,
        values: [3000, 5000],
        nearestValue: false,
        multipleValues: false,
      });
    });
  });

  describe('readInfoFromCapabilities', () => {
    const expectedInfo = {
      abstract:
        "Ensemble des services d'accès aux données sur la géologie, l'hydrogéologie et la gravimétrie, diffusées par le BRGM",
      constraints: 'None',
      fees: 'no conditions apply',
      name: 'WMS',
      title: 'GéoServices : géologie, hydrogéologie et gravimétrie',
      outputFormats: [
        'image/png',
        'image/gif',
        'image/jpeg',
        'image/ecw',
        'image/tiff',
        'image/png; mode=8bit',
        'application/x-pdf',
        'image/svg+xml',
      ],
      infoFormats: ['text/plain', 'application/vnd.ogc.gml'],
      exceptionFormats: [/* these differ depending on the WMS version used */],
      keywords: [
        'Géologie',
        'BRGM',
        'INSPIRE:ViewService',
        'infoMapAccessService',
        'WMS 1.1.1',
        'WMS 1.3.0',
        'SLD 1.1.0',
      ],
      provider: {
        contact: {
          name: 'Support BRGM',
          organization: 'BRGM',
          position: 'pointOfContact',
          phone: '+33(0)2 38 64 34 34',
          fax: '+33(0)2 38 64 35 18',
          address: {
            deliveryPoint: '3, Avenue Claude Guillemin, BP36009',
            city: 'Orléans',
            administrativeArea: 'Centre',
            postalCode: '45060',
            country: 'France',
          },
          email: 'contact-brgm@brgm.fr',
        },
      },
    };

    it('reads the service info (1.3.0)', () => {
      const doc = parseXmlString(capabilities130);
      expectedInfo.exceptionFormats = ['XML', 'INIMAGE', 'BLANK'];
      expect(readInfoFromCapabilities(doc)).toEqual(expectedInfo);
    });

    it('reads the service info (1.1.1)', () => {
      const doc = parseXmlString(capabilities111);
      expectedInfo.exceptionFormats = [
        'application/vnd.ogc.se_xml',
        'application/vnd.ogc.se_inimage',
        'application/vnd.ogc.se_blank',
      ];
      expect(readInfoFromCapabilities(doc)).toEqual(expectedInfo);
    });
  });

  describe('readOperationUrlsFromCapabilities', () => {
    const expectedUrls = {
      GetCapabilities: {
        Get: 'http://geoservices.brgm.fr/geologie?language=fre&',
        Post: 'http://geoservices.brgm.fr/geologie?language=fre&',
      },
      GetMap: {
        Get: 'http://geoservices.brgm.fr/geologie?language=fre&',
        Post: 'http://geoservices.brgm.fr/geologie?language=fre&',
      },
      GetFeatureInfo: {
        Get: 'http://geoservices.brgm.fr/geologie?language=fre&',
        Post: 'http://geoservices.brgm.fr/geologie?language=fre&',
      },
      DescribeLayer: {
        Get: 'http://geoservices.brgm.fr/geologie?language=fre&',
        Post: 'http://geoservices.brgm.fr/geologie?language=fre&',
      },
      GetLegendGraphic: {
        Get: 'http://geoservices.brgm.fr/geologie?language=fre&',
        Post: 'http://geoservices.brgm.fr/geologie?language=fre&',
      },
      GetStyles: {
        Get: 'http://geoservices.brgm.fr/geologie?language=fre&',
        Post: 'http://geoservices.brgm.fr/geologie?language=fre&',
      },
    };

    it('reads the operations URLs (1.3.0)', () => {
      const doc = parseXmlString(capabilities130);
      expect(readOperationUrlsFromCapabilities(doc)).toEqual(expectedUrls);
    });

    it('reads the operations URLs (1.1.1)', () => {
      const doc = parseXmlString(capabilities111);
      expect(readOperationUrlsFromCapabilities(doc)).toEqual(expectedUrls);
    });
  });
});

/**
 * Round scale denominators to avoid problems with floating point precision
 * @param layer
 */
function fixupScaleDenominators(layer: WmsLayerFull): WmsLayerFull {
  if (layer.minScaleDenominator !== undefined) {
    layer.minScaleDenominator = Math.round(layer.minScaleDenominator);
  }
  if (layer.maxScaleDenominator !== undefined) {
    layer.maxScaleDenominator = Math.round(layer.maxScaleDenominator);
  }
  layer.children?.forEach(fixupScaleDenominators);
  return layer;
}
