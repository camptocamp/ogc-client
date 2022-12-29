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
    constructor(url: string);
    /**
     * @type {string}
     * @private
     */
    private _capabilitiesUrl;
    /**
     * This fetches the capabilities doc and parses its contents
     * @type {Promise<XmlDocument>}
     * @private
     */
    private _capabilitiesPromise;
    _info: GenericEndpointInfo | null;
    _featureTypes: WfsFeatureTypeInternal[] | null;
    _version: WfsVersion | null;
    /**
     * @throws {EndpointError}
     * @return {Promise<WfsEndpoint>}
     */
    isReady(): Promise<WfsEndpoint>;
    /**
     * @return {GenericEndpointInfo|null}
     */
    getServiceInfo(): GenericEndpointInfo | null;
    /**
     * Returns an array of feature types
     * @return {WfsFeatureTypeBrief[]|null}
     */
    getFeatureTypes(): WfsFeatureTypeBrief[] | null;
    /**
     * @param {string} name
     * @returns {WfsFeatureTypeInternal || null}
     */
    _getFeatureTypeByName(name: string): WfsFeatureTypeInternal;
    /**
     * Returns a summary of a feature type, i.e. only information available in the capabilities document
     * @param {string} name Feature type name property (unique in the WFS service)
     * @return {WfsFeatureTypeSummary|null} return null if layer was not found or endpoint is not ready
     */
    getFeatureTypeSummary(name: string): WfsFeatureTypeSummary | null;
    /**
     * Returns a complete feature type by its name; if no namespace specified in the name, will match the
     * first feature type matching the unqualified name.
     * @param {string} name Feature type name property (unique in the WFS service)
     * @return {Promise<WfsFeatureTypeFull>|null} return null if layer was not found or endpoint is not ready
     */
    getFeatureTypeFull(name: string): Promise<WfsFeatureTypeFull> | null;
    /**
     * Returns details regarding properties of a given feature type
     * @param {string} name Feature type name property (unique in the WFS service)
     * @return {Promise<WfsFeatureTypePropsDetails>|null} return null if layer was not found or endpoint is not ready
     */
    getFeatureTypePropDetails(name: string): Promise<WfsFeatureTypePropsDetails> | null;
    /**
     * @return {WfsVersion|null}
     */
    getVersion(): WfsVersion | null;
    /**
     * @param {string} featureType
     * @return {string|null}
     * @private
     */
    private _getJsonCompatibleOutputFormat;
    /**
     * Returns true if the given feature type can be downloaded as GeoJSON
     * @return {boolean|null}
     */
    supportsJson(featureType: any): boolean | null;
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
    getFeatureUrl(featureType: string, options?: any): string | null;
}
export type WfsVersion = '1.0.0' | '1.1.0' | '2.0.0';
export type WfsFeatureTypeInternal = {
    name: string;
    title?: string;
    abstract?: string;
    defaultCrs: CrsCode;
    otherCrs: CrsCode[];
    outputFormats: MimeType[];
    latLonBoundingBox?: BoundingBox;
};
export type FeaturePropertyType = 'string' | 'float' | 'integer' | 'boolean';
export type FeatureGeometryType = 'linestring' | 'polygon' | 'point' | 'multilinestring' | 'multipolygon' | 'multipoint' | 'unknown';
export type WfsFeatureTypeBrief = {
    name: string;
    title?: string;
    abstract?: string;
    /**
     * Expressed in latitudes and longitudes
     */
    boundingBox?: BoundingBox;
};
export type WfsFeatureTypeSummary = {
    name: string;
    title?: string;
    abstract?: string;
    /**
     * Expressed in latitudes and longitudes
     */
    boundingBox?: BoundingBox;
    defaultCrs: CrsCode;
    otherCrs: CrsCode[];
    outputFormats: MimeType[];
};
export type WfsFeatureTypeFull = {
    name: string;
    title?: string;
    abstract?: string;
    /**
     * Expressed in latitudes and longitudes
     */
    boundingBox?: BoundingBox;
    defaultCrs: CrsCode;
    otherCrs: CrsCode[];
    outputFormats: MimeType[];
    /**
     * These properties will *not* include the feature geometry
     */
    properties: {
        [x: string]: FeaturePropertyType;
    };
    /**
     * Not defined if no geometry present
     */
    geometryName?: string;
    /**
     * Not defined if no geometry present
     */
    geometryType?: FeatureGeometryType;
    /**
     * Not defined if object count could not be determined
     */
    objectCount?: number;
};
export type WfsFeatureWithProps = {
    /**
     * Feature id
     */
    id: string;
    /**
     * Feature properties
     */
    properties: {
        [x: string]: FeaturePropertyType;
    };
};
export type WfsFeatureTypeUniqueValue = {
    value: number | boolean | string;
    count: number;
};
export type WfsFeatureTypePropDetails = {
    uniqueValues: WfsFeatureTypeUniqueValue[];
};
export type WfsFeatureTypePropsDetails = {
    [x: string]: WfsFeatureTypePropDetails;
};
