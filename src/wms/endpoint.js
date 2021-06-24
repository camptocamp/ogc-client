import {
  readInfoFromCapabilities,
  readLayersFromCapabilities,
  readVersionFromCapabilities,
} from './capabilities';
import { EndpointError } from '../shared/errors';
import { queryXmlDocument } from '../shared/http-utils';

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
 * @typedef {Object} WmsInfo
 * @property {string} name
 * @property {string} title
 * @property {string} abstract
 * @property {string} fees
 * @property {string} constraints
 */

/**
 * Represents a WMS endpoint advertising several layers arranged in a tree structure.
 */
export default class WmsEndpoint {
  /**
   * @param {string} url WMS endpoint url; can contain any query parameters, these will be used to
   *   initialize the endpoint
   */
  constructor(url) {
    const capabilitiesUrl = new URL(url);
    capabilitiesUrl.searchParams.delete('service');
    capabilitiesUrl.searchParams.set('SERVICE', 'WMS');
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
      this._layers = readLayersFromCapabilities(xmlDoc);
      this._version = readVersionFromCapabilities(xmlDoc);
    });

    /**
     * @type {WmsInfo|null}
     * @private
     */
    this._info = null;

    /**
     * @type {WmsLayerFull[]|null}
     * @private
     */
    this._layers = null;

    /**
     * @type {WmsVersion|null}
     * @private
     */
    this._version = null;
  }

  /**
   * @throws {EndpointError}
   * @return {Promise<WmsEndpoint>}
   */
  isReady() {
    return this._capabilitiesPromise.then(() => this);
  }

  /**
   * @return {WmsInfo|null}
   */
  getServiceInfo() {
    return this._info;
  }

  /**
   * Returns an array of layers in summary format; use the `path` property
   * to rebuild the tree structure if needed
   * @return {WmsLayerSummary[]|null}
   */
  getLayers() {
    function layerSummaryMapper(layerFull) {
      return {
        title: layerFull.title,
        name: layerFull.name,
        abstract: layerFull.abstract,
        ...('children' in layerFull && {
          children: layerFull.children.map(layerSummaryMapper),
        }),
      };
    }
    return this._layers.map(layerSummaryMapper);
  }

  /**
   * Returns a complete layer based on its name
   * Note: the first matching layer will be returned
   * @param {string} name Layer name property (unique in the WMS service)
   * @return {WmsLayerFull|null} return null if layer was not found
   */
  getLayerByName(name) {
    let result = null;
    function layerLookup(layer) {
      if (result !== null) return;
      if (layer.name === name) {
        result = layer;
        return;
      }
      if ('children' in layer) {
        layer.children.map(layerLookup);
      }
    }
    this._layers.map(layerLookup);
    return result;
  }

  /**
   * @return {WmsVersion|null}
   */
  getVersion() {
    return this._version;
  }
}
