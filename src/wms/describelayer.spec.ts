import { parseDescribeLayerResponse } from './describelayer.js';
// @ts-expect-error ts-migrate(7016)
import describeLayerWfs from '../../fixtures/wms/describelayer-wfs.xml';
// @ts-expect-error ts-migrate(7016)
import describeLayerWcs from '../../fixtures/wms/describelayer-wcs.xml';
import { parseXmlString } from '../shared/xml-utils.js';

describe('WMS DescribeLayer', () => {
  describe('parseDescribeLayerResponse', () => {
    it('parses a vector layer description (owsType WFS)', () => {
      const doc = parseXmlString(describeLayerWfs);
      const result = parseDescribeLayerResponse(
        doc,
        'geodata:geography_vector',
      );
      expect(result).toEqual({
        layerName: 'geodata:geography_vector',
        owsType: 'wfs',
        owsUrl: 'https://www.example.com/geoserver/wfs',
        typeName: 'geodata:geography_vector',
      });
    });

    it('parses a raster layer description (owsType WCS)', () => {
      const doc = parseXmlString(describeLayerWcs);
      const result = parseDescribeLayerResponse(doc, 'imagery:ortho_coverage');
      expect(result).toEqual({
        layerName: 'imagery:ortho_coverage',
        owsType: 'wcs',
        owsUrl: 'https://www.geodata-service.org/ows/wcs',
        typeName: 'imagery:ortho_coverage',
      });
    });

    it('returns null when the response contains no layer description', () => {
      const emptyResponse = `<?xml version="1.0" encoding="UTF-8"?>
<DescribeLayerResponse xmlns="http://www.opengis.net/sld">
    <Version>1.1.0</Version>
</DescribeLayerResponse>`;
      const doc = parseXmlString(emptyResponse);
      const result = parseDescribeLayerResponse(doc, 'nonexistent:layer');
      expect(result).toBeNull();
    });
  });
});
