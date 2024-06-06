import { setQueryParams } from '../shared/http-utils.js';
import { BoundingBox, CrsCode, MimeType } from '../shared/models.js';
import { WmsVersion } from './model.js';

/**
 * Generates an URL for a GetMap operation
 * @param serviceUrl
 * @param version
 * @param layers Comma-separated list of layers to render
 * @param widthPx
 * @param heightPx
 * @param crs Coordinate reference system to use for the image
 * @param extent Expressed in the requested CRS
 * @param outputFormat
 * @param [styles] Comma-separated list of styles to use; leave out for default style
 */
export function generateGetMapUrl(
  serviceUrl: string,
  version: WmsVersion,
  layers: string,
  widthPx: number,
  heightPx: number,
  crs: CrsCode,
  extent: BoundingBox,
  outputFormat: MimeType,
  styles?: string
): string {
  const crsParam = version === '1.3.0' ? 'CRS' : 'SRS';

  const newParams = {
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: version,
    LAYERS: layers,
    STYLES: styles ?? '',
  };
  newParams['WIDTH'] = widthPx.toString();
  newParams['HEIGHT'] = heightPx.toString();
  newParams['FORMAT'] = outputFormat ?? 'image/png';
  newParams[crsParam] = crs;
  newParams['BBOX'] = extent.join(',');

  return setQueryParams(serviceUrl, newParams);
}
