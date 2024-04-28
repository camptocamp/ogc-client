import {
  checkHasFeatures,
  checkHasRecords,
  checkStyleConformance,
  checkTileConformance,
  parseBaseCollectionInfo,
  parseCollectionParameters,
  parseCollections,
  parseConformance,
  parseEndpointInfo,
} from './info.js';
import {
  ConformanceClass,
  OgcApiCollectionInfo,
  OgcApiCollectionItem,
  OgcApiDocument,
  OgcApiEndpointInfo,
} from './model.js';
import {
  fetchCollectionRoot,
  fetchDocument,
  fetchLink,
  fetchRoot,
  getLinks,
  getLinkUrl,
  hasLinks,
} from './link-utils.js';
import { EndpointError } from '../shared/errors.js';
import { BoundingBox, CrsCode, MimeType } from '../shared/models.js';
import { isMimeTypeJson, isMimeTypeJsonFg } from '../shared/mime-type.js';

/**
 * Represents an OGC API endpoint advertising various collections and services.
 */
export default class OgcApiEndpoint {
  // these are cached results because the getters rely on HTTP requests; to avoid
  // unhandled promise rejections the getters are evaluated lazily
  private root_: Promise<OgcApiDocument>;
  private conformance_: Promise<OgcApiDocument>;
  private data_: Promise<OgcApiDocument>;

  private get root(): Promise<OgcApiDocument> {
    if (!this.root_) {
      this.root_ = fetchRoot(this.baseUrl).catch((e) => {
        throw new Error(`The endpoint appears non-conforming, the following error was encountered:
${e.message}`);
      });
    }
    return this.root_;
  }
  private get conformance(): Promise<OgcApiDocument> {
    if (!this.conformance_) {
      this.conformance_ = this.root.then((root) =>
        fetchLink(
          root,
          ['conformance', 'http://www.opengis.net/def/rel/ogc/1.0/conformance'],
          this.baseUrl
        )
      );
    }
    return this.conformance_;
  }
  private get collectionsUrl(): Promise<string> {
    return this.root.then((root) =>
      getLinkUrl(
        root,
        ['data', 'http://www.opengis.net/def/rel/ogc/1.0/data'],
        this.baseUrl
      )
    );
  }
  private get data(): Promise<OgcApiDocument> {
    if (!this.data_) {
      this.data_ = this.collectionsUrl
        .then(fetchDocument)
        .then(async (data) => {
          // check if there's a collection in the path; if yes, keep only this one
          const singleCollection = await fetchCollectionRoot(this.baseUrl);
          if (singleCollection !== null && Array.isArray(data.collections)) {
            data.collections = data.collections.filter(
              (collection) => collection.id === singleCollection.id
            );
          }
          return data;
        });
    }
    return this.data_;
  }

  /**
   * Creates a new OGC API endpoint.
   * @param baseUrl Base URL used to query the endpoint. Note that this can point to nested
   * documents inside the endpoint, such as `/collections`, `/collections/items` etc.
   */
  constructor(private baseUrl: string) {}

  /**
   * A Promise which resolves to the endpoint information.
   */
  get info(): Promise<OgcApiEndpointInfo> {
    return this.root.then(parseEndpointInfo);
  }

  /**
   * A Promise which resolves to an array of conformance classes.
   */
  get conformanceClasses(): Promise<ConformanceClass[]> {
    return this.conformance.then(parseConformance);
  }
  /**
   * A Promise which resolves to an array of all collection identifiers as strings.
   */
  get allCollections(): Promise<string[]> {
    return this.data.then(parseCollections());
  }

  /**
   * A Promise which resolves to an array of records collection identifiers as strings.
   */
  get recordCollections(): Promise<string[]> {
    return Promise.all([this.data, this.hasRecords])
      .then(([data, hasRecords]) => (hasRecords ? data : { collections: [] }))
      .then(parseCollections('record'));
  }

  /**
   * A Promise which resolves to an array of feature collection identifiers as strings.
   */
  get featureCollections(): Promise<string[]> {
    return Promise.all([this.data, this.hasFeatures])
      .then(([data, hasFeatures]) => (hasFeatures ? data : { collections: [] }))
      .then(parseCollections('feature'));
  }

  /**
   * A Promise which resolves to a boolean indicating whether the endpoint offer tiles.
   */
  get hasTiles(): Promise<boolean> {
    return this.conformanceClasses.then(checkTileConformance);
  }

  /**
   * A Promise which resolves to a boolean indicating whether the endpoint offer styles.
   */
  get hasStyles(): Promise<boolean> {
    return this.conformanceClasses.then(checkStyleConformance);
  }

  /**
   * A Promise which resolves to a boolean indicating whether the endpoint offer feature collections.
   */
  get hasFeatures(): Promise<boolean> {
    return Promise.all([
      this.data.then((data) => data.collections),
      this.conformanceClasses,
    ]).then(checkHasFeatures);
  }

  /**
   * A Promise which resolves to a boolean indicating whether the endpoint offer record collections.
   */
  get hasRecords(): Promise<boolean> {
    return Promise.all([
      this.data.then((data) => data.collections),
      this.conformanceClasses,
    ]).then(checkHasRecords);
  }

  private getCollectionDocument(collectionId: string): Promise<OgcApiDocument> {
    return Promise.all([this.allCollections, this.data])
      .then(([collections, data]) => {
        if (collections.indexOf(collectionId) === -1)
          throw new EndpointError(`Collection not found: ${collectionId}`);
        return (data.collections as OgcApiDocument[]).find(
          (collection) => collection.id === collectionId
        );
      })
      .then(async (collection) => {
        // if a self link is there, use it!
        if (hasLinks(collection, ['self'])) {
          return fetchLink(collection, 'self', this.baseUrl);
        }
        // otherwise build a URL for the collection
        return fetchDocument(`${await this.collectionsUrl}/${collectionId}`);
      });
  }

  /**
   * Returns a promise resolving to a document describing the specified collection.
   * @param collectionId
   */
  async getCollectionInfo(collectionId: string): Promise<OgcApiCollectionInfo> {
    const collectionDoc = await this.getCollectionDocument(collectionId);
    const baseInfo = parseBaseCollectionInfo(collectionDoc);
    const [queryables, sortables] = await Promise.all([
      fetchLink(
        collectionDoc,
        ['queryables', 'http://www.opengis.net/def/rel/ogc/1.0/queryables'],
        this.baseUrl
      )
        .then(parseCollectionParameters)
        .catch(() => []),
      fetchLink(
        collectionDoc,
        ['sortables', 'http://www.opengis.net/def/rel/ogc/1.0/sortables'],
        this.baseUrl
      )
        .then(parseCollectionParameters)
        .catch(() => []),
    ]);
    return {
      ...baseInfo,
      queryables,
      sortables,
    };
  }

  /**
   * Returns a promise resolving to an array of items from a collection with the given query parameters.
   * @param collectionId
   * @param limit
   * @param offset
   * @param skipGeometry
   * @param sortby
   * @param bbox
   * @param properties
   */
  getCollectionItems(
    collectionId: string,
    limit: number = 10,
    offset: number = 0,
    skipGeometry: boolean = null,
    sortby: string[] = null,
    bbox: [number, number, number, number] = null,
    properties: string[] = null
  ): Promise<OgcApiCollectionItem[]> {
    return this.getCollectionDocument(collectionId)
      .then((collectionDoc) => {
        const url = new URL(
          getLinkUrl(collectionDoc, 'items', this.baseUrl),
          window.location.toString()
        );
        url.searchParams.set('limit', limit.toString());
        url.searchParams.set('offset', offset.toString());
        if (skipGeometry !== null)
          url.searchParams.set('skipGeometry', skipGeometry.toString());
        if (sortby !== null)
          url.searchParams.set('sortby', sortby.join(',').toString());
        if (bbox !== null)
          url.searchParams.set('bbox', bbox.join(',').toString());
        if (properties !== null)
          url.searchParams.set('properties', properties.join(',').toString());
        return url.toString();
      })
      .then(fetchDocument)
      .then((doc) => doc.features as OgcApiCollectionItem[]);
  }

  /**
   * Returns a promise resolving to a specific item from a collection.
   * @param collectionId
   * @param itemId
   */
  getCollectionItem(
    collectionId: string,
    itemId: string
  ): Promise<OgcApiCollectionItem> {
    return this.getCollectionDocument(collectionId)
      .then((collectionDoc) => {
        const url = new URL(
          getLinkUrl(collectionDoc, 'items', this.baseUrl),
          window.location.toString()
        );
        url.pathname += `/${itemId}`;
        return url.toString();
      })
      .then(fetchDocument<OgcApiCollectionItem>);
  }

  /**
   * Asynchronously retrieves a URL for the items of a specified collection, with optional query parameters.
   * @param collectionId - The unique identifier for the collection.
   * @param options - An object containing optional parameters:
   *  - query: Additional query parameters to be included in the URL.
   *  - asJson: Will query items as GeoJson or JSON-FG if available; takes precedence on `outputFormat`.
   *  - outputFormat: The MIME type for the output format.
   *  - limit: The maximum number of features to include.
   *  - extent: Bounding box to limit the features.
   *  - offset: Pagination offset for the returned results.
   *  - outputCrs: Coordinate Reference System code for the output.
   *  - extentCrs: Coordinate Reference System code for the bounding box.
   * @returns A promise that resolves to the URL as a string or rejects if an error occurs.
   */
  getCollectionItemsUrl(
    collectionId: string,
    options: {
      query?: string;
      asJson?: boolean;
      outputFormat?: MimeType;
      limit?: number;
      offset?: number;
      outputCrs?: CrsCode;
      extent?: BoundingBox;
      extentCrs?: CrsCode;
    } = {}
  ): Promise<string> {
    return this.getCollectionDocument(collectionId)
      .then((collectionDoc) => {
        const baseUrl = this.baseUrl || '';
        const itemLinks = getLinks(collectionDoc, 'items');
        let linkWithFormat = itemLinks.find(
          (link) => link.type === options?.outputFormat
        );
        let url: URL;
        if (options.asJson) {
          // try json-fg
          linkWithFormat = itemLinks.find((link) =>
            isMimeTypeJsonFg(link.type)
          );
          // try geojson
          linkWithFormat =
            linkWithFormat ??
            itemLinks.find((link) => isMimeTypeJson(link.type));
        }
        if (options?.outputFormat && !linkWithFormat) {
          // do not prevent using this output format, because it still might work! but give a warning at least
          console.warn(
            `[ogc-client] The following output format type was not found in the collection '${collectionId}': ${options.outputFormat}`
          );
          url = new URL(itemLinks[0].href, baseUrl);
          url.searchParams.set('f', options.outputFormat);
        } else if (linkWithFormat) {
          url = new URL(linkWithFormat.href, baseUrl);
        } else {
          url = new URL(itemLinks[0].href, baseUrl);
        }

        if (options.query !== undefined)
          url.search += (url.search ? '&' : '') + options.query;
        if (options.limit !== undefined)
          url.searchParams.set('limit', options.limit.toString());
        if (options.offset !== undefined)
          url.searchParams.set('offset', options.offset.toString());
        if (options.outputCrs !== undefined)
          url.searchParams.set('crs', options.outputCrs);
        if (options.extent !== undefined && options.extent.length === 4)
          url.searchParams.set('bbox', options.extent.join(','));
        if (options.extentCrs !== undefined)
          url.searchParams.set('bbox-crs', options.extentCrs);

        return url.toString();
      })
      .catch((error) => {
        console.error('Error fetching collection items URL:', error);
        throw error;
      });
  }
}
