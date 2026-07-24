import {
  parseXml,
  XmlCdata,
  XmlComment,
  XmlDeclaration,
  XmlDocument,
  XmlDocumentType,
  XmlElement,
  XmlProcessingInstruction,
  XmlText,
} from '@rgrove/parse-xml';

export class XmlParseError extends Error {
  constructor(message) {
    super(message);
  }
}

/**
 * Parses an XML document as string, return a document object
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

export function createElement(
  name: string,
  attrs: Record<string, string>,
  children: XmlElement | XmlElement[] = []
): XmlElement {
  return new XmlElement(
    name,
    attrs,
    Array.isArray(children) ? children : [children]
  );
}

export function createTextElement(
  name: string,
  attrs: Record<string, string>,
  text: string
): XmlElement {
  return new XmlElement(name, attrs, [new XmlText(text)]);
}

export function createCdataElement(
  name: string,
  attrs: Record<string, string>,
  content: string
): XmlElement {
  return new XmlElement(name, attrs, [new XmlCdata(content)]);
}

export function createDocument(rootEl: XmlElement): XmlDocument {
  return new XmlDocument([rootEl]);
}

export function xmlToString(
  el:
    | XmlDocument
    | XmlElement
    | XmlComment
    | XmlProcessingInstruction
    | XmlDeclaration
    | XmlDocumentType
    | XmlCdata
    | XmlText,
  indentationLevel = 0
) {
  const encodeEntities = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  if (el instanceof XmlDocument)
    return `<?xml version="1.0" encoding="UTF-8"?>${xmlToString(
      el.children[0]
    )}`;
  if (el instanceof XmlCdata) {
    const encoded = el.text.replace(/]]>/g, ']]]]><![CDATA[>');
    return `<![CDATA[${encoded}]]>`;
  }
  if (el instanceof XmlText) {
    const text = el.text;
    const isEmpty = !text || text.replace(/^\s+|\s+$/g, '') === '';
    if (isEmpty) return '';
    return encodeEntities(text);
  }
  if (!(el instanceof XmlElement)) return `<!-- unknown -->`;

  const padding = '    '.repeat(indentationLevel);
  const children = Array.isArray(el.children)
    ? el.children
        .map((el) => xmlToString(el, indentationLevel + 1))
        .filter((el) => el !== '')
        .map((elString, index, array) =>
          index < array.length - 1 ? elString.replace(/\n\s*$/g, '') : elString
        )
        .join('')
    : '';
  const attrs = Object.keys(el.attributes).reduce(
    (prev, curr) => prev + ` ${curr}="${encodeEntities(el.attributes[curr])}"`,
    ''
  );
  const parentPadding = '    '.repeat(Math.max(0, indentationLevel - 1));
  if (children === '') {
    return `
${padding}<${el.name}${attrs}/>
${parentPadding}`;
  }

  return `
${padding}<${el.name}${attrs}>${children}</${el.name}>
${parentPadding}`;
}
