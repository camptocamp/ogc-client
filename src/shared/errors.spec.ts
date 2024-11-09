// @ts-expect-error ts-migrate(7016)
import wfsCapabilities200 from '../../fixtures/wfs/capabilities-pigma-2-0-0.xml';
// @ts-expect-error ts-migrate(7016)
import wfsException100 from '../../fixtures/wfs/service-exception-report-1-0-0.xml';
// @ts-expect-error ts-migrate(7016)
import wfsException110 from '../../fixtures/wfs/exception-report-1-1-0.xml';
// @ts-expect-error ts-migrate(7016)
import wfsException200 from '../../fixtures/wfs/exception-report-2-0-0.xml';
// @ts-expect-error ts-migrate(7016)
import wmsException110 from '../../fixtures/wms/service-exception-report-1-1-0.xml';
// @ts-expect-error ts-migrate(7016)
import wmsException111 from '../../fixtures/wms/service-exception-report-1-1-1.xml';
// @ts-expect-error ts-migrate(7016)
import wmsException130 from '../../fixtures/wms/service-exception-report-1-3-0.xml';
import {
  check,
  decodeError,
  encodeError,
  EndpointError,
  parse,
  ServiceExceptionError,
} from './errors.js';
import {
  findChildElement,
  getRootElement,
  parseXmlString,
} from './xml-utils.js';

describe('errors utils', () => {
  describe('ServiceExceptionError', () => {
    describe('it can parse a ServiceException element', () => {
      it('can parse a WFS 1.0.0 ServiceException element', () => {
        const url =
          'http://my.test.service/ogc/wfs?service=WFS&version=1.0.0&request=FooBar';
        const doc = parseXmlString(wfsException100);
        const exception = findChildElement(
          getRootElement(doc),
          'ServiceException'
        );
        expect(exception).not.toBeNull();
        const error = parse(exception, url);
        expect(error).toBeInstanceOf(ServiceExceptionError);
        expect(error.code).toBe('InvalidParameterValue');
        expect(error.locator).toBe('request');
        expect(error.message).toBe(
          'msWFSDispatch(): WFS server error. Invalid WFS request: FooBar'
        );
        expect(error.requestUrl).toBe(url);
        expect(error.response).toBe(doc);
      });
      it('can parse a WFS 1.1.0 ServiceException element', () => {
        const url =
          'http://my.test.service/ogc/wfs?service=WFS&version=1.1.0&request=FooBar';
        const doc = parseXmlString(wfsException110);
        const exception = findChildElement(getRootElement(doc), 'Exception');
        expect(exception).not.toBeNull();
        const error = parse(exception, url);
        expect(error).toBeInstanceOf(ServiceExceptionError);
        expect(error.code).toBe('InvalidParameterValue');
        expect(error.locator).toBe('request');
        expect(error.message).toBe(
          'msWFSDispatch(): WFS server error. Invalid WFS request: FooBar'
        );
        expect(error.requestUrl).toBe(url);
        expect(error.response).toBe(doc);
      });
      it('can parse a WFS 2.0.0 Exception element', () => {
        const url =
          'http://my.test.service/ogc/wfs?service=WFS&version=2.0.0&request=FooBar';
        const doc = parseXmlString(wfsException200);
        const exception = findChildElement(getRootElement(doc), 'Exception');
        expect(exception).not.toBeNull();
        const error = parse(exception, url);
        expect(error).toBeInstanceOf(ServiceExceptionError);
        expect(error.code).toBe('InvalidParameterValue');
        expect(error.locator).toBe('request');
        expect(error.message).toBe(
          'msWFSDispatch(): WFS server error. Invalid WFS request: FooBar'
        );
        expect(error.requestUrl).toBe(url);
        expect(error.response).toBe(doc);
      });
      it('can parse a WMS 1.1.0 Exception element', () => {
        const url =
          'http://my.test.service/ogc/wms?service=WMS&version=1.1.0&request=FooBar';
        const doc = parseXmlString(wmsException110);
        const exception = findChildElement(
          getRootElement(doc),
          'ServiceException'
        );
        expect(exception).not.toBeNull();
        const error = parse(exception, url);
        expect(error).toBeInstanceOf(ServiceExceptionError);
        expect(error.code).toBe('');
        expect(error.locator).toBe('');
        expect(error.message).toBe(
          'msWMSDispatch(): WMS server error. Incomplete or unsupported WMS request'
        );
        expect(error.requestUrl).toBe(url);
        expect(error.response).toBe(doc);
      });
      it('can parse a WMS 1.1.1 Exception element', () => {
        const url =
          'http://my.test.service/ogc/wms?service=WMS&version=1.1.1&request=FooBar';
        const doc = parseXmlString(wmsException111);
        const exception = findChildElement(
          getRootElement(doc),
          'ServiceException'
        );
        expect(exception).not.toBeNull();
        const error = parse(exception, url);
        expect(error).toBeInstanceOf(ServiceExceptionError);
        expect(error.code).toBe('');
        expect(error.locator).toBe('');
        expect(error.message).toBe(
          'msWMSDispatch(): WMS server error. Incomplete or unsupported WMS request'
        );
        expect(error.requestUrl).toBe(url);
        expect(error.response).toBe(doc);
      });
      it('can parse a WMS 1.3.0 Exception element', () => {
        const url =
          'http://my.test.service/ogc/wms?service=WMS&version=1.3.0&request=FooBar';
        const doc = parseXmlString(wmsException130);
        const exception = findChildElement(
          getRootElement(doc),
          'ServiceException'
        );
        expect(exception).not.toBeNull();
        const error = parse(exception, url);
        expect(error).toBeInstanceOf(ServiceExceptionError);
        expect(error.code).toBe('');
        expect(error.locator).toBe('');
        expect(error.message).toBe(
          'msWMSDispatch(): WMS server error. Incomplete or unsupported WMS request'
        );
        expect(error.requestUrl).toBe(url);
        expect(error.response).toBe(doc);
      });
    });

    describe('it can check a response document and throw a ServiceExceptionError if necessary', () => {
      it('can recognise a WFS 1.0.0 ServiceExceptionReport document', () => {
        const url =
          'http://my.test.service/ogc/wfs?service=WFS&version=1.0.0&request=FooBar';
        const doc = parseXmlString(wfsException100);
        expect(() => check(doc, url)).toThrow(ServiceExceptionError);
      });
      it('can recognise a WFS 1.1.0 ExceptionReport document', () => {
        const url =
          'http://my.test.service/ogc/wfs?service=WFS&version=1.1.0&request=FooBar';
        const doc = parseXmlString(wfsException110);
        expect(() => check(doc, url)).toThrow(ServiceExceptionError);
      });
      it('can recognise a WFS 2.0.0 ExceptionReport document', () => {
        const url =
          'http://my.test.service/ogc/wfs?service=WFS&version=2.0.0&request=FooBar';
        const doc = parseXmlString(wfsException200);
        expect(() => check(doc, url)).toThrow(ServiceExceptionError);
      });
      it('can recognise a WMS 1.1.0 ServiceExceptionReport document', () => {
        const url =
          'http://my.test.service/ogc/wms?service=WMS&version=1.1.0&request=FooBar';
        const doc = parseXmlString(wmsException110);
        expect(() => check(doc, url)).toThrow(ServiceExceptionError);
      });
      it('can recognise a WMS 1.1.1 ServiceExceptionReport document', () => {
        const url =
          'http://my.test.service/ogc/wms?service=WMS&version=1.1.1&request=FooBar';
        const doc = parseXmlString(wmsException111);
        expect(() => check(doc, url)).toThrow(ServiceExceptionError);
      });
      it('can recognise a WMS 1.3.0 ServiceExceptionReport document', () => {
        const url =
          'http://my.test.service/ogc/wms?service=WMS&version=1.3.0&request=FooBar';
        const doc = parseXmlString(wmsException130);
        expect(() => check(doc, url)).toThrow(ServiceExceptionError);
      });
      it('passes the document on if there is no exception reported', () => {
        const url =
          'http://my.test.service/ogc/wfs?service=WFS&request=GetCapabilities';
        const doc = parseXmlString(wfsCapabilities200);
        expect(() => check(doc, url)).not.toThrow(ServiceExceptionError);
      });
    });
  });

  describe('encodeError', () => {
    it('can encode a ServiceExceptionError', () => {
      const e = new ServiceExceptionError(
        'msWFSDispatch(): WFS server error. Invalid WFS request: FooBar',
        'http://my.test.service/ogc/wfs?service=WFS&version=1.0.0&request=FooBar',
        'InvalidParameterValue',
        'request',
        parseXmlString(wfsException100)
      );
      expect(encodeError(e)).toEqual({
        message:
          'msWFSDispatch(): WFS server error. Invalid WFS request: FooBar',
        stack: expect.any(String),
        name: 'ServiceExceptionError',
        code: 'InvalidParameterValue',
        locator: 'request',
        requestUrl:
          'http://my.test.service/ogc/wfs?service=WFS&version=1.0.0&request=FooBar',
        response: parseXmlString(wfsException100),
      });
    });
    it('can encode an EndpointError', () => {
      const e = new EndpointError('Network error', 0, false);
      expect(encodeError(e)).toEqual({
        message: 'Network error',
        stack: expect.any(String),
        name: 'EndpointError',
        httpStatus: 0,
        isCrossOriginRelated: false,
      });
    });
    it('can encode a generic Error', () => {
      const e = new Error('Generic error');
      expect(encodeError(e)).toEqual({
        message: 'Generic error',
        stack: expect.any(String),
        name: 'Error',
      });
    });
  });

  describe('decodeError', () => {
    it('can decode a ServiceExceptionError', () => {
      const e = {
        message:
          'msWFSDispatch(): WFS server error. Invalid WFS request: FooBar',
        stack:
          'ServiceExceptionError: msWFSDispatch(): WFS server error. Invalid WFS request: FooBar\n    at Object.<anonymous> (http://localhost:8080/ogc-client.js:1:1)',
        name: 'ServiceExceptionError',
        code: 'InvalidParameterValue',
        locator: 'request',
        requestUrl:
          'http://my.test.service/ogc/wfs?service=WFS&version=1.0.0&request=FooBar',
        response: parseXmlString(wfsException100),
      };
      const error = decodeError(e) as ServiceExceptionError;
      expect(error).toBeInstanceOf(ServiceExceptionError);
      expect(error.message).toBe(e.message);
      expect(error.stack).toBe(e.stack);
      expect(error.name).toBe(e.name);
      expect(error.code).toBe(e.code);
      expect(error.locator).toBe(e.locator);
      expect(error.requestUrl).toBe(e.requestUrl);
      expect(error.response).toBe(e.response);
    });
    it('can decode an EndpointError', () => {
      const e = {
        message: 'Network error',
        stack:
          'Error: Network error\n    at Object.<anonymous> (http://localhost:8080/ogc-client.js:1:1)',
        name: 'EndpointError',
        httpStatus: 0,
        isCrossOriginRelated: false,
      };
      const error = decodeError(e) as EndpointError;
      expect(error).toBeInstanceOf(EndpointError);
      expect(error.message).toBe(e.message);
      expect(error.stack).toBe(e.stack);
      expect(error.name).toBe(e.name);
      expect(error.httpStatus).toBe(e.httpStatus);
      expect(error.isCrossOriginRelated).toBe(e.isCrossOriginRelated);
    });
    it('can decode a generic Error', () => {
      const e = {
        message: 'Generic error',
        stack:
          'Error: Generic error\n    at Object.<anonymous> (http://localhost:8080/ogc-client.js:1:1)',
        name: 'Error',
      };
      const error = decodeError(e);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(e.message);
      expect(error.stack).toBe(e.stack);
      expect(error.name).toBe(e.name);
    });
  });
});
