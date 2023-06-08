import { parseXmlString } from '../shared/xml-utils';
// @ts-ignore
import capabilities100 from '../../fixtures/wfs/capabilities-pigma-1-0-0.xml';
// @ts-ignore
import capabilities110 from '../../fixtures/wfs/capabilities-pigma-1-1-0.xml';
// @ts-ignore
import capabilities200 from '../../fixtures/wfs/capabilities-pigma-2-0-0.xml';
// @ts-ignore
import capabilities200_noFormats from '../../fixtures/wfs/capabilities-geo2france-2-0-0.xml';
import {
  readFeatureTypesFromCapabilities,
  readInfoFromCapabilities,
  readVersionFromCapabilities,
} from './capabilities';

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
        latLonBoundingBox: [
          -1.9540704007796161, 42.73286181824404, 1.496463327812538,
          45.717071228823876,
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
        latLonBoundingBox: [
          -0.4906009184568518, 45.175543885638376, 0.9778719979726385,
          46.14349349624617,
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
        latLonBoundingBox: [
          -0.4832134559131876, 45.18037755571674, 0.9725372441782966,
          46.13877580094452,
        ],
        name: 'cd16:hierarchisation_l',
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
      expect(readFeatureTypesFromCapabilities(doc)).toEqual(expectedTypes);
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
          latLonBoundingBox: [
            1.3472171890368316, 48.82764887581316, 4.285589467078578,
            51.0896786738123,
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
    it('reads the service info (2.0.0)', () => {
      const doc = parseXmlString(capabilities200);
      expect(readInfoFromCapabilities(doc)).toEqual({
        ...expectedInfo,
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
