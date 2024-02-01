import { generateGetTileUrl } from './url';

describe('URL utils', () => {
  describe('generateGetTileUrl', () => {
    it('generates URL with KVP encoding', () => {
      const url = generateGetTileUrl(
        'http://my.service.org/wmts',
        'KVP',
        'myLayer',
        'myStyle',
        'webMercator',
        'zoom:3',
        4,
        5,
        'image/png'
      );
      expect(url).toBe(
        'http://my.service.org/wmts?layer=myLayer&style=myStyle&tilematrixset=webMercator&Service=WMTS&Request=GetTile&Format=image%2Fpng&TileMatrix=zoom%3A3&TileCol=5&TileRow=4'
      );
    });
  });
  describe('generateGetTileUrl', () => {
    it('generates URL with KVP encoding', () => {
      const url = generateGetTileUrl(
        'http://my.service.org/wmts/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
        'REST',
        'myLayer',
        'myStyle',
        'webMercator',
        'zoom:3',
        4,
        5,
        'image/png'
      );
      expect(url).toBe(
        'http://my.service.org/wmts/myStyle/webMercator/zoom:3/4/5.png'
      );
    });
  });
});
