// @ts-expect-error ts-migrate(7016)
import describeBuffer from '../../fixtures/wps/describeprocess-buffer.xml';
import { parseXmlString } from '../shared/xml-utils.js';
import { parseDescribeProcessResponse } from './describeprocess.js';

describe('WPS DescribeProcess', () => {
  const doc = parseXmlString(describeBuffer);

  it('returns null when the process is not found', () => {
    expect(parseDescribeProcessResponse(doc, 'not:here')).toBeNull();
  });

  describe('parseDescribeProcessResponse', () => {
    const process = parseDescribeProcessResponse(doc, 'JTS:buffer');

    it('reads the process metadata', () => {
      expect(process).toMatchObject({
        identifier: 'JTS:buffer',
        title: 'Buffer a geometry',
        abstract: 'Returns the buffer of a geometry by a given distance',
        processVersion: '1.0.0',
        statusSupported: true,
        storeSupported: true,
      });
    });

    it('parses a complex input with several supported formats', () => {
      expect(process.inputs[0]).toEqual({
        identifier: 'geom',
        title: 'The geometry to buffer',
        minOccurs: 1,
        maxOccurs: 1,
        type: 'complex',
        complexData: {
          default: { mimeType: 'application/wkt' },
          supported: [
            { mimeType: 'application/wkt' },
            { mimeType: 'application/json' },
            {
              mimeType: 'application/gml-3.1.1',
              schema: 'http://schemas.opengis.net/gml/3.1.1/base/feature.xsd',
            },
          ],
          maximumMegabytes: 5,
        },
      });
    });

    it('parses a literal input with anyValue and a default', () => {
      expect(process.inputs[1]).toEqual({
        identifier: 'distance',
        title: 'The buffer distance',
        minOccurs: 1,
        maxOccurs: 1,
        type: 'literal',
        literalData: {
          dataType: 'xs:double',
          defaultValue: '1.0',
          anyValue: true,
        },
      });
    });

    it('parses a literal input with allowedValues', () => {
      expect(process.inputs[2]).toEqual({
        identifier: 'capStyle',
        title: 'The buffer cap style',
        minOccurs: 0,
        maxOccurs: 1,
        type: 'literal',
        literalData: {
          dataType: 'xs:string',
          defaultValue: 'Round',
          allowedValues: ['Round', 'Flat', 'Square'],
        },
      });
    });

    it('parses a boundingbox input and maps unbounded to Infinity', () => {
      expect(process.inputs[3]).toEqual({
        identifier: 'extent',
        title: 'Area of interest',
        minOccurs: 0,
        maxOccurs: Infinity,
        type: 'boundingbox',
        boundingBoxData: {
          defaultCrs: 'EPSG:4326',
          supportedCrs: ['EPSG:4326', 'EPSG:3857'],
        },
      });
    });

    it('parses the complex output and its selectable formats', () => {
      expect(process.outputs).toEqual([
        {
          identifier: 'result',
          title: 'The buffered geometry',
          type: 'complex',
          complexData: {
            default: { mimeType: 'application/wkt' },
            supported: [
              { mimeType: 'application/wkt' },
              { mimeType: 'application/json' },
              { mimeType: 'application/gml-3.1.1' },
            ],
          },
        },
      ]);
    });
  });
});
