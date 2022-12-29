/**
 * @typedef {import('@rgrove/parse-xml').XmlDocument} XmlDocument
 */
/**
 * @typedef {import('@rgrove/parse-xml').XmlElement} XmlElement
 */
/**
 * Parses a XML document as string, return a document object
 * @param {string} xmlString
 * @return {XmlDocument}
 */
export function parseXmlString(xmlString: string): any;
/**
 * Return the root element
 * @param {XmlDocument} xmlDoc
 * @return {XmlElement}
 */
export function getRootElement(xmlDoc: any): any;
/**
 * Will do nothing if no namespace present
 * @param {string} name
 * @return {string}
 */
export function stripNamespace(name: string): string;
/**
 * Return the element name
 * @param {XmlElement} element
 * @return {string}
 */
export function getElementName(element: any): string;
/**
 * Will return all matching elements (namespace will be ignored)
 * @param {XmlElement} element Element to look into
 * @param {string} name element name
 * @param {boolean} [nested=false] if true, will lookup children of children too
 * @return {XmlElement[]} Returns an empty array if no match found
 */
export function findChildrenElement(element: any, name: string, nested?: boolean): XmlElement[];
/**
 * Will return the first matching element
 * @param {XmlElement} element Element to look into
 * @param {string} name element name
 * @param {boolean} [nested=false] if true, will lookup children of children too
 * @return {XmlElement} Returns null if no matching element found
 */
export function findChildElement(element: any, name: string, nested?: boolean): any;
/**
 * Will return all children elements
 * @param {XmlElement} element Element to look into
 * @return {XmlElement[]} Returns empty array if no element found
 */
export function getChildrenElement(element: any): XmlElement[];
/**
 * Returns the text node in the element. Note that giving an null element
 * will simply return an empty string.
 * @param {XmlElement} element
 * @return {string} found text or empty string if no text node found
 */
export function getElementText(element: any): string;
/**
 * Returns the element's attribute value. Note that giving an null element
 * will simply return an empty string.
 * @param {XmlElement} element
 * @param {string} attrName
 * @return {string} found attribute value or empty if non existent
 */
export function getElementAttribute(element: any, attrName: string): string;
export class XmlParseError extends Error {
    constructor(message: any);
}
export type XmlDocument = any;
export type XmlElement = any;
