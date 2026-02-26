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

  it('creates builders for multiple CSAPI collections on the same endpoint', async () => {
    const endpoint = new OgcApiEndpoint('http://local/csapi/multi-hub');
    const builderA = await createCSAPIBuilder(endpoint, 'alpha-sensors');
    const builderB = await createCSAPIBuilder(endpoint, 'beta-network');

    expect(builderA).toBeTruthy();
    expect(builderA.availableResources).toEqual(
      new Set(['systems', 'observations'])
    );

    expect(builderB).toBeTruthy();
    expect(builderB.availableResources).toEqual(
      new Set(['systems', 'deployments', 'datastreams'])
    );
  });

  it('throws when getCollectionDocument returns a non-conforming document', async () => {
    const endpoint = new OgcApiEndpoint('http://local/csapi/sample-data-hub');

    // Wait for the endpoint to initialise, then spy on getCollectionDocument
    // to return a document missing the required `id` field.
    jest.spyOn(endpoint, 'getCollectionDocument').mockResolvedValue({
      title: 'Missing ID',
      links: [],
    });

    await expect(createCSAPIBuilder(endpoint, 'iot-sensors')).rejects.toThrow(
      EndpointError
    );
  });

  it('propagates network errors from the root document fetch', async () => {
    const endpoint = new OgcApiEndpoint('http://local/csapi/sample-data-hub');

    // Spy on the `root` getter to simulate a network failure that occurs
    // after hasConnectedSystems and getCollectionDocument succeed.
    jest
      .spyOn(endpoint, 'root', 'get')
      .mockReturnValue(Promise.reject(new TypeError('fetch failed')));

    await expect(createCSAPIBuilder(endpoint, 'iot-sensors')).rejects.toThrow(
      TypeError
    );
  });

  it('returns a builder with empty resources for a collection without CSAPI links', async () => {
    const endpoint = new OgcApiEndpoint('http://local/csapi/sample-data-hub');
    const builder = await createCSAPIBuilder(endpoint, 'weather-stations');

    expect(builder).toBeTruthy();
    expect(builder.availableResources).toEqual(new Set());
  });
});
