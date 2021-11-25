import { EndpointError } from '../shared/errors';
import { parseWfsCapabilities, queryWfsFeatureTypeDetails } from '../worker';
import { queryXmlDocument, setQueryParams } from '../shared/http-utils';
import { parseFeatureTypeInfo } from './featuretypeinfo';
import { useCache } from '../shared/cache';
import { generateDescribeFeatureTypeUrl, generateGetFeatureUrl } from './url';
import { stripNamespace } from '../shared/xml-utils';

/**
 * @typedef {'1.0.0'|'1.1.0'|'2.0.0'} WfsVersion
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
 * @typedef {Object} WfsFeatureTypeBrief
 * @property {string} name
 * @property {string} [title]
 * @property {string} [abstract]
 * @property {BoundingBox} [boundingBox] Expressed in latitudes and longitudes
 */

/**
 * @typedef {Object} WfsFeatureTypeSummary
 * @property {string} name
 * @property {string} [title]
 * @property {string} [abstract]
 * @property {BoundingBox} [boundingBox] Expressed in latitudes and longitudes
 * @property {CrsCode} defaultCrs
 * @property {CrsCode[]} otherCrs
 * @property {MimeType[]} outputFormats
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
    /**
     * @type {string}
     * @private
     */
    this._capabilitiesUrl = setQueryParams(url, {
      SERVICE: 'WFS',
      REQUEST: 'GetCapabilities',
    });

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
     * @type {GenericEndpointInfo|null}
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
   * @return {GenericEndpointInfo|null}
   */
  getServiceInfo() {
    return this._info;
  }

  /**
   * Returns an array of feature types
   * @return {WfsFeatureTypeBrief[]|null}
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
   * @param {string} name
   * @returns {WfsFeatureTypeInternal || null}
   */
  _getFeatureTypeByName(name) {
    if (!this._featureTypes) return null;
    const isQualified = stripNamespace(name) !== name;
    return (
      this._featureTypes.find((featureType) =>
        isQualified
          ? featureType.name === name
          : stripNamespace(featureType.name) === name
      ) || null
    );
  }

  /**
   * Returns a summary of a feature type, i.e. only information available in the capabilities document
   * @param {string} name Feature type name property (unique in the WFS service)
   * @return {WfsFeatureTypeSummary|null} return null if layer was not found or endpoint is not ready
   */
  getFeatureTypeSummary(name) {
    const featureType = this._getFeatureTypeByName(name);
    if (!featureType) return null;

    return {
      name: featureType.name,
      ...('title' in featureType && { title: featureType.title }),
      ...('abstract' in featureType && { abstract: featureType.abstract }),
      ...('latLonBoundingBox' in featureType && {
        boundingBox: featureType.latLonBoundingBox,
      }),
      defaultCrs: featureType.defaultCrs,
      otherCrs: featureType.otherCrs,
      outputFormats: featureType.outputFormats,
    };
  }

  /**
   * Returns a complete feature type by its name; if no namespace specified in the name, will match the
   * first feature type matching the unqualified name.
   * @param {string} name Feature type name property (unique in the WFS service)
   * @return {Promise<WfsFeatureTypeFull>|null} return null if layer was not found or endpoint is not ready
   */
  getFeatureTypeFull(name) {
    const featureType = this._getFeatureTypeByName(name);
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
    const featureTypeFull = await this.getFeatureTypeFull(name);
    if (featureTypeFull === null) return null;

    return useCache(
      () =>
        queryWfsFeatureTypeDetails(
          this._capabilitiesUrl,
          this._version,
          featureTypeFull
        ).then((result) => result.props),
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

  /**
   * @param {string} featureType
   * @return {string|null}
   * @private
   */
  _getJsonCompatibleOutputFormat(featureType) {
    const featureTypeInfo = this._getFeatureTypeByName(featureType);
    if (!featureTypeInfo) {
      throw new Error(
        `The following feature type was not found in the service: ${featureType}`
      );
    }
    const candidates = featureTypeInfo.outputFormats.filter(
      (f) => f.toLowerCase().indexOf('json') > -1
    );
    if (!candidates.length) return null;
    return candidates[0];
  }

  /**
   * Returns true if the given feature type can be downloaded as GeoJSON
   * @return {boolean|null}
   */
  supportsJson(featureType) {
    if (!this._featureTypes) return null;
    return !!this._getJsonCompatibleOutputFormat(featureType);
  }

  /**
   * Will build a GetFeature url based on the given parameters
   * @param {string} featureType
   * @param {Object} [options]
   * @property {number} [options.maxFeatures] no limit if undefined
   * @property {boolean} [options.asJson] if true, will ask for GeoJSON; will throw if the service does not support it
   * @property {MimeType} [options.outputFormat] a supported output format (overridden by `asJson`)
   * @property {CrsCode} [options.outputCrs] if unspecified, this will be the data native projection
   * @property {BoundingBox} [options.extent] an extent to restrict returned objects
   * @property {CrsCode} [options.extentCrs] if unspecified, `extent` should be in the data native projection
   * @returns {string|null} Returns null if endpoint is not ready
   */
  getFeatureUrl(featureType, options) {
    if (!this._featureTypes) {
      return null;
    }
    const { maxFeatures, asJson, outputFormat, outputCrs, extent, extentCrs } =
      options || {};
    const internalFeatureType = this._getFeatureTypeByName(featureType);
    if (!internalFeatureType) {
      throw new Error(
        `The following feature type was not found in the service: ${featureType}`
      );
    }
    let format = outputFormat;
    if (asJson) {
      format = this._getJsonCompatibleOutputFormat(featureType) || undefined;
      if (!format) {
        throw new Error(
          `The endpoint does not appear to support GeoJSON for the feature type ${internalFeatureType.name}`
        );
      }
    } else if (
      outputFormat &&
      internalFeatureType.outputFormats.indexOf(outputFormat) === -1
    ) {
      throw new Error(
        `The following output format type was not found in the feature type ${internalFeatureType.name}: ${outputFormat}`
      );
    }
    return generateGetFeatureUrl(
      this._capabilitiesUrl,
      this._version,
      internalFeatureType.name,
      format,
      maxFeatures,
      undefined,
      undefined,
      outputCrs,
      extent,
      extentCrs
    );
  }
}
