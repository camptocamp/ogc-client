import { useCache } from '../../shared/cache.js';
import { queryJsonDocument } from '../../shared/http-utils.js';
import { BoundingBox } from '../../shared/models.js';
import WmsEndpoint from '../endpoint.js';
import {
  NcwmsDetailsResponse,
  NcwmsLayerDetails,
  NcwmsMinMax,
} from './model.js';
import { setQueryParams } from '../../shared/url-utils.js';

/**
 * Represents an NcWMS endpoint, a WMS extension for scientific data with
 * additional rendering parameters (color palette, scale range, log scale).
 *
 * NcWMS is used by servers such as Thredds, ERDDAP, BODC and CMEMS.
 */
export class NcwmsEndpoint extends WmsEndpoint {
  private _baseUrl: string;

  constructor(url: string) {
    super(url);
    this._baseUrl = setQueryParams(url, {
      SERVICE: 'WMS',
      VERSION: null,
      LAYERS: null,
      LAYER: null,
    });
  }

  /**
   * Fetches NcWMS layer metadata.
   * Returns null if the server does not expose NcWMS-specific metadata for this layer.
   * @param layerName Layer name as declared in GetCapabilities
   */
  async getLayerDetails(layerName: string): Promise<NcwmsLayerDetails | null> {
    const url = setQueryParams(this._baseUrl, {
      SERVICE: 'WMS',
      REQUEST: 'GetMetadata',
      item: 'layerDetails',
      layerName: layerName,
    });

    return useCache(
      () => this._fetchLayerDetails(url),
      'NCWMS',
      'LAYER_DETAILS',
      url,
    );
  }

  private async _fetchLayerDetails(
    url: string,
  ): Promise<NcwmsLayerDetails | null> {
    const data = await queryJsonDocument<NcwmsDetailsResponse>(url);

    const toFiniteNumber = (v: unknown): number | null => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // validate inputs
    if (
      !Array.isArray(data.palettes) ||
      !data.palettes.every((p) => typeof p === 'string') ||
      !Array.isArray(data.scaleRange) ||
      data.scaleRange.length !== 2 ||
      data.scaleRange.some((n) => toFiniteNumber(n) === null)
    ) {
      return null;
    }

    const scaleRange = data.scaleRange.map(toFiniteNumber) as [number, number];

    const bbox =
      Array.isArray(data.bbox) &&
      data.bbox.length === 4 &&
      data.bbox.every((n) => toFiniteNumber(n) !== null)
        ? (data.bbox.map(toFiniteNumber) as BoundingBox)
        : ([-180, -90, 180, 90] as BoundingBox);

    return {
      scaleRange,
      palettes: data.palettes as string[],
      defaultPalette:
        typeof data.defaultPalette === 'string'
          ? data.defaultPalette
          : undefined,
      supportedStyles:
        Array.isArray(data.supportedStyles) &&
        data.supportedStyles.every((s) => typeof s === 'string')
          ? (data.supportedStyles as string[])
          : ['boxfill'],
      units: typeof data.units === 'string' ? data.units : '',
      bbox,
    };
  }

  /**
   * Fetches the approximate min/max data range for the given extent.
   * NcWMS computes this from a downsampled GetMap request.
   * @param layerName Layer name
   * @param bbox Bounding box [west, south, east, north] in CRS:84
   * @param options Optional TIME and ELEVATION values
   */
  async getMinMax(
    layerName: string,
    bbox: BoundingBox,
    options?: { time?: string; elevation?: string },
  ): Promise<NcwmsMinMax> {
    const params: Record<string, string> = {
      SERVICE: 'WMS',
      VERSION: '1.1.1',
      REQUEST: 'GetMetadata',
      item: 'minmax',
      LAYERS: layerName,
      bbox: bbox.join(','),
      SRS: 'CRS:84',
      width: '50',
      height: '50',
    };
    if (options?.time) params['time'] = options.time;
    if (options?.elevation) params['elevation'] = options.elevation;

    const url = setQueryParams(this._baseUrl, params);
    const data = await queryJsonDocument<{ min?: unknown; max?: unknown }>(url);
    const min = typeof data.min === 'number' ? data.min : Number(data.min);
    const max = typeof data.max === 'number' ? data.max : Number(data.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new Error('NcWMS GetMinMax returned an invalid min/max payload');
    }
    return { min, max };
  }

  /**
   * Builds a GetLegendGraphic URL for the layer. No network request is made.
   * @param layerName Layer name
   * @param options Style and rendering options
   */
  getLegendUrl(
    layerName: string,
    options: {
      style?: string;
      colorScaleRange?: [number, number];
      logScale?: boolean;
    } = {},
  ): string {
    const params: Record<string, string> = {
      SERVICE: 'WMS',
      REQUEST: 'GetLegendGraphic',
      LAYER: layerName,
      WIDTH: '150',
      HEIGHT: '30',
      VERTICAL: 'false',
    };
    if (options.style) params['STYLES'] = options.style;
    if (options.colorScaleRange) {
      params['COLORSCALERANGE'] = options.colorScaleRange.join(',');
    }
    if (options.logScale !== undefined) {
      params['LOGSCALE'] = String(options.logScale);
    }
    return setQueryParams(this._baseUrl, params);
  }
}
