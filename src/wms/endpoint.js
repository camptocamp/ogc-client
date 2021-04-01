/**
 * @typedef {Object} WmsLayer
 * @property {string} name
 * @property {string} title
 * @property {string[]} path
 */

/**
 * @typedef {'1.1.0'|'1.1.1'|'1.3.0'} WmsVersion
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
