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
} from './info';
import {
  ConformanceClass,
  OgcApiCollectionInfo,
  OgcApiCollectionItem,
  OgcApiDocument,
  OgcApiEndpointInfo,
} from './model';
import { fetchDocument, fetchLink, fetchRoot, getLinkUrl } from './link-utils';
import { EndpointError } from '../shared/errors';

export default class OgcApiEndpoint {
  private root = fetchRoot(this.baseUrl);
  private conformance = this.root
    .then((root) =>
      fetchLink(
        root,
        ['conformance', 'http://www.opengis.net/def/rel/ogc/1.0/conformance'],
        this.baseUrl
      )
    )
    .catch(() => null);
  private data = this.root
    .then((root) =>
      fetchLink(
        root,
        ['data', 'http://www.opengis.net/def/rel/ogc/1.0/data'],
        this.baseUrl
      )
    )
    .catch(() => null);

  constructor(private baseUrl: string) {}

  get info(): Promise<OgcApiEndpointInfo> {
    return this.root.then(parseEndpointInfo);
  }
  get conformanceClasses(): Promise<ConformanceClass[]> {
    return this.conformance.then(parseConformance);
  }
  get allCollections(): Promise<string[]> {
    return this.data.then(parseCollections());
  }
  get recordCollections(): Promise<string[]> {
    return Promise.all([this.data, this.hasRecords])
      .then(([data, hasRecords]) => (hasRecords ? data : { collections: [] }))
      .then(parseCollections('record'));
  }
  get featureCollections(): Promise<string[]> {
    return Promise.all([this.data, this.hasFeatures])
      .then(([data, hasFeatures]) => (hasFeatures ? data : { collections: [] }))
      .then(parseCollections('feature'));
  }
  get hasTiles(): Promise<boolean> {
    return this.conformanceClasses.then(checkTileConformance);
  }
  get hasStyles(): Promise<boolean> {
    return this.conformanceClasses.then(checkStyleConformance);
  }
  get hasFeatures(): Promise<boolean> {
    return Promise.all([
      this.data.then((data) => data.collections),
      this.conformanceClasses,
    ]).then(checkHasFeatures);
  }
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
      .then(fetchDocument);
  }
}
