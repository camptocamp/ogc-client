import { parseXmlString } from '../shared/xml-utils.js';
// @ts-expect-error ts-migrate(7016)
import capabilities100 from '../../fixtures/wfs/capabilities-pigma-1-0-0.xml';
// @ts-expect-error ts-migrate(7016)
import capabilities110 from '../../fixtures/wfs/capabilities-pigma-1-1-0.xml';
// @ts-expect-error ts-migrate(7016)
import capabilities200 from '../../fixtures/wfs/capabilities-pigma-2-0-0.xml';
// @ts-expect-error ts-migrate(7016)
import capabilities200_noFormats from '../../fixtures/wfs/capabilities-geo2france-2-0-0.xml';
import {
  readFeatureTypesFromCapabilities,
  readInfoFromCapabilities,
  readVersionFromCapabilities,
} from './capabilities.js';

describe('WFS capabilities', () => {
  describe('readVersionFromCapabilities', () => {
    it('finds the correct version (2.0.0)', () => {
      const doc = parseXmlString(capabilities200);
      expect(readVersionFromCapabilities(doc)).toBe('2.0.0');
    });
    it('finds the correct version (1.1.0)', () => {
      const doc = parseXmlString(capabilities110);
      expect(readVersionFromCapabilities(doc)).toBe('1.1.0');
    });
    it('finds the correct version (1.0.0)', () => {
      const doc = parseXmlString(capabilities100);
      expect(readVersionFromCapabilities(doc)).toBe('1.0.0');
    });
  });

  describe('readFeatureTypes', () => {
    const expectedTypes = [
      {
        abstract:
          'Registre Parcellaire Graphique 2010 en Aquitaine - Agence de Service et de Paiement',
        defaultCrs: 'EPSG:2154',
        keywords: ['features', 'rpg2010'],
        latLonBoundingBox: [
          -1.9540704007796161, 42.73286181824404, 1.496463327812538,
          45.717071228823876,
        ],
        metadata: [
          {
            format: 'text/plain',
            type: 'TC211',
            url: 'https://www.pigma.org/geonetwork/?uuid=cbcae9a4-7fc0-4fc8-bd78-089af3af4e8a',
          },
        ],
        name: 'asp:asp_rpg2010',
        otherCrs: ['EPSG:32615', 'EPSG:32616', 'EPSG:32617', 'EPSG:32618'],
        outputFormats: [
          'application/gml+xml; version=3.2',
          'text/xml; subtype=gml/3.2.1',
          'text/xml; subtype=gml/3.1.1',
          'text/xml; subtype=gml/2.1.2',
        ],
        title: 'ASP - RPG 2010',
      },
      {
        abstract:
          'Représentation des moyennes journalières des trafics routiers sur les routes départementales de la\n                Charente (16) au 1er Janvier 2021.\n\n                Mise à jour : Mars 2021\n            ',
        defaultCrs: 'EPSG:2154',
        keywords: ['features', 'comptages_routiers_l'],
        latLonBoundingBox: [
          -0.4906009184568518, 45.175543885638376, 0.9778719979726385,
          46.14349349624617,
        ],
        metadata: [
          {
            format: 'text/html',
            type: 'TC211',
            url: 'https://www.pigma.org/geonetwork?uuid=4d840710-3f09-4f48-aa31-d2c4c0ee6fda',
          },
          {
            format: 'text/html',
            type: '19115',
            url: 'https://www.pigma.org/geonetwork?uuid=4d840710-3f09-4f48-aa31-d2c4c0ee6fda',
          },
          {
            format: 'text/xml',
            type: '19115',
            url: 'https://www.pigma.org/geonetwork/srv/fre/xml_iso19139?uuid=4d840710-3f09-4f48-aa31-d2c4c0ee6fda',
          },
        ],
        name: 'cd16:comptages_routiers_l',
        otherCrs: ['EPSG:32615', 'EPSG:32616', 'EPSG:32617', 'EPSG:32618'],
        outputFormats: [
          'application/gml+xml; version=3.2',
          'text/xml; subtype=gml/3.2.1',
          'text/xml; subtype=gml/3.1.1',
          'text/xml; subtype=gml/2.1.2',
          'application/json',
        ],
        title: 'CD 16 - Comptages routiers',
      },
      {
        abstract:
          'Hiérarchisation du réseau routier départemental en fonction des caractéristiques de chaque section\n                de route et de son usage au 1er Janvier 2021.\n\n                Mise à jour : Mars 2021\n            ',
        defaultCrs: 'EPSG:2154',
        keywords: ['features', 'hierarchisation_l'],
        latLonBoundingBox: [
          -0.4832134559131876, 45.18037755571674, 0.9725372441782966,
          46.13877580094452,
        ],
        name: 'cd16:hierarchisation_l',
        metadata: [
          {
            format: 'text/html',
            type: 'TC211',
            url: 'https://www.pigma.org/geonetwork?uuid=cd27adaa-0ec5-4934-9374-143df09fb9f6',
          },
          {
            format: 'text/html',
            type: '19115',
            url: 'https://www.pigma.org/geonetwork?uuid=cd27adaa-0ec5-4934-9374-143df09fb9f6',
          },
          {
            format: 'text/xml',
            type: '19115',
            url: 'https://www.pigma.org/geonetwork/srv/fre/xml_iso19139?uuid=cd27adaa-0ec5-4934-9374-143df09fb9f6',
          },
        ],
        otherCrs: ['EPSG:32615', 'EPSG:32616', 'EPSG:32617', 'EPSG:32618'],
        outputFormats: [
          'application/gml+xml; version=3.2',
          'text/xml; subtype=gml/3.2.1',
          'text/xml; subtype=gml/3.1.1',
          'text/xml; subtype=gml/2.1.2',
        ],
        title: 'CD 16 - Hiérarchisation du réseau',
      },
    ];
    it('reads the feature types (2.0.0)', () => {
      const doc = parseXmlString(capabilities200);
      const typesWithoutMetadataUrlAttributes = expectedTypes.map((type) => ({
        ...type,
        metadata: type.metadata.map((metadata) => ({ url: metadata.url })),
      }));
      expect(readFeatureTypesFromCapabilities(doc)).toEqual(
        typesWithoutMetadataUrlAttributes
      );
    });
    it('reads the feature types (1.1.0)', () => {
      const doc = parseXmlString(capabilities110);
      const typesWithGml3 = expectedTypes.map((types) => ({
        ...types,
        outputFormats: types.outputFormats.filter(
          (f) => f.indexOf('3.2') === -1 && f.indexOf('2.1') === -1
        ),
      }));
      expect(readFeatureTypesFromCapabilities(doc)).toEqual(typesWithGml3);
    });
    it('reads the feature types (1.0.0), using endpoint formats', () => {
      const doc = parseXmlString(capabilities100);
      const typesWithoutCrsAndDefaultFormats = expectedTypes.map((types) => ({
        ...types,
        outputFormats: [
          'DXF',
          'excel',
          'excel2007',
          'KML',
          'GML2',
          'GML3',
          'SHAPE-ZIP',
          'CSV',
          'JSONP',
          'JSON',
        ],
        otherCrs: [],
      }));
      expect(readFeatureTypesFromCapabilities(doc)).toEqual(
        typesWithoutCrsAndDefaultFormats
      );
    });

    describe('when a feature type does not specify its output formats', () => {
      it('uses the output formats from the endpoint', () => {
        const doc = parseXmlString(capabilities200_noFormats);
        const featureTypes = readFeatureTypesFromCapabilities(doc);
        expect(featureTypes[0]).toEqual({
          abstract: 'Domaine public',
          defaultCrs: 'EPSG:2154',
          keywords: ['domaine_public_hdf_com', 'domaine', 'public'],
          latLonBoundingBox: [
            1.3472171890368316, 48.82764887581316, 4.285589467078578,
            51.0896786738123,
          ],
          metadata: [
            {
              url: 'https://www.geo2france.fr/geonetwork/srv/fre/catalog.search#/metadata/facf3747-bc19-44c7-9fd8-1f765d99c059',
            },
            {
              url: 'https://www.geo2france.fr/geonetwork/srv/fre/catalog.search#/metadata/facf3747-bc19-44c7-9fd8-1f765d99c059',
            },
            {
              url: 'https://www.geo2france.fr/geonetwork/srv/api/records/facf3747-bc19-44c7-9fd8-1f765d99c059/formatters/xml',
            },
            {
              url: 'https://www.geo2france.fr/geonetwork/srv/api/records/facf3747-bc19-44c7-9fd8-1f765d99c059/formatters/xml',
            },
          ],
          name: 'cr_hdf:domaine_public_hdf_com',
          otherCrs: [],
          outputFormats: [
            'application/gml+xml; version=3.2',
            'DXF',
            'DXF-ZIP',
            'GML2',
            'KML',
            'SHAPE-ZIP',
            'application/json',
            'application/vnd.google-earth.kml xml',
            'application/vnd.google-earth.kml+xml',
            'csv',
            'excel',
            'excel2007',
            'gml3',
            'gml32',
            'json',
            'text/xml; subtype=gml/2.1.2',
            'text/xml; subtype=gml/3.1.1',
            'text/xml; subtype=gml/3.2',
          ],
          title: 'Domaine public',
        });
      });
    });
  });

  describe('readInfoFromCapabilities', () => {
    const expectedInfo = {
      abstract: "Service WFS de l'IDS régionale PIGMA",
      constraints: 'aucun',
      fees: 'aucun',
      name: 'WFS',
      title: "Service WFS de l'IDS régionale PIGMA",
      keywords: ['WFS', 'WMS', 'GEOSERVER'],
      outputFormats: [],
    };
    const provider = {
      name: 'GIP ATGeRi',
      site: '',
      contact: {
        name: 'PIGMA',
        position: '',
        phone: '05.57.85.40.42',
        fax: '',
        address: {
          deliveryPoint: '',
          city: 'Bordeaux',
          administrativeArea: '',
          postalCode: '33075',
          country: '',
        },
        email: 'admin.pigma@gipatgeri.fr',
      },
    };
    it('reads the service info (2.0.0)', () => {
      const doc = parseXmlString(capabilities200);
      expect(readInfoFromCapabilities(doc)).toEqual({
        ...expectedInfo,
        provider,
        outputFormats: [
          'application/gml+xml; version=3.2',
          'DXF',
          'DXF-ZIP',
          'GML2',
          'KML',
          'SHAPE-ZIP',
          'application/json',
          'application/vnd.google-earth.kml xml',
          'application/vnd.google-earth.kml+xml',
          'csv',
          'excel',
          'excel2007',
          'gml3',
          'gml32',
          'json',
          'text/javascript',
          'text/xml; subtype=gml/2.1.2',
          'text/xml; subtype=gml/3.1.1',
          'text/xml; subtype=gml/3.2',
        ],
      });
    });
    it('reads the service info (1.1.0)', () => {
      const doc = parseXmlString(capabilities110);
      expect(readInfoFromCapabilities(doc)).toEqual({
        ...expectedInfo,
        provider,
        outputFormats: [
          'text/xml; subtype=gml/3.1.1',
          'DXF',
          'DXF-ZIP',
          'GML2',
          'KML',
          'SHAPE-ZIP',
          'application/gml+xml; version=3.2',
          'application/json',
          'application/vnd.google-earth.kml xml',
          'application/vnd.google-earth.kml+xml',
          'csv',
          'excel',
          'excel2007',
          'gml3',
          'gml32',
          'json',
          'text/javascript',
          'text/xml; subtype=gml/2.1.2',
          'text/xml; subtype=gml/3.2',
        ],
      });
    });
    it('reads the service info (1.0.0)', () => {
      const doc = parseXmlString(capabilities100);
      expect(readInfoFromCapabilities(doc)).toEqual({
        ...expectedInfo,
        outputFormats: [
          'DXF',
          'excel',
          'excel2007',
          'KML',
          'GML2',
          'GML3',
          'SHAPE-ZIP',
          'CSV',
          'JSONP',
          'JSON',
        ],
      });
    });
  });
});
