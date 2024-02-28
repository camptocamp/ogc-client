import { createFromCapabilitiesMatrixSet } from 'ol/tilegrid/WMTS';
import { buildOpenLayersTileGrid } from './ol-tilegrid.js';

describe('buildOpenLayersTileGrid', () => {
  it('calls the OL function accordingly', () => {
    buildOpenLayersTileGrid(
      {
        crs: 'EPSG:3857',
        identifier: 'PM',
        tileMatrices: [
          {
            identifier: '0',
            matrixHeight: 1,
            matrixWidth: 1,
            scaleDenominator: 559082264.029,
            tileHeight: 256,
            tileWidth: 256,
            topLeft: [-20037508.3428, 20037508.3428],
          },
          {
            identifier: '1',
            matrixHeight: 2,
            matrixWidth: 2,
            scaleDenominator: 279541132.015,
            tileHeight: 256,
            tileWidth: 256,
            topLeft: [-20037508.3428, 20037508.3428],
          },
          {
            identifier: '2',
            matrixHeight: 4,
            matrixWidth: 4,
            scaleDenominator: 139770566.007,
            tileHeight: 256,
            tileWidth: 256,
            topLeft: [-20037508.3428, 20037508.3428],
          },
          {
            identifier: '3',
            matrixHeight: 8,
            matrixWidth: 8,
            scaleDenominator: 69885283.0036,
            tileHeight: 256,
            tileWidth: 256,
            topLeft: [-20037508.3428, 20037508.3428],
          },
          {
            identifier: '4',
            matrixHeight: 16,
            matrixWidth: 16,
            scaleDenominator: 34942641.5018,
            tileHeight: 256,
            tileWidth: 256,
            topLeft: [-20037508.3428, 20037508.3428],
          },
          {
            identifier: '5',
            matrixHeight: 32,
            matrixWidth: 32,
            scaleDenominator: 17471320.7509,
            tileHeight: 256,
            tileWidth: 256,
            topLeft: [-20037508.3428, 20037508.3428],
          },
          {
            identifier: '6',
            matrixHeight: 64,
            matrixWidth: 64,
            scaleDenominator: 8735660.37545,
            tileHeight: 256,
            tileWidth: 256,
            topLeft: [-20037508.3428, 20037508.3428],
          },
        ],
      },
      [
        {
          maxTileCol: 1,
          maxTileRow: 1,
          minTileCol: 0,
          minTileRow: 0,
          tileMatrix: '0',
        },
        {
          maxTileCol: 2,
          maxTileRow: 2,
          minTileCol: 0,
          minTileRow: 0,
          tileMatrix: '1',
        },
        {
          maxTileCol: 1024,
          maxTileRow: 1024,
          minTileCol: 0,
          minTileRow: 31,
          tileMatrix: '10',
        },
        {
          maxTileCol: 2048,
          maxTileRow: 2048,
          minTileCol: 0,
          minTileRow: 62,
          tileMatrix: '11',
        },
        {
          maxTileCol: 4096,
          maxTileRow: 4096,
          minTileCol: 0,
          minTileRow: 125,
          tileMatrix: '12',
        },
      ]
    );
    expect(createFromCapabilitiesMatrixSet).toHaveBeenCalledWith(
      {
        SupportedCRS: {
          code: '3857',
        },
        TileMatrix: [
          {
            Identifier: '0',
            MatrixHeight: 1,
            MatrixWidth: 1,
            ScaleDenominator: 559082264.029,
            TileHeight: 256,
            TileWidth: 256,
            TopLeftCorner: [-20037508.3428, 20037508.3428],
          },
          {
            Identifier: '1',
            MatrixHeight: 2,
            MatrixWidth: 2,
            ScaleDenominator: 279541132.015,
            TileHeight: 256,
            TileWidth: 256,
            TopLeftCorner: [-20037508.3428, 20037508.3428],
          },
          {
            Identifier: '2',
            MatrixHeight: 4,
            MatrixWidth: 4,
            ScaleDenominator: 139770566.007,
            TileHeight: 256,
            TileWidth: 256,
            TopLeftCorner: [-20037508.3428, 20037508.3428],
          },
          {
            Identifier: '3',
            MatrixHeight: 8,
            MatrixWidth: 8,
            ScaleDenominator: 69885283.0036,
            TileHeight: 256,
            TileWidth: 256,
            TopLeftCorner: [-20037508.3428, 20037508.3428],
          },
          {
            Identifier: '4',
            MatrixHeight: 16,
            MatrixWidth: 16,
            ScaleDenominator: 34942641.5018,
            TileHeight: 256,
            TileWidth: 256,
            TopLeftCorner: [-20037508.3428, 20037508.3428],
          },
          {
            Identifier: '5',
            MatrixHeight: 32,
            MatrixWidth: 32,
            ScaleDenominator: 17471320.7509,
            TileHeight: 256,
            TileWidth: 256,
            TopLeftCorner: [-20037508.3428, 20037508.3428],
          },
          {
            Identifier: '6',
            MatrixHeight: 64,
            MatrixWidth: 64,
            ScaleDenominator: 8735660.37545,
            TileHeight: 256,
            TileWidth: 256,
            TopLeftCorner: [-20037508.3428, 20037508.3428],
          },
        ],
      },
      null,
      [
        {
          TileMatrix: '0',
        },
        {
          TileMatrix: '1',
        },
        {
          TileMatrix: '10',
        },
        {
          TileMatrix: '11',
        },
        {
          TileMatrix: '12',
        },
      ]
    );
  });
});
