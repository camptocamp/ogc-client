// @ts-expect-error ts-migrate(7016)
import executeSucceededInline from '../../fixtures/wps/execute-succeeded-inline.xml';
// @ts-expect-error ts-migrate(7016)
import executeSucceededReference from '../../fixtures/wps/execute-succeeded-reference.xml';
// @ts-expect-error ts-migrate(7016)
import executeSucceededReferencePlainHref from '../../fixtures/wps/execute-succeeded-reference-plain-href.xml';
// @ts-expect-error ts-migrate(7016)
import executeAccepted from '../../fixtures/wps/execute-accepted.xml';
// @ts-expect-error ts-migrate(7016)
import executeFailed from '../../fixtures/wps/execute-failed.xml';
// @ts-expect-error ts-migrate(7016)
import exceptionReport from '../../fixtures/wps/exception-report.xml';
import {
  findChildElement,
  getElementText,
  getRootElement,
  parseXmlString,
} from '../shared/xml-utils.js';
import { ServiceExceptionError } from '../shared/errors.js';
import { buildExecuteRequest, parseExecuteResponse } from './execute.js';
import { WpsProcessFull } from './model.js';

const process: WpsProcessFull = {
  identifier: 'JTS:buffer',
  statusSupported: true,
  storeSupported: true,
  inputs: [],
  outputs: [],
};

describe('WPS Execute', () => {
  describe('buildExecuteRequest', () => {
    it('builds a request with literal, bbox and complex inputs', () => {
      const body = buildExecuteRequest(
        process,
        {
          inputs: [
            { identifier: 'distance', literalValue: '10' },
            {
              identifier: 'geom',
              complexValue: {
                mimeType: 'application/wkt',
                content: 'POINT (0 0)',
              },
            },
            {
              identifier: 'extent',
              boundingBoxValue: {
                crs: 'EPSG:4326',
                bbox: [-1, -2, 3, 4],
              },
            },
          ],
          outputs: [{ identifier: 'result', mimeType: 'application/json' }],
          storeExecuteResponse: true,
          status: true,
        },
        '1.0.0'
      );
      expect(body).toMatchSnapshot();
      // must be well-formed
      expect(() => parseXmlString(body)).not.toThrow();
    });

    it('inserts XML complex content raw and wraps non-XML content in CDATA', () => {
      const gml = buildExecuteRequest(
        process,
        {
          inputs: [
            {
              identifier: 'geom',
              complexValue: {
                mimeType: 'application/gml-3.1.1',
                content: '<gml:Point><gml:pos>0 0</gml:pos></gml:Point>',
              },
            },
          ],
          outputs: [{ identifier: 'result' }],
        },
        '1.0.0'
      );
      expect(gml).toContain('<gml:Point><gml:pos>0 0</gml:pos></gml:Point>');
      expect(gml).not.toContain('CDATA');

      const json = buildExecuteRequest(
        process,
        {
          inputs: [
            {
              identifier: 'geom',
              complexValue: {
                mimeType: 'application/json',
                content: '{"type":"Point","coordinates":[0,0]}',
              },
            },
          ],
          outputs: [{ identifier: 'result' }],
        },
        '1.0.0'
      );
      expect(json).toContain(
        '<![CDATA[{"type":"Point","coordinates":[0,0]}]]>'
      );
    });

    describe('XML escaping / injection', () => {
      it('escapes special characters in literal values and attributes and stays well-formed', () => {
        const nasty = 'a < b & c > d " e \' f';
        const body = buildExecuteRequest(
          process,
          {
            inputs: [{ identifier: 'distance', literalValue: nasty }],
            outputs: [
              { identifier: 'result', mimeType: 'text/x"ml & <weird>' },
            ],
          },
          '1.0.0'
        );
        const doc = parseXmlString(body);
        const literal = findChildElement(
          findChildElement(
            findChildElement(
              findChildElement(getRootElement(doc), 'DataInputs'),
              'Input'
            ),
            'Data'
          ),
          'LiteralData'
        );
        // the value survives the round-trip unchanged
        expect(getElementText(literal)).toBe(nasty);
      });

      it('keeps complex CDATA content well-formed even when it contains "]]>"', () => {
        const body = buildExecuteRequest(
          process,
          {
            inputs: [
              {
                identifier: 'geom',
                complexValue: {
                  mimeType: 'text/plain',
                  content: 'foo ]]> bar',
                },
              },
            ],
            outputs: [{ identifier: 'result' }],
          },
          '1.0.0'
        );
        expect(() => parseXmlString(body)).not.toThrow();
        const complex = findChildElement(
          findChildElement(
            findChildElement(
              findChildElement(
                getRootElement(parseXmlString(body)),
                'DataInputs'
              ),
              'Input'
            ),
            'Data'
          ),
          'ComplexData'
        );
        expect(getElementText(complex)).toBe('foo ]]> bar');
      });
    });
  });

  describe('parseExecuteResponse', () => {
    it('parses a succeeded response with inline data', () => {
      const result = parseExecuteResponse(
        parseXmlString(executeSucceededInline)
      );
      expect(result).toEqual({
        status: 'succeeded',
        outputs: [
          {
            identifier: 'result',
            title: 'The buffered geometry',
            data: {
              mimeType: 'application/wkt',
              content: 'POLYGON ((10 0, 0 10, -10 0, 0 -10, 10 0))',
            },
          },
        ],
      });
    });

    it('parses a succeeded response with a reference output', () => {
      const result = parseExecuteResponse(
        parseXmlString(executeSucceededReference)
      );
      expect(result).toMatchObject({
        status: 'succeeded',
        statusLocation:
          'https://my.wps.server/geoserver/ows?SERVICE=WPS&REQUEST=GetExecutionStatus&EXECUTIONID=abc123',
        outputs: [
          {
            identifier: 'result',
            reference: {
              href: 'https://my.wps.server/geoserver/ows?service=WMS&version=1.3.0&request=GetCapabilities',
              mimeType: 'application/x-ogc-wms',
            },
          },
        ],
      });
    });

    it('parses a reference output with a plain (non-xlink) href attribute', () => {
      const result = parseExecuteResponse(
        parseXmlString(executeSucceededReferencePlainHref)
      );
      expect(result).toMatchObject({
        status: 'succeeded',
        outputs: [
          {
            identifier: 'OUTPUT',
            reference: {
              href: 'https://sextant.ifremer.fr/services/wps3/demo/jobs/abc123/files/output.json',
              mimeType: 'application/json',
            },
          },
        ],
      });
    });

    it('parses an accepted/started response with statusLocation and percentCompleted', () => {
      const result = parseExecuteResponse(parseXmlString(executeAccepted));
      expect(result).toMatchObject({
        status: 'started',
        percentCompleted: 35,
        statusLocation:
          'https://my.wps.server/geoserver/ows?SERVICE=WPS&REQUEST=GetExecutionStatus&EXECUTIONID=abc123',
        outputs: [],
      });
    });

    it('throws on a ProcessFailed nested exception (HTTP 200)', () => {
      let error: ServiceExceptionError;
      try {
        parseExecuteResponse(parseXmlString(executeFailed));
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ServiceExceptionError);
      expect(error.message).toBe(
        'Failed to execute process JTS:buffer: distance must be a number'
      );
      expect(error.code).toBe('NoApplicableCode');
      expect(error.locator).toBe('distance');
    });

    it('throws on a root-level exception report', () => {
      let error: ServiceExceptionError;
      try {
        parseExecuteResponse(parseXmlString(exceptionReport));
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ServiceExceptionError);
      expect(error.message).toBe('Could not find process unknown:process');
      expect(error.code).toBe('InvalidParameterValue');
    });
  });
});
