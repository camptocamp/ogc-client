/**
 * @typedef {Object} LayerStyle
 * @property {string} name
 * @property {string} title
 * @property {string} [legendUrl] May not be defined; a GetLegendGraphic operation should work in any case
 */
/**
 * @typedef {Object} LayerAttribution
 * @property {string} [title]
 * @property {string} [url]
 * @property {string} [logoUrl]
 */
/**
 * @typedef {Object} WmsLayerSummary
 * @property {string} [name] The layer is renderable if defined
 * @property {string} title
 * @property {string} [abstract]
 * @property {WmsLayerSummary[]} [children] Not defined if the layer is a leaf in the tree
 */
/**
 * @typedef {Object} WmsLayerFull
 * @property {string} [name] The layer is renderable if defined
 * @property {string} title
 * @property {string} [abstract]
 * @property {CrsCode[]} availableCrs
 * @property {LayerStyle[]} styles
 * @property {Object.<CrsCode, BoundingBox>} boundingBoxes Dict of bounding boxes where keys are CRS codes
 * @property {LayerAttribution} [attribution]
 * @property {WmsLayerFull[]} [children] Not defined if the layer is a leaf in the tree
 */
/**
 * @typedef {'1.1.0'|'1.1.1'|'1.3.0'} WmsVersion
 */
/**
 * Represents a WMS endpoint advertising several layers arranged in a tree structure.
 */
export default class WmsEndpoint {
    /**
     * @param {string} url WMS endpoint url; can contain any query parameters, these will be used to
     *   initialize the endpoint
     */
    constructor(url: string);
    /**
     * This fetches the capabilities doc and parses its contents
     * @type {Promise<XmlDocument>}
     * @private
     */
    private _capabilitiesPromise;
    _info: GenericEndpointInfo | null;
    _layers: WmsLayerFull[] | null;
    _version: WmsVersion | null;
    /**
     * @throws {EndpointError}
     * @return {Promise<WmsEndpoint>}
     */
    isReady(): Promise<WmsEndpoint>;
    /**
     * @return {GenericEndpointInfo|null}
     */
    getServiceInfo(): GenericEndpointInfo | null;
    /**
     * Returns an array of layers in summary format; use the `path` property
     * to rebuild the tree structure if needed
     * @return {WmsLayerSummary[]|null}
     */
    getLayers(): WmsLayerSummary[] | null;
    /**
     * Returns a complete layer based on its name
     * Note: the first matching layer will be returned
     * @param {string} name Layer name property (unique in the WMS service)
     * @return {WmsLayerFull|null} return null if layer was not found
     */
    getLayerByName(name: string): WmsLayerFull | null;
    /**
     * @return {WmsVersion|null}
     */
    getVersion(): WmsVersion | null;
}
export type LayerStyle = {
    name: string;
    title: string;
    /**
     * May not be defined; a GetLegendGraphic operation should work in any case
     */
    legendUrl?: string;
};
export type LayerAttribution = {
    title?: string;
    url?: string;
    logoUrl?: string;
};
export type WmsLayerSummary = {
    /**
     * The layer is renderable if defined
     */
    name?: string;
    title: string;
    abstract?: string;
    /**
     * Not defined if the layer is a leaf in the tree
     */
    children?: WmsLayerSummary[];
};
export type WmsLayerFull = {
    /**
     * The layer is renderable if defined
     */
    name?: string;
    title: string;
    abstract?: string;
    availableCrs: CrsCode[];
    styles: LayerStyle[];
    /**
     * Dict of bounding boxes where keys are CRS codes
     */
    boundingBoxes: any;
    attribution?: LayerAttribution;
    /**
     * Not defined if the layer is a leaf in the tree
     */
    children?: WmsLayerFull[];
};
export type WmsVersion = '1.1.0' | '1.1.1' | '1.3.0';
