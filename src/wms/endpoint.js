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
 * @typedef {Object} WmsLayer
 * @property {string} name
 * @property {string} title
 * @property {string} abstract
 * @property {CrsCode[]} availableCrs
 * @property {LayerStyle[]} styles
 * @property {Object.<CrsCode, BoundingBox>} boundingBoxes Dict of bounding boxes where keys are CRS codes
 * @property {string[]} path If the layer is nested in other layers, the path will contain the name of previous layers
 *   in order from the topmost parent (root layer) to the closest one.
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
 *
 */
export default class WmsEndpoint {
  /**
   * @param {string} url WMS endpoint url; can contain any query parameters, these will be used to
   *   initialize the endpoint
   */
  constructor(url) {
    /**
     * @type {WmsLayer[]}
     * @private
     */
    this._layers = [];

    /**
     * @type {WmsVersion|null}
     * @private
     */
    this._version = null;

    /**
     * @type {WmsLayer|null}
     * @private
     */
    this._selectedLayer = null;
  }


}
