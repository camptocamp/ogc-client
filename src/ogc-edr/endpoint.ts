import OgcApiEndpoint from "../ogc-api/endpoint.js";
import { fetchDocument, fetchRoot, getLinkUrl } from "../ogc-api/link-utils.js";
import { OgcEDRDocument } from "./model.js";

type wkt = string;

export default class OgcApiEDREndpoint extends OgcApiEndpoint {
  private edr_root_: Promise<OgcEDRDocument>;

  constructor(base_url: string) {
    super(base_url); 
  }

  protected get edr_root(): Promise<OgcEDRDocument> {
    if (!this.edr_root_) {
      this.edr_root_ = fetchRoot(this.baseUrl)
        .then((doc) => doc as unknown as OgcEDRDocument)
        .catch((e) => {
          throw new Error(`The endpoint appears non-conforming, the following error was encountered:
    ${e.message}`);
        });
    }
    return this.edr_root_;
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
    const collectionDoc = await this.getCollectionDocument(collectionId);
    const url = new URL(
      getLinkUrl(collectionDoc, 'area', this.baseUrl),
      window.location.toString()
    );

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
    const collectionDoc = await this.getCollectionDocument(collectionId);
    const url = new URL(
      getLinkUrl(collectionDoc, 'locations', this.baseUrl),
      window.location.toString()
    );
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
    bbox: Number[],
    z: string?,
    datetime: string?,
    parameter_name: string[]?,
    crs: string?,
    f: string?
  ) {}

  getTrajectory(collectionId: string) {}
  getRadius(collectionId: string) {}
  getCorridor(collectionId: string) {}
  getPosition(collectionId: string) {}
  getInstances(collectionId: string) {}
}