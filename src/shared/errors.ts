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
