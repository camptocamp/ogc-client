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
 * @param [dimensions] Dimension values keyed by dimension name (case-insensitive, e.g. { time: '...' })
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
  styles?: string,
  dimensions?: Record<string, string>
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

  // Dimensions are exposed lowercase in the parsed capabilities (e.g. "time"),
  // but must be uppercased on the wire like every other WMS parameter.
  if (dimensions) {
    for (const [name, value] of Object.entries(dimensions)) {
      newParams[name.toUpperCase()] = value;
    }
  }

  return setQueryParams(serviceUrl, newParams);
}

/**
 * Generates an URL for a DescribeLayer operation
 * @param serviceUrl
 * @param version
 * @param layerName Layer name to describe
 */
export function generateDescribeLayerUrl(
  serviceUrl: string,
  version: WmsVersion,
  layerName: string
): string {
  return setQueryParams(serviceUrl, {
    SERVICE: 'WMS',
    REQUEST: 'DescribeLayer',
    VERSION: version,
    LAYERS: layerName,
    SLD_VERSION: '1.1.0',
  });
}
