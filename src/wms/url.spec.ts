import { generateGetMapUrl } from './url.js';

describe('generateGetMapUrl', () => {
  it('generates a correct URL (v1.1.0, no styles)', () => {
    expect(
      generateGetMapUrl(
        'http://example.com/wms',
        '1.1.0',
        'layer1,layer2',
        100,
        200,
        'EPSG:4326',
        [10, 20, 100, 200],
        'image/png'
      )
    ).toBe(
      'http://example.com/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.0&LAYERS=layer1%2Clayer2&STYLES=&WIDTH=100&HEIGHT=200&FORMAT=image%2Fpng&SRS=EPSG%3A4326&BBOX=10%2C20%2C100%2C200'
    );
  });
  it('generates a correct URL (v1.3.0, with styles)', () => {
    expect(
      generateGetMapUrl(
        'http://example.com/wms',
        '1.3.0',
        'layer1,layer2',
        100,
        200,
        'EPSG:4326',
        [10, 20, 100, 200],
        'image/png',
        'style1,style2'
      )
    ).toBe(
      'http://example.com/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=layer1%2Clayer2&STYLES=style1%2Cstyle2&WIDTH=100&HEIGHT=200&FORMAT=image%2Fpng&CRS=EPSG%3A4326&BBOX=10%2C20%2C100%2C200'
    );
  });
});
