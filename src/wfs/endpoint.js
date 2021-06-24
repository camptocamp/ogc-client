import { EndpointError } from '../shared/errors';
import { parseXmlString } from '../shared/xml-utils';
import {
  readFeatureTypesFromCapabilities,
  readInfoFromCapabilities,
  readVersionFromCapabilities,
} from './capabilities';

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
   * @param {string} url WFS endpoint url; can contain any query parameters, these will be used to
   *   initialize the endpoint
   */
  constructor(url) {
    const capabilitiesUrl = new URL(url);
    capabilitiesUrl.searchParams.delete('service');
    capabilitiesUrl.searchParams.set('SERVICE', 'WFS');
    capabilitiesUrl.searchParams.delete('request');
    capabilitiesUrl.searchParams.set('REQUEST', 'GetCapabilities');

    /**
     * This fetches the capabilities doc and parses its contents
     * @type {Promise<XmlDocument>}
     * @private
     */
    this._capabilitiesPromise = fetch(capabilitiesUrl.toString())
      .then(async (resp) => {
        const text = await resp.text();
        if (!resp.ok) {
          throw new EndpointError(
            `Received an error with code ${resp.status}: ${text}`,
            resp.status
          );
        }
        return text;
      })
      .then((xml) => parseXmlString(xml))
      .then((xmlDoc) => {
        this._info = readInfoFromCapabilities(xmlDoc);
        this._featureTypes = readFeatureTypesFromCapabilities(xmlDoc);
        this._version = readVersionFromCapabilities(xmlDoc);
      })
      .catch((error) => {
        throw new EndpointError(error.message, 0, true);
      });

    /**
     * @type {WfsInfo|null}
     * @private
     */
    this._info = null;

    /**
     * @type {WfsFeatureType[]|null}
     * @private
     */
    this._featureTypes = null;

    /**
     * @type {WfsVersion|null}
     * @private
     */
    this._version = null;
  }

  /**
   * @throws {EndpointError}
   * @return {Promise<WfsEndpoint>}
   */
  isReady() {
    return this._capabilitiesPromise.then(() => this);
  }

  /**
   * @return {WfsInfo|null}
   */
  getServiceInfo() {
    return this._info;
  }

  /**
   * Returns an array of feature types
   * @return {WfsFeatureType[]|null}
   */
  getFeatureTypes() {
    return this._featureTypes;
  }

  /**
   * Returns a complete feature type by its name
   * @param {string} name Feature type name property (unique in the WFS service)
   * @return {WfsFeatureType|null} return null if layer was not found
   */
  getFeatureTypeByName(name) {
    return (
      this._featureTypes &&
      this._featureTypes.find((featureType) => featureType.name === name)
    );
  }

  /**
   * @return {WfsVersion|null}
   */
  getVersion() {
    return this._version;
  }
}
