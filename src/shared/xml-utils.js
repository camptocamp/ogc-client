import parser from '@rgrove/parse-xml'

export class XmlParseError extends Error {
    constructor(message) {
        super(message);
    }
}

/**
 * @typedef {import('@rgrove/parse-xml').XmlDocument} XmlDocument
 */

/**
 *
 * @param {string} xmlString
 * @return {XmlDocument}
 */
export function parseXmlString(xmlString) {
    let doc = null
    try {
        doc = parser(xmlString);
    } catch (e) {
        throw new XmlParseError(e.message);
    }

    return doc;
}
