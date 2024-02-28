import { WmtsRequestEncoding } from './model.js';
import { MimeType } from '../shared/models.js';
import { setQueryParams } from '../shared/http-utils.js';

export function generateGetTileUrl(
  baseUrl: string,
  requestEncoding: WmtsRequestEncoding,
  layerName: string,
  styleName: string,
  matrixSetName: string,
  tileMatrix: string,
  tileRow: number,
  tileCol: number,
  outputFormat: MimeType
): string {
  const context = {
    layer: layerName,
    style: styleName,
    tilematrixset: matrixSetName,
    Service: 'WMTS',
    Request: 'GetTile',
    Format: outputFormat,
    TileMatrix: tileMatrix,
    TileCol: tileCol.toString(),
    TileRow: tileRow.toString(),
  };
  if (requestEncoding === 'REST') {
    let url = baseUrl;
    for (const key in context) {
      url = url.replace(new RegExp(`{${key}}`, 'ig'), context[key]);
    }
    return url;
  } else {
    return setQueryParams(baseUrl, context);
  }
}
