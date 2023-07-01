// @ts-ignore
import getFeatureHits110 from '../../fixtures/wfs/getfeature-hits-pigma-1-1-0.xml';
// @ts-ignore
import getFeatureHits200 from '../../fixtures/wfs/getfeature-hits-pigma-2-0-0.xml';
// @ts-ignore
import describeFeatureType110 from '../../fixtures/wfs/describefeaturetype-pigma-1-1-0-xsd.xml';
// @ts-ignore
import describeFeatureType200 from '../../fixtures/wfs/describefeaturetype-pigma-2-0-0-xsd.xml';
import { parseFeatureTypeInfo } from './featuretypeinfo';
import { parseXmlString } from '../shared/xml-utils';
import { WfsFeatureTypeFull, WfsFeatureTypeInternal } from './endpoint';

describe('feature type info', () => {
  describe('parseFeatureTypeInfo', () => {
    const featureType: WfsFeatureTypeInternal = {
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
    };

    const expectedFeatureTypeInfo: WfsFeatureTypeFull = {
      name: 'cd16:hierarchisation_l',
      title: 'CD 16 - Hiérarchisation du réseau',
      abstract:
        'Hiérarchisation du réseau routier départemental en fonction des caractéristiques de chaque section\n                de route et de son usage au 1er Janvier 2021.\n\n                Mise à jour : Mars 2021\n            ',
      boundingBox: [
        -0.4832134559131876, 45.18037755571674, 0.9725372441782966,
        46.13877580094452,
      ],
      properties: {
        axe: 'string',
        cumuld: 'integer',
        cumulf: 'integer',
        plod: 'string',
        absd: 'integer',
        plof: 'string',
        absf: 'integer',
        categorie: 'integer',
      },
      geometryName: 'geom',
      geometryType: 'linestring',
      objectCount: 364237,
      defaultCrs: 'EPSG:2154',
      otherCrs: ['EPSG:32615', 'EPSG:32616', 'EPSG:32617', 'EPSG:32618'],
      outputFormats: [
        'application/gml+xml; version=3.2',
        'text/xml; subtype=gml/3.2.1',
        'text/xml; subtype=gml/3.1.1',
        'text/xml; subtype=gml/2.1.2',
      ],
    };

    it('parses the feature type info (1.1.0)', () => {
      expect(
        parseFeatureTypeInfo(
          featureType,
          parseXmlString(describeFeatureType110),
          parseXmlString(getFeatureHits110),
          '1.1.0'
        )
      ).toEqual(expectedFeatureTypeInfo);
    });

    it('parses the feature type info (2.0.0)', () => {
      expect(
        parseFeatureTypeInfo(
          featureType,
          parseXmlString(describeFeatureType200),
          parseXmlString(getFeatureHits200),
          '2.0.0'
        )
      ).toEqual(expectedFeatureTypeInfo);
    });

    it('parses the feature type info (incomplete result)', () => {
      const incompleteFeatureType: WfsFeatureTypeInternal = {
        defaultCrs: '',
        otherCrs: [],
        outputFormats: [],
        name: 'cd16:hierarchisation_l',
        latLonBoundingBox: [
          -0.4832134559131876, 45.18037755571674, 0.9725372441782966,
          46.13877580094452,
        ],
      };
      const describeFeatureNoGeom = parseXmlString(`
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:cd16="http://pigma.org/cd16" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:wfs="http://www.opengis.net/wfs/2.0" elementFormDefault="qualified" targetNamespace="http://pigma.org/cd16">
    <xsd:import namespace="http://www.opengis.net/gml/3.2" schemaLocation="https://www.pigma.org/geoserver/schemas/gml/3.2.1/gml.xsd"/>
    <xsd:complexType name="hierarchisation_lType">
        <xsd:complexContent>
            <xsd:extension base="gml:AbstractFeatureType">
                <xsd:sequence>
                    <xsd:element maxOccurs="1" minOccurs="0" name="axe" nillable="true" type="xsd:string"/>
                    <xsd:element maxOccurs="1" minOccurs="0" name="cumuld" nillable="true" type="xsd:long"/>
                    <xsd:element maxOccurs="1" minOccurs="0" name="cumulf" nillable="true" type="xsd:long"/>
                </xsd:sequence>
            </xsd:extension>
        </xsd:complexContent>
    </xsd:complexType>
    <xsd:element name="hierarchisation_l" substitutionGroup="gml:AbstractFeature" type="cd16:hierarchisation_lType"/>
</xsd:schema>
`);
      const getFeatureNoHits = parseXmlString(
        `<wfs:FeatureCollection timeStamp="2021-06-25T12:56:16.087Z" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"/>`
      );
      expect(
        parseFeatureTypeInfo(
          incompleteFeatureType,
          describeFeatureNoGeom,
          getFeatureNoHits,
          '1.1.0'
        )
      ).toEqual({
        name: 'cd16:hierarchisation_l',
        boundingBox: [
          -0.4832134559131876, 45.18037755571674, 0.9725372441782966,
          46.13877580094452,
        ],
        properties: {
          axe: 'string',
          cumuld: 'integer',
          cumulf: 'integer',
        },
        otherCrs: [],
        outputFormats: [],
      });
    });
  });
});
