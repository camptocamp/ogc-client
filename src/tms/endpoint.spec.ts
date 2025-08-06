import TmsEndpoint from '../../src/tms/endpoint.js';
import { readFile } from 'fs/promises';
import * as path from 'path';

const SERVICE_FIXTURE = path.join(
  __dirname,
  '../../fixtures/tms/tms-resource-geopf.xml'
);
const TILE_FIXTURE = path.join(
  __dirname,
  '../../fixtures/tms/tileMap-resource-geopf.xml'
);

// Setup global fetch to read fixture files
beforeAll(() => {
  globalThis.fetch = jest
    .fn()
    .mockImplementation(async (urlOrInfo: string | Request) => {
      const url = new URL(
        typeof urlOrInfo === 'string' ? urlOrInfo : urlOrInfo.url
      );
      let filePath: string;
      if (url.href.includes('PLAN.IGN')) {
        filePath = TILE_FIXTURE;
      } else {
        filePath = SERVICE_FIXTURE;
      }
      const text = await readFile(filePath, 'utf8');
      return {
        ok: true,
        headers: new Headers(),
        clone() {
          return this;
        },
        text: async () => text,
      } as Response;
    });
});

jest.useFakeTimers();

describe('TmsEndpoint', () => {
  afterEach(async () => {
    await jest.runAllTimersAsync();
  });

  it('tileMapServiceInfo returns correct service info', async () => {
    const endpoint = new TmsEndpoint('http://tms.osgeo.org/1.0.0/');
    const info = await endpoint.tileMapServiceInfo;
    expect(info.title).toBe('WMS/WMTS/TMS server');
    expect(info.abstract).toContain('WMS, WMTS and TMS');
  });

  it('getTileMapInfo returns correct tile map info', async () => {
    const endpoint = new TmsEndpoint('http://tms.osgeo.org/1.0.0/');

    const tileInfo = await endpoint.getTileMapInfo(
      'http://tms.osgeo.org/1.0.0/PLAN.IGN'
    );
    expect(tileInfo.title).toBe('Plan IGN');
    expect(tileInfo.metadata).toEqual([
      {
        href: 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/attenue.json',
        mimeType: 'application/json',
        type: 'Other',
      },
      {
        href: 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/gris.json',
        mimeType: 'application/json',
        type: 'Other',
      },
      {
        href: 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/classique.json',
        mimeType: 'application/json',
        type: 'Other',
      },
      {
        href: 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/transparent.json',
        mimeType: 'application/json',
        type: 'Other',
      },
      {
        href: 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/toponymes.json',
        mimeType: 'application/json',
        type: 'Other',
      },
      {
        href: 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/accentue.json',
        mimeType: 'application/json',
        type: 'Other',
      },
      {
        href: 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json',
        mimeType: 'application/json',
        type: 'Other',
      },
      {
        href: 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/sans_toponymes.json',
        mimeType: 'application/json',
        type: 'Other',
      },
      {
        href: 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/epure.json',
        mimeType: 'application/json',
        type: 'Other',
      },
    ]);
    expect(tileInfo.srs).toBe('EPSG:3857');
  });

  it('tileMaps returns available tile maps', async () => {
    const endpoint = new TmsEndpoint('http://tms.osgeo.org/1.0.0/');
    const tileMaps = await endpoint.allTileMaps;
    expect(Array.isArray(tileMaps)).toBe(true);
    expect(tileMaps.length).toBeGreaterThan(0);
  });
});
