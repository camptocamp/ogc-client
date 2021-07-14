import { EndpointError } from '../shared/errors';
import { parseWfsCapabilities } from '../worker';
import { queryXmlDocument } from '../shared/http-utils';
import { parseFeatureTypeInfo } from './featuretypeinfo';

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
 * @typedef {Object} WfsFeatureTypeInternal
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
 * @typedef {Object} WfsFeatureTypeSummary
 * @property {string} name
 * @property {string} [title]
 * @property {string} [abstract]
 * @property {BoundingBox} [boundingBox] Expressed in latitudes and longitudes
 */

/**
 * @typedef {Object} WfsFeatureTypeFull
 * @property {string} name
 * @property {string} [title]
 * @property {string} [abstract]
 * @property {BoundingBox} [boundingBox] Expressed in latitudes and longitudes
 * @property {CrsCode} defaultCrs
 * @property {CrsCode[]} otherCrs
 * @property {MimeType[]} outputFormats
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
     * @type {string}
     * @private
     */
    this._capabilitiesUrl = capabilitiesUrl.toString();

    /**
     * This fetches the capabilities doc and parses its contents
     * @type {Promise<XmlDocument>}
     * @private
     */
    this._capabilitiesPromise = parseWfsCapabilities(
      this._capabilitiesUrl
    ).then(({ info, featureTypes, version }) => {
      this._info = info;
      this._featureTypes = featureTypes;
      this._version = version;
    });

    /**
     * @type {WfsInfo|null}
     * @private
     */
    this._info = null;

    /**
     * @type {WfsFeatureTypeInternal[]|null}
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
   * @return {WfsFeatureTypeSummary[]|null}
   */
  getFeatureTypes() {
    return this._featureTypes.map((featureType) => ({
      name: featureType.name,
      ...('title' in featureType && { title: featureType.title }),
      ...('abstract' in featureType && { abstract: featureType.abstract }),
      ...('latLonBoundingBox' in featureType && {
        boundingBox: featureType.latLonBoundingBox,
      }),
    }));
  }

  /**
   * Returns a complete feature type by its name
   * @param {string} name Feature type name property (unique in the WFS service)
   * @return {Promise<WfsFeatureTypeFull>|null} return null if layer was not found or endpoint is not ready
   */
  getFeatureTypeByName(name) {
    if (!this._featureTypes) return null;
    const featureType = this._featureTypes.find(
      (featureType) => featureType.name === name
    );
    if (!featureType) return null;

    const typeParam = this._version === '2.0.0' ? 'TYPENAMES' : 'TYPENAME';
    const countParam = this._version === '2.0.0' ? 'COUNT' : 'maxFeatures';

    const describeUrl = new URL(this._capabilitiesUrl);
    describeUrl.searchParams.set('REQUEST', 'DescribeFeatureType');
    describeUrl.searchParams.set('VERSION', this._version);
    describeUrl.searchParams.set(typeParam, name);
    const getFeatureUrl = new URL(this._capabilitiesUrl);
    getFeatureUrl.searchParams.set('REQUEST', 'GetFeature');
    getFeatureUrl.searchParams.set('VERSION', this._version);
    getFeatureUrl.searchParams.set(typeParam, name);
    getFeatureUrl.searchParams.set(countParam, '1');

    return Promise.all([
      queryXmlDocument(describeUrl.toString()),
      queryXmlDocument(getFeatureUrl.toString()),
    ]).then(([describeResponse, getFeatureResponse]) =>
      parseFeatureTypeInfo(
        featureType,
        describeResponse,
        getFeatureResponse,
        this._version
      )
    );
  }

  /**
   * @return {WfsVersion|null}
   */
  getVersion() {
    return this._version;
  }
}
