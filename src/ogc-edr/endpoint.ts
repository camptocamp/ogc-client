import OgcApiEndpoint from '../ogc-api/endpoint.js';
import { fetchDocument } from '../ogc-api/link-utils.js';
import { DataQueryTypes, parseCollections } from '../shared/ogc-api/common.js';
import { OgcEDRCollectionInfo, OgcEDRDocument } from './model.js';

type wkt = string;

export default class OgcApiEDREndpoint extends OgcApiEndpoint {
  private edr_root_: Promise<OgcEDRDocument>;

  constructor(base_url: string) {
    super(base_url);
  }
  override get allCollections(): Promise<
    {
      name: string;
      hasRecords?: boolean;
      hasFeatures?: boolean;
      hasVectorTiles?: boolean;
      hasMapTiles?: boolean;
      dataQueries?: DataQueryTypes[];
    }[]
  > {
    return this.data
      .then((doc) => parseCollections(doc, true))
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }

  async getArea(
    collectionId: string,
    coords: wkt,
    z?: string,
    datetime?: string,
    parameter_name?: string[],
    crs?: string,
    f?: string
  ) {
    const collectionDoc = (await this.getCollectionDocument(
      collectionId
    )) as unknown as OgcEDRCollectionInfo;

    const url = new URL(collectionDoc.data_queries?.area?.link.href);

    url.searchParams.set('coords', coords);
    if (z !== undefined) url.searchParams.set('z', z);
    if (datetime !== undefined) url.searchParams.set('datetime', datetime);
    if (parameter_name != null) {
      url.searchParams.set('parameter-name', parameter_name.join(','));
    }
    if (crs !== undefined) url.searchParams.set('crs', crs);
    if (f !== undefined) url.searchParams.set('f', f);

    const doc = await fetchDocument(url.toString());
    return doc as unknown;
  }

  async getLocations(
    collectionId: string,
    locationId?: string,
    parameter_name?: string[],
    datetime?: string,
    crs?: string,
    f?: string
  ) {
    const collectionDoc = (await this.getCollectionDocument(
      collectionId
    )) as unknown as OgcEDRCollectionInfo;
    const url = new URL(collectionDoc.data_queries?.locations?.link.href);
    if (locationId !== undefined)
      url.searchParams.set('locationId', locationId);
    if (parameter_name !== undefined)
      url.searchParams.set('parameter-name', parameter_name.join(','));
    if (datetime !== undefined) url.searchParams.set('datetime', datetime);
    if (crs !== undefined) url.searchParams.set('crs', crs);
    if (f !== undefined) url.searchParams.set('f', f);
    return (await fetchDocument(url.toString())) as unknown;
  }

  getCube(
    collectionId: string,
    bbox: number[],
    z?: string,
    datetime?: string,
    parameter_name?: string[],
    crs?: string,
    f?: string
  ) {
    const collectionDoc = this.getCollectionDocument(
      collectionId
    ) as unknown as OgcEDRCollectionInfo;
    const url = new URL(collectionDoc.data_queries?.cube?.link.href);
    url.searchParams.set('bbox', bbox.join(','));
    if (z !== undefined) url.searchParams.set('z', z);
    if (datetime !== undefined) url.searchParams.set('datetime', datetime);
    if (parameter_name != null) {
      url.searchParams.set('parameter-name', parameter_name.join(','));
    }
    if (crs !== undefined) url.searchParams.set('crs', crs);
    if (f !== undefined) url.searchParams.set('f', f);
    return fetchDocument(url.toString());
  }

  // getTrajectory(collectionId: string) {}
  // getRadius(collectionId: string) {}
  // getCorridor(collectionId: string) {}
  // getPosition(collectionId: string) {}
  // getInstances(collectionId: string) {}
}
