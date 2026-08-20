/**
 * Shared test fixture factories for CSAPI integration tests.
 *
 * Centralizes the `OgcApiCollectionInfo` padding fields (required by the
 * interface but irrelevant to CSAPI tests) so they are declared once
 * instead of duplicated across 4 integration test files.
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/151
 */

import type { OgcApiCollectionInfo } from '../../model.js';

/**
 * Padding fields required by `OgcApiCollectionInfo` but irrelevant to
 * CSAPI integration tests. Declared once to avoid 4-way duplication.
 */
const PADDING: Pick<
  OgcApiCollectionInfo,
  | 'itemFormats'
  | 'bulkDownloadLinks'
  | 'jsonDownloadLink'
  | 'crs'
  | 'itemCount'
  | 'queryables'
  | 'sortables'
  | 'mapTileFormats'
  | 'vectorTileFormats'
  | 'supportedTileMatrixSets'
> = {
  itemFormats: [],
  bulkDownloadLinks: {},
  jsonDownloadLink: '',
  crs: [],
  itemCount: 0,
  queryables: [],
  sortables: [],
  mapTileFormats: [],
  vectorTileFormats: [],
  supportedTileMatrixSets: [],
};

/** All 9 CSAPI resource type link objects using the `ogc-cs:` convention. */
export const ALL_CSAPI_LINKS = [
  { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
  { rel: 'ogc-cs:deployments', type: '', title: '', href: '/deployments' },
  { rel: 'ogc-cs:procedures', type: '', title: '', href: '/procedures' },
  {
    rel: 'ogc-cs:samplingFeatures',
    type: '',
    title: '',
    href: '/samplingFeatures',
  },
  { rel: 'ogc-cs:properties', type: '', title: '', href: '/properties' },
  { rel: 'ogc-cs:datastreams', type: '', title: '', href: '/datastreams' },
  {
    rel: 'ogc-cs:observations',
    type: '',
    title: '',
    href: '/observations',
  },
  {
    rel: 'ogc-cs:controlStreams',
    type: '',
    title: '',
    href: '/controlStreams',
  },
  { rel: 'ogc-cs:commands', type: '', title: '', href: '/commands' },
];

/**
 * Factory for test collections with all CSAPI resources advertised.
 *
 * Provides sensible defaults for all required `OgcApiCollectionInfo` fields.
 * Pass `overrides` to customize links, id, title, description, etc.
 *
 * @param overrides - Partial fields to merge over the defaults.
 * @returns A complete `OgcApiCollectionInfo` suitable for `CSAPIQueryBuilder`.
 */
export function makeTestCollection(
  overrides: Partial<OgcApiCollectionInfo> = {}
): OgcApiCollectionInfo {
  return {
    ...PADDING,
    links: [
      {
        rel: 'self',
        type: '',
        title: '',
        href: 'https://api.example.com/collections/test',
      },
      ...ALL_CSAPI_LINKS,
    ],
    id: 'test',
    title: 'Test Collection',
    description: 'Test CSAPI collection',
    ...overrides,
  };
}
