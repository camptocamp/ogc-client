import {
  parseWfsCapabilities,
  queryWfsFeatureTypeDetails,
} from '../worker/index.js';
import { queryXmlDocument, setQueryParams } from '../shared/http-utils.js';
import { parseFeatureTypeInfo } from './featuretypeinfo.js';
import { useCache } from '../shared/cache.js';
import {
  generateDescribeFeatureTypeUrl,
  generateGetFeatureUrl,
} from './url.js';
import { stripNamespace } from '../shared/xml-utils.js';
import {
  GenericEndpointInfo,
  type HttpMethod,
  type OperationName,
  type OperationUrl,
} from '../shared/models.js';
import {
  WfsFeatureTypeBrief,
  WfsFeatureTypeInternal,
  WfsFeatureTypeSummary,
  WfsGetFeatureOptions,
  WfsVersion,
} from './model.js';
import { isMimeTypeJson } from '../shared/mime-type.js';

/**
 * Represents a WFS endpoint advertising several feature types
 */
export default class WfsEndpoint {
  private _capabilitiesUrl: string;
  private _capabilitiesPromise: Promise<void>;
  private _info: GenericEndpointInfo | null;
  private _featureTypes: WfsFeatureTypeInternal[] | null;
  private _url: Record<OperationName, OperationUrl>;
  private _version: WfsVersion | null;

  /**
   * Creates a new WFS endpoint; wait for the `isReady()` promise before using the endpoint methods.
   * @param url WFS endpoint url; can contain any query parameters, these will be used to
   *   initialize the endpoint
   */
  constructor(url: string) {
    this._capabilitiesUrl = setQueryParams(url, {
      SERVICE: 'WFS',
      REQUEST: 'GetCapabilities',
    });

    /**
     * This fetches the capabilities doc and parses its contents
     */
    this._capabilitiesPromise = useCache(
      () => parseWfsCapabilities(this._capabilitiesUrl),
      'WFS',
      'CAPABILITIES',
      this._capabilitiesUrl
    ).then(({ info, featureTypes, url, version }) => {
      this._info = info;
      this._featureTypes = featureTypes;
      this._url = url;
      this._version = version;
    });
  }

  /**
   * Resolves when the endpoint is ready to use. Returns the same endpoint object for convenience.
   * @throws {EndpointError}
   */
  isReady() {
    return this._capabilitiesPromise.then(() => this);
  }

  /**
   * A Promise which resolves to the endpoint information.
   */
  getServiceInfo() {
    return this._info;
  }

  /**
   * Returns an array of feature types
   */
  getFeatureTypes() {
    return this._featureTypes.map(
      (featureType) =>
        ({
          name: featureType.name,
          ...('title' in featureType && { title: featureType.title }),
          ...('abstract' in featureType && { abstract: featureType.abstract }),
          ...('latLonBoundingBox' in featureType && {
            boundingBox: featureType.latLonBoundingBox,
          }),
        } as WfsFeatureTypeBrief)
    );
  }

  private _getFeatureTypeByName(name: string) {
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
   * Returns the feature type in summary format. If a namespace is specified in the name,
   * this will be used for matching; otherwise, matching will be done without taking namespaces into account.
   * @param name Feature type name property (unique in the WFS service)
   * @return return null if layer was not found or endpoint is not ready
   */
  getFeatureTypeSummary(name: string) {
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
      keywords: featureType.keywords,
    } as WfsFeatureTypeSummary;
  }

  /**
   * Returns the complete feature type. If a namespace is specified in the name,
   * this will be used for matching; otherwise, matching will be done without taking namespaces into account.
   * @param name Feature type name property (unique in the WFS service)
   * @return {Promise<WfsFeatureTypeFull>|null} return null if layer was not found or endpoint is not ready
   */
  getFeatureTypeFull(name: string) {
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
   * If only one single feature type is available, return its name; otherwise, returns null;
   */
  getSingleFeatureTypeName(): string | null {
    if (!this._featureTypes) return null;
    if (this._featureTypes.length === 1) return this._featureTypes[0].name;
    return null;
  }

  /**
   * Returns a promise that will resolve with details on each of the feature type properties;
   * for now, this consists of a list of unique values in the whole dataset.
   * @param name Feature type name property (unique in the WFS service)
   * @return return null if layer was not found or endpoint is not ready
   */
  async getFeatureTypePropDetails(name: string) {
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
   * Returns the highest protocol version that this WFS endpoint supports.
   * Note that if the url used for initialization does specify a version (e.g. 1.0.0),
   * this version will most likely be used instead of the highest supported one.
   */
  getVersion() {
    return this._version;
  }

  private _getJsonCompatibleOutputFormat(featureType: string) {
    const featureTypeInfo = this._getFeatureTypeByName(featureType);
    if (!featureTypeInfo) {
      throw new Error(
        `The following feature type was not found in the service: ${featureType}`
      );
    }
    const candidates = featureTypeInfo.outputFormats.filter(isMimeTypeJson);
    if (!candidates.length) return null;
    return candidates[0];
  }

  /**
   * Returns true if the given feature type can be downloaded as GeoJSON
   */
  supportsJson(featureType: string) {
    if (!this._featureTypes) return null;
    return !!this._getJsonCompatibleOutputFormat(featureType);
  }

  /**
   * Returns true if the WFS service supports the startIndex parameter.
   */
  supportsStartIndex(): boolean {
    if (!this._version) return false;
    return this._version >= '2.0.0';
  }

  /**
   * Returns a URL that can be used to query features from this feature type.
   * @param featureType
   * @param options
   * @returns Returns null if endpoint is not ready
   */
  getFeatureUrl(featureType: string, options?: WfsGetFeatureOptions) {
    if (!this._featureTypes) {
      return null;
    }
    const {
      maxFeatures,
      asJson,
      outputFormat,
      outputCrs,
      extent,
      extentCrs,
      startIndex,
      attributes,
      hitsOnly,
    } = options || {};
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
      // do not prevent using this output format, because it still might work! but give a warning at least
      console.warn(
        `[ogc-client] The following output format type was not found in the feature type ${internalFeatureType.name}: ${outputFormat}`
      );
    }
    return generateGetFeatureUrl(
      this._capabilitiesUrl,
      this._version,
      internalFeatureType.name,
      format,
      maxFeatures,
      attributes,
      hitsOnly,
      outputCrs,
      extent,
      extentCrs,
      startIndex
    );
  }

  /**
   * Returns the Capabilities URL of the WMS
   *
   * This is the URL reported by the service if available, otherwise the URL
   * passed to the constructor
   */
  getCapabilitiesUrl() {
    const baseUrl = this.getOperationUrl('GetCapabilities');
    if (!baseUrl) {
      return this._capabilitiesUrl;
    }
    return setQueryParams(baseUrl, {
      SERVICE: 'WMS',
      REQUEST: 'GetCapabilities',
    });
  }

  /**
   * Returns the URL reported by the WFS for the given operation
   * @param operationName e.g. GetFeature, GetCapabilities, etc.
   * @param method HTTP method
   */
  getOperationUrl(operationName: OperationName, method: HttpMethod = 'Get') {
    if (!this._url) {
      return null;
    }
    return this._url[operationName]?.[method];
  }
}
