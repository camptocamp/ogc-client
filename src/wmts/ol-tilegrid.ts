import { MatrixSetLimit, WmtsMatrixSet } from './model.js';
import WMTSTileGrid, {
  createFromCapabilitiesMatrixSet,
} from 'ol/tilegrid/WMTS.js';
import { get as getProjection } from 'ol/proj.js';
import { fromEPSGCode, register } from 'ol/proj/proj4.js';
import proj4 from 'proj4';

register(proj4);

export async function buildOpenLayersTileGrid(
  matrixSet: WmtsMatrixSet,
  limits: MatrixSetLimit[]
): Promise<WMTSTileGrid> {
  // if the matrix set crs is not known, load it
  let projection = getProjection(matrixSet.crs);
  if (!projection) {
    projection = await fromEPSGCode(matrixSet.crs);
  }
  if (!projection) {
    throw new Error(
      `[ogc-client] could not create OpenLayers tile grid, the following projection is unknown: ${matrixSet.crs}`
    );
  }
  const matrixSetInfo = {
    SupportedCRS: projection,
    TileMatrix: matrixSet.tileMatrices.map((tileMatrix) => ({
      Identifier: tileMatrix.identifier,
      ScaleDenominator: tileMatrix.scaleDenominator,
      TopLeftCorner: tileMatrix.topLeft,
      TileWidth: tileMatrix.tileWidth,
      TileHeight: tileMatrix.tileHeight,
      MatrixWidth: tileMatrix.matrixWidth,
      MatrixHeight: tileMatrix.matrixHeight,
    })),
  };
  const matrixSetLimits = limits.map((limit) => ({
    TileMatrix: limit.tileMatrix,
  }));
  return createFromCapabilitiesMatrixSet(matrixSetInfo, null, matrixSetLimits);
}
