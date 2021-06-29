import { EndpointError } from '../shared/errors';
import {
  readFeatureTypesFromCapabilities,
  readInfoFromCapabilities,
  readVersionFromCapabilities,
} from './capabilities';
import { queryXmlDocument } from '../shared/http-utils';

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
 * @typedef {'string'|'float'|'integer'|'boolean'} FeaturePropertyType
 */

/**
 * @typedef {'linestring'|'polygon'|'point'|'multilinestring'|'multipolygon'|'multipoint'|'unknown'} FeatureGeometryType
 */

/**
 * @typedef {Object} FeatureTypeInfo
 * @property {string} name
 * @property {string} [title]
 * @property {string} [abstract]
 * @property {BoundingBox} [boundingBox] Expressed in latitudes and longitudes
 * @property {Object.<string,FeaturePropertyType>} properties These properties will *not* include the feature geometry
 * @property {string} [geometryName] Not defined if no geometry present
 * @property {FeatureGeometryType} [geometryType] Not defined if no geometry present
 * @property {number} [objectCount] Not defined if object count could not be determined
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
    this._capabilitiesPromise = queryXmlDocument(
      capabilitiesUrl.toString()
    ).then((xmlDoc) => {
      this._info = readInfoFromCapabilities(xmlDoc);
      this._featureTypes = readFeatureTypesFromCapabilities(xmlDoc);
      this._version = readVersionFromCapabilities(xmlDoc);
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
