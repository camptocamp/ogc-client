import {
  generateDescribeFeatureTypeUrl,
  generateGetFeatureUrl,
} from './url.js';

describe('WFS url helpers', () => {
  describe('generateGetFeatureUrl', () => {
    it('generates a correct URL (v1.0.0, no max features, no attributes)', () => {
      expect(
        generateGetFeatureUrl('http://example.com/wfs', '1.0.0', 'my:type')
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=1.0.0&TYPENAME=my%3Atype'
      );
    });
    it('generates a correct URL (v1.0.0, max features 5, attributes set)', () => {
      expect(
        generateGetFeatureUrl(
          'http://example.com/wfs',
          '1.0.0',
          'my:type',
          undefined,
          5,
          ['attr1', 'attr2', 'geom']
        )
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=1.0.0&TYPENAME=my%3Atype&PROPERTYNAME=attr1%2Cattr2%2Cgeom&MAXFEATURES=5'
      );
    });
    it('generates a correct URL (v1.1.0, no max features, no attributes)', () => {
      expect(
        generateGetFeatureUrl('http://example.com/wfs', '1.1.0', 'my:type')
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=1.1.0&TYPENAME=my%3Atype'
      );
    });
    it('generates a correct URL (v2.0.0, no max features, no attributes)', () => {
      expect(
        generateGetFeatureUrl('http://example.com/wfs', '2.0.0', 'my:type')
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=my%3Atype'
      );
    });
    it('generates a correct URL for hit count only (v2.0.0, no max features, no attributes)', () => {
      expect(
        generateGetFeatureUrl(
          'http://example.com/wfs',
          '2.0.0',
          'my:type',
          undefined,
          undefined,
          undefined,
          true
        )
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=my%3Atype&RESULTTYPE=hits&COUNT=1'
      );
    });
    it('generates a correct URL (v2.0.0, max features 5, attributes set)', () => {
      expect(
        generateGetFeatureUrl(
          'http://example.com/wfs',
          '2.0.0',
          'my:type',
          undefined,
          5,
          ['attr1', 'attr2', 'geom']
        )
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=my%3Atype&PROPERTYNAME=attr1%2Cattr2%2Cgeom&COUNT=5'
      );
    });
    it('generates a correct URL (v2.0.0, output format set)', () => {
      expect(
        generateGetFeatureUrl(
          'http://example.com/wfs',
          '2.0.0',
          'my:type',
          'application/json'
        )
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=my%3Atype&OUTPUTFORMAT=application%2Fjson'
      );
    });
    it('generates a correct URL (v2.0.0)', () => {
      expect(
        generateGetFeatureUrl(
          'http://example.com/wfs',
          '2.0.0',
          'my:type',
          undefined,
          undefined,
          undefined,
          undefined,
          'EPSG:2154',
          [10, 20, 100, 200],
          'EPSG:3857'
        )
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=my%3Atype&SRSNAME=EPSG%3A2154&BBOX=10%2C20%2C100%2C200%2CEPSG%3A3857'
      );
    });
    it('generates a correct URL (v2.0.0, startIndex set)', () => {
      expect(
        generateGetFeatureUrl(
          'http://example.com/wfs',
          '2.0.0',
          'my:type',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          10
        )
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=my%3Atype&STARTINDEX=10'
      );
    });
  });

  describe('generateDescribeFeatureTypeUrl', () => {
    it('generates a correct URL (v1.0.0)', () => {
      expect(
        generateDescribeFeatureTypeUrl(
          'http://example.com/wfs',
          '1.0.0',
          'my:type'
        )
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=DescribeFeatureType&VERSION=1.0.0&TYPENAME=my%3Atype'
      );
    });
    it('generates a correct URL (v1.1.0)', () => {
      expect(
        generateDescribeFeatureTypeUrl(
          'http://example.com/wfs',
          '1.1.0',
          'my:type'
        )
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=DescribeFeatureType&VERSION=1.1.0&TYPENAME=my%3Atype'
      );
    });
    it('generates a correct URL (v2.0.0)', () => {
      expect(
        generateDescribeFeatureTypeUrl(
          'http://example.com/wfs',
          '2.0.0',
          'my:type'
        )
      ).toBe(
        'http://example.com/wfs?SERVICE=WFS&REQUEST=DescribeFeatureType&VERSION=2.0.0&TYPENAMES=my%3Atype'
      );
    });
  });
});
