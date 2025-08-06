import OgcApiEDREndpoint from "./endpoint.js";
import * as path from 'path';
import { readFile, stat } from 'fs/promises';

const FIXTURES_ROOT = path.join(__dirname, '../../fixtures/ogc-edr');

// setup fetch to read local fixtures
beforeAll(() => {
  globalThis.fetch = jest.fn().mockImplementation(async (urlOrInfo) => {
    const url = new URL(
      urlOrInfo instanceof URL || typeof urlOrInfo === 'string'
        ? urlOrInfo
        : urlOrInfo.url
    );

    // if we're on the root path (e.g. /sample-data/), only answer if there's a trailing slash
    // this is made to mimic the behavior of a webapp deployed on http://host.com/webapp/, where
    // querying http://host.com/webapp would return a 404
    if (url.pathname.split('/').length === 2 && !url.pathname.endsWith('/')) {
      return {
        ok: false,
        status: 404,
        headers: new Headers(),
        clone: function () {
          return this;
        },
      } as Response;
    }

    let queryPath = url.pathname.replace(/\/$/, ''); // remove trailing slash
    if (queryPath === '') {
      queryPath = 'root-path'; // make sure we're serving something at the root
    }
    const format = url.searchParams.get('f') || 'html';
    const filePath = `${path.join(FIXTURES_ROOT, queryPath)}.${format}`;
    try {
      await stat(filePath);
    } catch (e) {
      return {
        ok: false,
        status: 404,
        headers: new Headers(),
        clone: function () {
          return this;
        },
      } as Response;
    }
    const contents = await readFile(filePath, {
      encoding: 'utf8',
    });
    return {
      ok: true,
      headers: new Headers(),
      clone: function () {
        return this;
      },
      json: () =>
        new Promise((resolve) => {
          resolve(JSON.parse(contents));
        }),
    } as Response;
  });
});

describe('endpoint',  () => {

    it('should create an instance of OgcApiEDREndpoint', async () => {
        const endpoint = new OgcApiEDREndpoint(
          'http://local/sample-data-hub'
        );
        expect(endpoint).toBeInstanceOf(OgcApiEDREndpoint);
    });
    it('should have the correct number of collection items', async () => {
        const endpoint = new OgcApiEDREndpoint('http://local/sample-data-hub');
        expect(endpoint).toBeInstanceOf(OgcApiEDREndpoint);
        const collections = await endpoint.allCollections;
        expect(collections.length).toBe(2);
    })
});