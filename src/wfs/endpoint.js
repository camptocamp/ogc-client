import { EndpointError } from '../shared/errors';
import { parseWfsCapabilities, queryWfsFeatureTypeDetails } from '../worker';
import { queryXmlDocument } from '../shared/http-utils';
import { parseFeatureTypeInfo } from './featuretypeinfo';
import { useCache } from '../shared/cache';
import { generateDescribeFeatureTypeUrl, generateGetFeatureUrl } from './url';

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
 * @typedef {Object} WfsFeatureWithProps
 * @property {string} id Feature id
 * @property {Object.<string, FeaturePropertyType>} properties Feature properties
 */

/**
 * @typedef {Object} WfsFeatureTypeUniqueValue
 * @property {number|boolean|string} value
 * @property {number} count
 */

/**
 * @typedef {Object} WfsFeatureTypePropDetails
 * @property {WfsFeatureTypeUniqueValue[]} uniqueValues
 */

/**
 * @typedef {Object.<string, WfsFeatureTypePropDetails>} WfsFeatureTypePropsDetails
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
    this._capabilitiesPromise = useCache(
      () => parseWfsCapabilities(this._capabilitiesUrl),
      'WFS',
      'CAPABILITIES',
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
  getFeatureTypeInformation(name) {
    if (!this._featureTypes) return null;
    const featureType = this._featureTypes.find(
      (featureType) => featureType.name === name
    );
    if (!featureType) return null;

    return useCache(
      () => {
        const describeUrl = generateDescribeFeatureTypeUrl(
          this._capabilitiesUrl,
          this._version,
          name
        );
        const getFeatureUrl = generateGetFeatureUrl(
          this._capabilitiesUrl,
          this._version,
          name,
          undefined,
          undefined,
          true
        );

        return Promise.all([
          queryXmlDocument(describeUrl),
          queryXmlDocument(getFeatureUrl),
        ]).then(([describeResponse, getFeatureResponse]) =>
          parseFeatureTypeInfo(
            featureType,
            describeResponse,
            getFeatureResponse,
            this._version
          )
        );
      },
      'WFS',
      'FEATURETYPEINFO',
      this._capabilitiesUrl,
      name
    );
  }

  /**
   * Returns details regarding properties of a given feature type
   * @param {string} name Feature type name property (unique in the WFS service)
   * @return {Promise<WfsFeatureTypePropsDetails>|null} return null if layer was not found or endpoint is not ready
   */
  async getFeatureTypePropDetails(name) {
    const featureTypeFull = await this.getFeatureTypeInformation(name);
    if (featureTypeFull === null) return null;

    return useCache(
      () =>
        queryWfsFeatureTypeDetails(
          this._capabilitiesUrl,
          this._version,
          featureTypeFull
        ),
      'WFS',
      'FEATURETYPEPROPDETAILS',
      this._capabilitiesUrl,
      name
    );
  }

  /**
   * @return {WfsVersion|null}
   */
  getVersion() {
    return this._version;
  }
}
