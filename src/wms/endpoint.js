/**
 * @typedef {[number, number, number, number]} BoundingBox
 *  Expressed as minx, miny, maxx, maxy
 */

/**
 * @typedef {string} CrsCode
 */

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
 * @property {string} name
 * @property {string} title
 * @property {string} abstract
 * @property {string[]} path If the layer is nested in other layers, the path will contain the name of previous layers
 *   in order from the topmost parent (root layer) to the closest one.
 */

/**
 * @typedef {Object} WmsLayer
 * @property {string} name
 * @property {string} title
 * @property {string} abstract
 * @property {string[]} path
 * @property {CrsCode[]} availableCrs
 * @property {LayerStyle[]} styles
 * @property {Object.<CrsCode, BoundingBox>} boundingBoxes Dict of bounding boxes where keys are CRS codes
 * @property {LayerAttribution} [attribution]
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
 * @typedef {Object} EndpointError
 * @property {string} message
 * @property {boolean} isCrossOriginRelated
 * @property {number} [httpStatus]
 */

import { parseXmlString } from '../shared/xml-utils';
import {
  readInfoFromCapabilities,
  readLayersFromCapabilities,
  readVersionFromCapabilities,
} from './capabilities';

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
    this._capabilitiesPromise = fetch(capabilitiesUrl.toString())
      .then(async (resp) => {
        const text = await resp.text();
        if (!resp.ok) {
          throw new Error(
            `Received an error with code ${resp.status}: ${text}`
          );
        }
        return text;
      })
      .then((xml) => parseXmlString(xml))
      .then((xmlDoc) => {
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
     * @type {WmsLayer[]|null}
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
    return this._layers.map((layer) => ({
      title: layer.title,
      name: layer.name,
      abstract: layer.abstract,
      path: layer.path,
    }));
  }

  /**
   * Returns a complete layer based on its name
   * @param {string} name Layer name property (unique in the WMS service)
   * @return {WmsLayer|null} return null if layer was not found
   */
  getLayerByName(name) {
    return this._layers.find((layer) => layer.name === name) || null;
  }

  /**
   * @return {WmsVersion|null}
   */
  getVersion() {
    return this._version;
  }
}
