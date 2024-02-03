// @ts-ignore
import getFeatureCities100 from '../../fixtures/wfs/getfeature-props-cities-1-0-0.xml';
// @ts-ignore
import getFeatureCities110 from '../../fixtures/wfs/getfeature-props-cities-1-1-0.xml';
// @ts-ignore
import getFeatureCities200 from '../../fixtures/wfs/getfeature-props-cities-2-0-0.xml';
// @ts-ignore
import getFeatureStates100 from '../../fixtures/wfs/getfeature-props-states-1-0-0.xml';
// @ts-ignore
import getFeatureStates110 from '../../fixtures/wfs/getfeature-props-states-1-1-0.xml';
// @ts-ignore
import getFeatureStates200 from '../../fixtures/wfs/getfeature-props-states-2-0-0.xml';
// @ts-ignore
import getFeatureStates200Geojson from '../../fixtures/wfs/getfeature-props-states-2-0-0.json';
import {
  computeFeaturePropsDetails,
  parseFeatureProps,
  parseFeaturePropsGeojson,
} from './featureprops';
import { parseXmlString } from '../shared/xml-utils';
import { WfsFeatureTypeFull } from './model';

describe('feature props utils', () => {
  describe('parseFeatureProps and parseFeaturePropsGeojson', () => {
    describe('cities dataset (mapserver)', () => {
      const featureTypeFull: WfsFeatureTypeFull = {
        defaultCrs: '',
        otherCrs: [],
        outputFormats: [],
        name: 'ms:cities',
        properties: {
          NAME: 'string',
          POPULATION: 'integer',
        },
      };
      const expected = [
        {
          id: 'cities.8338',
          properties: {
            NAME: 'Buenos Aires',
            POPULATION: 12116379,
          },
        },
        {
          id: 'cities.1225',
          properties: {
            NAME: 'Karachi',
            POPULATION: 10537226,
          },
        },
        {
          id: 'cities.2616',
          properties: {
            NAME: 'Manila',
            POPULATION: 10232924,
          },
        },
        {
          id: 'cities.9339',
          properties: {
            NAME: 'Sao Paulo',
            POPULATION: 10194978,
          },
        },
        {
          id: 'cities.9181',
          properties: {
            NAME: 'Seoul',
            POPULATION: 9630586,
          },
        },
        {
          id: 'cities.9055',
          properties: {
            NAME: 'Istanbul',
            POPULATION: 9418987,
          },
        },
        {
          id: 'cities.5102',
          properties: {
            NAME: 'Shanghai',
            POPULATION: 9005576,
          },
        },
        {
          id: 'cities.1350',
          properties: {
            NAME: 'Dhaka',
            POPULATION: 8942250,
          },
        },
        {
          id: 'cities.1663',
          properties: {
            NAME: 'Jakarta',
            POPULATION: 8827879,
          },
        },
        {
          id: 'cities.6382',
          properties: {
            NAME: 'Mexico',
            POPULATION: 8681360,
          },
        },
      ];
      it('version 1.0.0', () => {
        expect(
          parseFeatureProps(
            parseXmlString(getFeatureCities100),
            featureTypeFull,
            '1.0.0'
          )
        ).toEqual(expected);
      });
      it('version 1.1.0', () => {
        expect(
          parseFeatureProps(
            parseXmlString(getFeatureCities110),
            featureTypeFull,
            '1.1.0'
          )
        ).toEqual(expected);
      });
      it('version 2.0.0', () => {
        expect(
          parseFeatureProps(
            parseXmlString(getFeatureCities200),
            featureTypeFull,
            '2.0.0'
          )
        ).toEqual(expected);
      });
    });
    describe('states dataset (geoserver)', () => {
      const featureTypeFull: WfsFeatureTypeFull = {
        defaultCrs: '',
        otherCrs: [],
        outputFormats: [],
        name: 'usa:states',
        properties: {
          AREA_LAND: 'float',
          AREA_WATER: 'float',
          PERSONS: 'integer',
          STATE_ABBR: 'string',
          STATE_NAME: 'string',
        },
      };
      const expected = [
        {
          id: 'states.1',
          properties: {
            AREA_LAND: 2.51470069067e11,
            AREA_WATER: 1.864445306e9,
            PERSONS: 563626,
            STATE_ABBR: 'WY',
            STATE_NAME: 'Wyoming',
          },
        },
        {
          id: 'states.2',
          properties: {
            AREA_LAND: 1.15883064314e11,
            AREA_WATER: 3.397122731e9,
            PERSONS: 12702379,
            STATE_ABBR: 'PA',
            STATE_NAME: 'Pennsylvania',
          },
        },
        {
          id: 'states.3',
          properties: {
            AREA_LAND: 1.05828706692e11,
            AREA_WATER: 1.0269012119e10,
            PERSONS: 11536504,
            STATE_ABBR: 'OH',
            STATE_NAME: 'Ohio',
          },
        },
        {
          id: 'states.4',
          properties: {
            AREA_LAND: 3.1416074824e11,
            AREA_WATER: 7.56659673e8,
            PERSONS: 2059179,
            STATE_ABBR: 'NM',
            STATE_NAME: 'New Mexico',
          },
        },
        {
          id: 'states.5',
          properties: {
            AREA_LAND: 2.5141638381e10,
            AREA_WATER: 6.989579585e9,
            PERSONS: 5773552,
            STATE_ABBR: 'MD',
            STATE_NAME: 'Maryland',
          },
        },
        {
          id: 'states.6',
          properties: {
            AREA_LAND: 2.677566454e9,
            AREA_WATER: 1.323668539e9,
            PERSONS: 1052567,
            STATE_ABBR: 'RI',
            STATE_NAME: 'Rhode Island',
          },
        },
        {
          id: 'states.7',
          properties: {
            AREA_LAND: 2.48607802255e11,
            AREA_WATER: 6.191433228e9,
            PERSONS: 3831074,
            STATE_ABBR: 'OR',
            STATE_NAME: 'Oregon',
          },
        },
        {
          id: 'states.8',
          properties: {
            AREA_LAND: 8.867536532e9,
            AREA_WATER: 4.923745357e9,
            PERSONS: 3725789,
            STATE_ABBR: 'PR',
            STATE_NAME: 'Puerto Rico',
          },
        },
        {
          id: 'states.9',
          properties: {
            AREA_LAND: 1.40268064888e11,
            AREA_WATER: 2.9366760483e10,
            PERSONS: 5686986,
            STATE_ABBR: 'WI',
            STATE_NAME: 'Wisconsin',
          },
        },
        {
          id: 'states.10',
          properties: {
            AREA_LAND: 1.78711239147e11,
            AREA_WATER: 4.396568298e9,
            PERSONS: 672591,
            STATE_ABBR: 'ND',
            STATE_NAME: 'North Dakota',
          },
        },
        {
          id: 'states.11',
          properties: {
            AREA_LAND: 2.84331937541e11,
            AREA_WATER: 2.047761678e9,
            PERSONS: 2700551,
            STATE_ABBR: 'NV',
            STATE_NAME: 'Nevada',
          },
        },
        {
          id: 'states.12',
          properties: {
            AREA_LAND: 1.48959236603e11,
            AREA_WATER: 4.951196915e9,
            PERSONS: 9687653,
            STATE_ABBR: 'GA',
            STATE_NAME: 'Georgia',
          },
        },
        {
          id: 'states.13',
          properties: {
            AREA_LAND: 1.22056806947e11,
            AREA_WATER: 1.92399241e10,
            PERSONS: 19378102,
            STATE_ABBR: 'NY',
            STATE_NAME: 'New York',
          },
        },
        {
          id: 'states.14',
          properties: {
            AREA_LAND: 1.34771261408e11,
            AREA_WATER: 2.960539257e9,
            PERSONS: 2915918,
            STATE_ABBR: 'AR',
            STATE_NAME: 'Arkansas',
          },
        },
      ];
      it('version 1.0.0', () => {
        expect(
          parseFeatureProps(
            parseXmlString(getFeatureStates100),
            featureTypeFull,
            '1.0.0'
          )
        ).toEqual(expected);
      });
      it('version 1.1.0', () => {
        expect(
          parseFeatureProps(
            parseXmlString(getFeatureStates110),
            featureTypeFull,
            '1.1.0'
          )
        ).toEqual(expected);
      });
      it('version 2.0.0', () => {
        expect(
          parseFeatureProps(
            parseXmlString(getFeatureStates200),
            featureTypeFull,
            '2.0.0'
          )
        ).toEqual(expected);
      });
      it('geojson format', () => {
        expect(parseFeaturePropsGeojson(getFeatureStates200Geojson)).toEqual(
          expected
        );
      });
    });
    describe('additional props not present in the feature info', () => {
      const featureTypeFull: WfsFeatureTypeFull = {
        defaultCrs: '',
        otherCrs: [],
        outputFormats: [],
        name: 'usa:states',
        properties: {
          AREA_LAND: 'float',
          PERSONS: 'integer',
        },
      };
      const expected = [
        {
          id: 'states.1',
          properties: {
            AREA_LAND: 2.51470069067e11,
            PERSONS: 563626,
          },
        },
      ];
      const xml = `
<wfs:FeatureCollection>
    <wfs:member>
        <usa:states gml:id="states.1">
            <usa:AREA_LAND>2.51470069067E11</usa:AREA_LAND>
            <usa:PERSONS>563626</usa:PERSONS>
            <usa:the_geom><gml:MultiSurface srsName="urn:ogc:def:crs:EPSG::4326" srsDimension="2" gml:id="states.1.the_geom"><gml:surfaceMember><gml:Polygon gml:id="states.1.the_geom.1"><gml:exterior><gml:LinearRing><gml:posList>45.000277 -108.621313 44.99738 -104.057697 41.001406 -104.053249 40.997959 -111.046723 45.001321 -111.055199 45.000277 -108.621313</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon></gml:surfaceMember></gml:MultiSurface></usa:the_geom>
        </usa:states>
    </wfs:member>
</wfs:FeatureCollection>`;

      it('ignores props not listed in the feature type info', () => {
        expect(
          parseFeatureProps(parseXmlString(xml), featureTypeFull, '2.0.0')
        ).toEqual(expected);
      });
    });
    describe('missing props in some features', () => {
      const featureTypeFull: WfsFeatureTypeFull = {
        defaultCrs: '',
        otherCrs: [],
        outputFormats: [],
        name: 'usa:states',
        properties: {
          AREA_LAND: 'float',
          PERSONS: 'integer',
          STATE_ABBR: 'string',
        },
      };
      const expected = [
        {
          id: 'states.1',
          properties: {
            AREA_LAND: 2.51470069067e11,
            PERSONS: 563626,
          },
        },
        {
          id: 'states.2',
          properties: {
            PERSONS: 12702379,
          },
        },
        {
          id: 'states.3',
          properties: {
            STATE_ABBR: 'OH',
          },
        },
      ];
      const xml = `
<wfs:FeatureCollection>
    <wfs:member>
        <usa:states gml:id="states.1">
            <usa:AREA_LAND>2.51470069067E11</usa:AREA_LAND>
            <usa:PERSONS>563626</usa:PERSONS>
        </usa:states>
    </wfs:member>
    <wfs:member>
        <usa:states gml:id="states.2">
            <usa:PERSONS>12702379</usa:PERSONS>
        </usa:states>
    </wfs:member>
    <wfs:member>
        <usa:states gml:id="states.3">
            <usa:STATE_ABBR>OH</usa:STATE_ABBR>
        </usa:states>
    </wfs:member>
</wfs:FeatureCollection>`;

      it('only saves defined props on objects', () => {
        expect(
          parseFeatureProps(parseXmlString(xml), featureTypeFull, '2.0.0')
        ).toStrictEqual(expected);
      });
    });
  });

  describe('computeFeaturePropsDetails', () => {
    const featuresWithProps = [
      {
        id: 'cities.8338',
        properties: {
          NAME: 'Buenos Aires',
          POPULATION: 10000,
        },
      },
      {
        id: 'cities.1225',
        properties: {
          NAME: 'Karachi',
          POPULATION: 20000,
        },
      },
      {
        id: 'cities.2616',
        properties: {
          NAME: 'Manila',
          POPULATION: 30000,
        },
      },
      {
        id: 'cities.9339',
        properties: {
          NAME: 'Sao Paulo',
          POPULATION: 30000,
        },
      },
      {
        id: 'cities.9181',
        properties: {
          NAME: 'Seoul',
          POPULATION: 30000,
        },
      },
      {
        id: 'cities.9055',
        properties: {
          NAME: 'Istanbul',
          POPULATION: 30000,
        },
      },
      {
        id: 'cities.5102',
        properties: {
          NAME: 'Shanghai',
          POPULATION: 10000,
        },
      },
      {
        id: 'cities.1350',
        properties: {
          NAME: 'Dhaka',
          POPULATION: 30000,
        },
      },
    ];
    it('computes unique values', () => {
      expect(computeFeaturePropsDetails(featuresWithProps)).toEqual({
        NAME: {
          uniqueValues: [
            {
              count: 1,
              value: 'Buenos Aires',
            },
            {
              count: 1,
              value: 'Karachi',
            },
            {
              count: 1,
              value: 'Manila',
            },
            {
              count: 1,
              value: 'Sao Paulo',
            },
            {
              count: 1,
              value: 'Seoul',
            },
            {
              count: 1,
              value: 'Istanbul',
            },
            {
              count: 1,
              value: 'Shanghai',
            },
            {
              count: 1,
              value: 'Dhaka',
            },
          ],
        },
        POPULATION: {
          uniqueValues: [
            { value: 10000, count: 2 },
            { value: 20000, count: 1 },
            { value: 30000, count: 5 },
          ],
        },
      });
    });
  });
});
