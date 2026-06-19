import { useCache } from '../shared/cache.js';
import { setQueryParams, sharedFetch } from '../shared/http-utils.js';
import { BoundingBox } from '../shared/models.js';

export interface NcwmsLayerDetails {
  scaleRange: [number, number];
  palettes: string[];
  defaultPalette?: string;
  supportedStyles: string[];
  units: string;
  bbox: BoundingBox;
}

export interface NcwmsMinMax {
  min: number;
  max: number;
}

/**
 * Represents an NcWMS endpoint, a WMS extension for scientific data with
 * additional rendering parameters (colour palette, scale range, log scale).
 *
 * NcWMS is used by servers such as Thredds, ERDDAP, BODC and CMEMS.
 */
export class NcwmsEndpoint {
  private _baseUrl: string;

  constructor(url: string) {
    // Strip WMS-specific query params to get the base endpoint URL
    const urlObj = new URL(url);
    for (const param of ['SERVICE', 'REQUEST', 'VERSION', 'LAYERS', 'LAYER']) {
      for (const key of [...urlObj.searchParams.keys()]) {
        if (key.toUpperCase() === param) urlObj.searchParams.delete(key);
      }
    }
    this._baseUrl = urlObj.toString();
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
      ITEM: 'layerDetails',
      LAYERNAME: layerName,
    });

    return useCache(
      () => this._fetchLayerDetails(url),
      'NCWMS',
      'LAYER_DETAILS',
      url
    );
  }

  private async _fetchLayerDetails(
    url: string
  ): Promise<NcwmsLayerDetails | null> {
    let resp: Response;
    try {
      resp = await sharedFetch(url, 'GET', true);
    } catch {
      return null;
    }
    if (!resp.ok) return null;

    let data: Record<string, unknown>;
    try {
      data = await resp.json();
    } catch {
      return null;
    }

    if (
      !Array.isArray(data.palettes) ||
      !data.palettes.every((p) => typeof p === 'string') ||
      !Array.isArray(data.scaleRange) ||
      data.scaleRange.length !== 2 ||
      !data.scaleRange.every((n) => typeof n === 'number' && Number.isFinite(n))
    ) {
      return null;
    }

    const bbox =
      Array.isArray(data.bbox) &&
      data.bbox.length === 4 &&
      data.bbox.every((n) => typeof n === 'number' && Number.isFinite(n))
        ? (data.bbox as BoundingBox)
        : ([-180, -90, 180, 90] as BoundingBox);

    return {
      scaleRange: data.scaleRange as [number, number],
      palettes: data.palettes as string[],
      defaultPalette:
        typeof data.defaultPalette === 'string' ? data.defaultPalette : undefined,
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
    options?: { time?: string; elevation?: string }
  ): Promise<NcwmsMinMax> {
    const params: Record<string, string> = {
      SERVICE: 'WMS',
      VERSION: '1.1.1',
      REQUEST: 'GetMetadata',
      ITEM: 'minmax',
      LAYERS: layerName,
      BBOX: bbox.join(','),
      SRS: 'CRS:84',
      WIDTH: '50',
      HEIGHT: '50',
    };
    if (options?.time) params['TIME'] = options.time;
    if (options?.elevation) params['ELEVATION'] = options.elevation;

    const url = setQueryParams(this._baseUrl, params);
    const resp = await sharedFetch(url, 'GET', true);
    if (!resp.ok) {
      throw new Error(`NcWMS GetMinMax failed with status ${resp.status}`);
    }
    const data = await resp.json();
    return { min: data.min as number, max: data.max as number };
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
    } = {}
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
