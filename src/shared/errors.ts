import type { XmlDocument, XmlElement } from '@rgrove/parse-xml';
import {
  findChildElement,
  getElementAttribute,
  getElementName,
  getElementText,
  getRootElement,
  stripNamespace,
} from '../shared/xml-utils.js';

export class EndpointError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly isCrossOriginRelated?: boolean
  ) {
    super(message);
    this.name = 'EndpointError';
  }
}

/**
 * Representation of an Exception reported by an OWS service
 *
 * This is usually contained in a ServiceExceptionReport or ExceptionReport
 * document and represented as a ServiceException or Exception element
 */
export class ServiceExceptionError extends Error {
  /**
   * Constructor
   * @param message Error message
   * @param requestUrl URL which resulted in the ServiceException
   * @param code Optional ServiceException code
   * @param locator Optional ServiceException locator
   * @param response Optional response content received
   */
  public constructor(
    message: string,
    public readonly requestUrl?: string,
    public readonly code?: string,
    public readonly locator?: string,
    public readonly response?: XmlDocument
  ) {
    super(message);
    this.name = 'ServiceExceptionError';
  }
}

/**
 * Parse a ServiceException element to a ServiceExceptionError
 * @param serviceException ServiceException element
 * @param url URL from which the ServiceException was generated
 */
export function parse(
  serviceException: XmlElement,
  url?: string
): ServiceExceptionError {
  const errorCode =
    getElementAttribute(serviceException, 'code') ||
    getElementAttribute(serviceException, 'exceptionCode');
  const errorLocator = getElementAttribute(serviceException, 'locator');
  const textElement =
    findChildElement(serviceException, 'ExceptionText') || serviceException;
  const errorMessage = getElementText(textElement).trim();
  return new ServiceExceptionError(
    errorMessage,
    url,
    errorCode,
    errorLocator,
    serviceException.document
  );
}

/**
 * Check the response for a ServiceExceptionReport and if present throw one
 * @param response Response to check
 * @param url URL from which response was generated
 */
export function check(response: XmlDocument, url?: string): XmlDocument {
  const rootEl = getRootElement(response);
  const rootElName = stripNamespace(getElementName(rootEl));
  if (rootElName === 'ServiceExceptionReport') {
    // document contains a ServiceExceptionReport, so generate an Error from
    // the first ServiceException contained in it
    const error = findChildElement(rootEl, 'ServiceException');
    if (error) {
      throw parse(error, url);
    }
  }
  if (rootElName === 'ExceptionReport') {
    const error = findChildElement(rootEl, 'Exception');
    if (error) {
      throw parse(error, url);
    }
  }
  // there was nothing to convert to an Error so just pass the document on
  return response;
}

/**
 * This transforms an error object into a JSON-serializable object to be
 * transferred from a worker
 */
export function encodeError(error: Error): Record<string, unknown> {
  const base = {
    message: error.message,
    stack: error.stack,
    name: error.name,
  };
  if (error instanceof ServiceExceptionError) {
    return {
      ...base,
      code: error.code,
      locator: error.locator,
      response: error.response,
      requestUrl: error.requestUrl,
    };
  }
  if (error instanceof EndpointError) {
    return {
      ...base,
      httpStatus: error.httpStatus,
      isCrossOriginRelated: error.isCrossOriginRelated,
    };
  }
  return base;
}

/**
 * Recreates an error object
 */
export function decodeError(error: Record<string, unknown>): Error {
  if (error.name === 'ServiceExceptionError') {
    const e = new ServiceExceptionError(
      error.message as string,
      error.requestUrl as string,
      error.code as string,
      error.locator as string,
      error.response as XmlDocument
    );
    e.stack = error.stack as string;
    return e;
  }
  if (error.name === 'EndpointError') {
    const e = new EndpointError(
      error.message as string,
      error.httpStatus as number,
      error.isCrossOriginRelated as boolean
    );
    e.stack = error.stack as string;
    return e;
  }
  const e = new Error(error.message as string);
  e.stack = error.stack as string;
  return e;
}
