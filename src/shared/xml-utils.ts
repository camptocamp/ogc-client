import { parseXml, XmlDocument, XmlElement, XmlText } from '@rgrove/parse-xml';

export class XmlParseError extends Error {
  constructor(message) {
    super(message);
  }
}

/**
 * Parses a XML document as string, return a document object
 */
export function parseXmlString(xmlString: string) {
  let doc: XmlDocument = null;
  try {
    doc = parseXml(xmlString);
  } catch (e) {
    throw new XmlParseError(e.message);
  }
  return doc;
}

/**
 * Will do nothing if no namespace present
 * @param {string} name
 * @return {string}
 */
export function stripNamespace(name) {
  const colon = name.indexOf(':');
  return colon > -1 ? name.substr(colon + 1) : name;
}

export function getRootElement(xmlDoc: XmlDocument) {
  return xmlDoc.children[0] as XmlElement;
}

export function getElementName(element: XmlElement) {
  return element.name || '';
}

/**
 * Will return all matching elements (namespace will be ignored)
 * @param element Element to look into
 * @param name element name
 * @param [nested] if true, will lookup children of children too
 * @return Returns an empty array if no match found
 */
export function findChildrenElement(
  element: XmlElement,
  name: string,
  nested: boolean = false
): XmlElement[] {
  const strippedName = stripNamespace(name);
  function reducer(prev, curr) {
    if (stripNamespace(getElementName(curr)) === strippedName) {
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
 * @param element Element to look into
 * @param name element name
 * @param [nested] if true, will lookup children of children too
 * @return Returns null if no matching element found
 */
export function findChildElement(
  element: XmlElement,
  name: string,
  nested: boolean = false
) {
  return (findChildrenElement(element, name, nested)[0] as XmlElement) || null;
}

/**
 * Will return all children elements
 * @param {XmlElement} element Element to look into
 * @return {XmlElement[]} Returns empty array if no element found
 */
export function getChildrenElement(element: XmlElement) {
  return element && Array.isArray(element.children)
    ? [
        ...(element.children.filter(
          (el) => el instanceof XmlElement
        ) as XmlElement[]),
      ]
    : [];
}

/**
 * Returns the text node in the element. Note that giving an null element
 * will simply return an empty string.
 * @param element
 * @return found text or empty string if no text node found
 */
export function getElementText(element: XmlElement) {
  const textNode =
    element && Array.isArray(element.children)
      ? (element.children.find((node) => node.type === 'text') as XmlText)
      : null;
  return textNode ? textNode.text : '';
}

/**
 * Returns the element's attribute value. Note that giving an null element
 * will simply return an empty string.
 * @param element
 * @param attrName
 * @return found attribute value or empty if non-existent
 */
export function getElementAttribute(element: XmlElement, attrName: string) {
  return (element && element.attributes[attrName]) || '';
}
