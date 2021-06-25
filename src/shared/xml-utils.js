import parser from '@rgrove/parse-xml';

export class XmlParseError extends Error {
  constructor(message) {
    super(message);
  }
}

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
export function parseXmlString(xmlString) {
  let doc = null;
  try {
    doc = parser(xmlString);
  } catch (e) {
    throw new XmlParseError(e.message);
  }
  return doc;
}

/**
 * Return the root element
 * @param {XmlDocument} xmlDoc
 * @return {XmlElement}
 */
export function getRootElement(xmlDoc) {
  return xmlDoc.children[0];
}

/**
 * Return the element name without namespace
 * @param {XmlElement} element
 * @return {string}
 */
function getElementName(element) {
  const colon = element.name && element.name.indexOf(':');
  return colon > -1 ? element.name.substr(colon + 1) : element.name;
}

/**
 * Will return all matching elements
 * @param {XmlElement} element Element to look into
 * @param {string} name element name
 * @param {boolean} [nested=false] if true, will lookup children of children too
 * @return {XmlElement[]} Returns an empty array if no match found
 */
export function findChildrenElement(element, name, nested) {
  function reducer(prev, curr) {
    if (getElementName(curr) === name) {
      prev.push(curr);
    }

    if (nested && Array.isArray(curr.children)) {
      return [...prev, ...curr.children.reduce(reducer, [])];
    } else {
      return prev;
    }
  }

  return element && Array.isArray(element.children)
    ? element.children.reduce(reducer, [])
    : [];
}

/**
 * Will return the first matching element
 * @param {XmlElement} element Element to look into
 * @param {string} name element name
 * @param {boolean} [nested=false] if true, will lookup children of children too
 * @return {XmlElement} Returns null if no matching element found
 */
export function findChildElement(element, name, nested) {
  return findChildrenElement(element, name, nested)[0] || null;
}

/**
 * Returns the text node in the element. Note that giving an null element
 * will simply return an empty string.
 * @param {XmlElement} element
 * @return {string} found text or empty string if no text node found
 */
export function getElementText(element) {
  const textNode =
    element && Array.isArray(element.children)
      ? element.children.find((node) => node.type === 'text')
      : null;
  return textNode ? textNode.text : '';
}

/**
 * Returns the element's attribute value. Note that giving an null element
 * will simply return an empty string.
 * @param {XmlElement} element
 * @param {string} attrName
 * @return {string} found attribute value or empty if non existent
 */
export function getElementAttribute(element, attrName) {
  return (element && element.attributes[attrName]) || '';
}
