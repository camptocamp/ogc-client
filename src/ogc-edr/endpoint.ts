import OgcApiEndpoint from '../ogc-api/endpoint.js';
import { DateTimeParameter } from '../shared/models.js';
import { DataQueryTypes, parseCollections } from '../shared/ogc-api/common.js';
import { DateTimeParameterToEDRString } from './helpers.js';
import { OgcEDRCollectionInfo } from './model.js';

type wkt = string;

export default class OgcApiEDREndpoint extends OgcApiEndpoint {

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

  async getAreaDownloadUrl(
    collectionId: string,
    coords: wkt,
    z?: string,
    datetime?: DateTimeParameter,
    parameter_name?: string[],
    crs?: string,
    f?: string
  ): Promise<string> {
    const collectionDoc = (await this.getCollectionDocument(
      collectionId
    )) as unknown as OgcEDRCollectionInfo;

    const url = new URL(collectionDoc.data_queries?.area?.link.href);

    url.searchParams.set('coords', coords);
    if (z !== undefined) url.searchParams.set('z', z);
    if (datetime !== undefined) url.searchParams.set('datetime', DateTimeParameterToEDRString(datetime));
    if (parameter_name != null) {
      url.searchParams.set('parameter-name', parameter_name.join(','));
    }
    if (crs !== undefined) url.searchParams.set('crs', crs);
    if (f !== undefined) url.searchParams.set('f', f);
    return url.toString();
  }

  async getLocationsDownloadUrl(
    collectionId: string,
    locationId?: string,
    parameter_name?: string[],
    datetime?: DateTimeParameter,
    crs?: string,
    f?: string
  ): Promise<string> {
    const collectionDoc = (await this.getCollectionDocument(
      collectionId
    )) as unknown as OgcEDRCollectionInfo;
    const url = new URL(collectionDoc.data_queries?.locations?.link.href);
    if (locationId !== undefined)
      url.searchParams.set('locationId', locationId);
    if (parameter_name !== undefined)
      url.searchParams.set('parameter-name', parameter_name.join(','));
    if (datetime !== undefined) url.searchParams.set('datetime', DateTimeParameterToEDRString(datetime));
    if (crs !== undefined) url.searchParams.set('crs', crs);
    if (f !== undefined) url.searchParams.set('f', f);
    return url.toString();
  }

  async getCubeDownloadUrl(
    collectionId: string,
    bbox: number[],
    z?: string,
    datetime?: DateTimeParameter,
    parameter_name?: string[],
    crs?: string,
    f?: string
  ): Promise<string> {
    const collectionDoc = this.getCollectionDocument(
      collectionId
    ) as unknown as OgcEDRCollectionInfo;
    const url = new URL(collectionDoc.data_queries?.cube?.link.href);
    url.searchParams.set('bbox', bbox.join(','));
    if (z !== undefined) url.searchParams.set('z', z);
    if (datetime !== undefined) url.searchParams.set('datetime', DateTimeParameterToEDRString(datetime));
    if (parameter_name != null) {
      url.searchParams.set('parameter-name', parameter_name.join(','));
    }
    if (crs !== undefined) url.searchParams.set('crs', crs);
    if (f !== undefined) url.searchParams.set('f', f);
    return url.toString();
  }

  // getTrajectory(collectionId: string) {}
  // getRadius(collectionId: string) {}
  // getCorridor(collectionId: string) {}
  // getPosition(collectionId: string) {}
  // getInstances(collectionId: string) {}
}
