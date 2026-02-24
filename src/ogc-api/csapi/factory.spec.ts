import OgcApiEndpoint from '../endpoint.js';
import { readFile, stat } from 'fs/promises';
import * as path from 'path';
import { EndpointError } from '../../shared/errors.js';
import { createCSAPIBuilder } from './factory.js';

const FIXTURES_ROOT = path.join(__dirname, '../../../fixtures/ogc-api');

// Setup fetch to read local fixtures (same pattern as endpoint.spec.ts)
beforeAll(() => {
  globalThis.fetch = jest.fn().mockImplementation(async (urlOrInfo) => {
    const url = new URL(
      urlOrInfo instanceof URL || typeof urlOrInfo === 'string'
        ? urlOrInfo
        : urlOrInfo.url
    );

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

    let queryPath = url.pathname.replace(/\/$/, '');
    if (queryPath === '') {
      queryPath = 'root-path';
    }
    const format = url.searchParams.get('f') || 'html';
    const filePath = `${path.join(FIXTURES_ROOT, queryPath)}.${format}`;
    try {
      await stat(filePath);
    } catch {
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

jest.useFakeTimers();

describe('createCSAPIBuilder', () => {
  afterEach(async () => {
    await jest.runAllTimersAsync();
  });

  it('creates a builder for a CSAPI-capable endpoint', async () => {
    const endpoint = new OgcApiEndpoint('http://local/csapi/sample-data-hub');
    const builder = await createCSAPIBuilder(endpoint, 'iot-sensors');
    expect(builder).toBeTruthy();
    expect(builder.availableResources).toEqual(
      new Set(['systems', 'deployments', 'datastreams'])
    );
  });

  it('throws on a non-CSAPI endpoint', async () => {
    const endpoint = new OgcApiEndpoint('http://local/sample-data/');
    await expect(
      createCSAPIBuilder(endpoint, 'any-collection')
    ).rejects.toThrow(EndpointError);
  });
});
