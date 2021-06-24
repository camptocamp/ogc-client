/**
 * @typedef {Object} WfsFeatureType
 * @property {string} [name] The layer is renderable if defined
 */

/**
 * @typedef {'1.0.0'|'1.1.0'|'2.0.0'} WfsVersion
 */

/**
 * @typedef {Object} WfsInfo
 * @property {string} name
 * @property {string} title
 * @property {string} abstract
 * @property {string} fees
 * @property {string} constraints
 */

/**
 * @typedef {Object} WfsFeatureType
 * @property {string} name
 * @property {string} [title]
 * @property {string} [abstract]
 * @property {CrsCode} defaultCrs
 * @property {CrsCode[]} otherCrs
 * @property {MimeType[]} outputFormats
 * @property {BoundingBox} [latLonBoundingBox]
 */

/**
 * Represents a WFS endpoint advertising several feature types
 */
export default class WfsEndpoint {
  /**
   * @param {string} url WfS endpoint url; can contain any query parameters, these will be used to
   *   initialize the endpoint
   */
  constructor(url) {
    const capabilitiesUrl = new URL(url);
    capabilitiesUrl.searchParams.delete('service');
    capabilitiesUrl.searchParams.set('SERVICE', 'WFS');
    capabilitiesUrl.searchParams.delete('request');
    capabilitiesUrl.searchParams.set('REQUEST', 'GetCapabilities');
  }
}
