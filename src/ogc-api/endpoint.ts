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
  getLinkUrl,
} from './link-utils.js';
import { EndpointError } from '../shared/errors.js';

/**
 * Represents an OGC API endpoint advertising various collections and services.
 */
export default class OgcApiEndpoint {
  private root: Promise<OgcApiDocument>;
  private conformance: Promise<OgcApiDocument>;
  private data: Promise<OgcApiDocument>;

  /**
   * Creates a new OGC API endpoint.
   * @param baseUrl Base URL used to query the endpoint. Note that this can point to nested
   * documents inside the endpoint, such as `/collections`, `/collections/items` etc.
   */
  constructor(private baseUrl: string) {
    this.root = fetchRoot(this.baseUrl);
    this.conformance = this.root
      .then((root) =>
        fetchLink(
          root,
          ['conformance', 'http://www.opengis.net/def/rel/ogc/1.0/conformance'],
          this.baseUrl
        )
      )
      .catch(() => null);
    this.data = this.root
      .then((root) =>
        fetchLink(
          root,
          ['data', 'http://www.opengis.net/def/rel/ogc/1.0/data'],
          this.baseUrl
        )
      )
      .then(async (data) => {
        // check if there's a collection in the path; if yes, keep only this one
        const singleCollection = await fetchCollectionRoot(this.baseUrl);
        if (singleCollection !== null && Array.isArray(data.collections)) {
          data.collections = data.collections.filter(
            (collection) => collection.id === singleCollection.id
          );
        }
        return data;
      })
      .catch(() => null);
  }

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
      .then((collection) => fetchLink(collection, 'self', this.baseUrl));
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
}
