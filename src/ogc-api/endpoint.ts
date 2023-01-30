import {
  checkHasFeatures,
  checkHasRecords,
  checkStyleConformance,
  checkTileConformance,
  parseCollectionInfo,
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
import { fetchLink, fetchRoot } from './link-utils';
import { EndpointError } from '../shared/errors';

export default class OgcApiEndpoint {
  private root = fetchRoot(this.baseUrl);
  private conformance = this.root.then((root) =>
    fetchLink(root, 'conformance')
  );
  private data = this.root.then((root) => fetchLink(root, 'data'));

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
  getCollectionInfo(collectionId: string): Promise<OgcApiCollectionInfo> {
    return Promise.all([this.allCollections, this.data])
      .then(([collections, data]) => {
        if (collections.indexOf(collectionId) === -1)
          throw new EndpointError(`Collection not found: ${collectionId}`);
        return (data.collections as OgcApiDocument[]).find(
          (collection) => collection.id === collectionId
        );
      })
      .then((collection) => fetchLink(collection, 'self'))
      .then(parseCollectionInfo);
  }
  getCollectionItems(collectionId: string): Promise<OgcApiCollectionItem[]> {
    return Promise.resolve([]);
  }
}
