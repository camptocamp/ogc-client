import { DateTimeParameter } from '../../shared/models.js';
import { OgcApiCollectionInfo } from '../model.js';
import { DateTimeParameterToEDRString } from './helpers.js';

type wkt = string;

export default class EDRQueryBuilder {
  supports_area: boolean = false;
  supports_locations: boolean = false;
  supports_cube: boolean = false;

  private supported_params: Set<string> = new Set();

  constructor(private collection: OgcApiCollectionInfo) {
    if (!collection.data_queries) {
      throw new Error('No data queries found, so cannot issue EDR queries');
    } else {
      this.supports_area = collection.data_queries.area !== undefined;
      this.supports_locations = collection.data_queries.locations !== undefined;
      this.supports_cube = collection.data_queries.cube !== undefined;
    }

    for (const parameter of Object.values(collection.parameter_names)) {
      this.supported_params.add(parameter.id);
    }

    this.collection = collection;
  }

  get parameters(): Set<string> {
    return this.supported_params;
  }

  async buildAreaDownloadUrl(
    coords: wkt,
    parameter_names: string[],
    z?: string,
    datetime?: DateTimeParameter,
    crs?: string,
    f?: string
  ): Promise<string> {
    if (!this.supports_area) {
      throw new Error('Collection does not support area queries');
    }

    const url = new URL(this.collection.data_queries?.area?.link.href);

    url.searchParams.set('coords', coords);
    if (z !== undefined) url.searchParams.set('z', z);
    if (datetime !== undefined)
      url.searchParams.set('datetime', DateTimeParameterToEDRString(datetime));
    if (parameter_names != null) {
      for (const parameter_name of parameter_names) {
        if (!this.supported_params.has(parameter_name)) {
          throw new Error(
            `The following parameter name does not exist on this collection: '${parameter_name}'.`
          );
        }
      }

      url.searchParams.set('parameter-name', parameter_names.join(','));
    }
    if (crs !== undefined) url.searchParams.set('crs', crs);
    if (f !== undefined) url.searchParams.set('f', f);
    return url.toString();
  }

  async buildLocationsDownloadUrl(
    locationId?: string,
    parameter_name?: string[],
    datetime?: DateTimeParameter,
    crs?: string,
    f?: string
  ): Promise<string> {
    if (!this.supports_locations) {
      throw new Error('Collection does not support location queries');
    }

    const url = new URL(this.collection.data_queries?.locations?.link.href);
    if (locationId !== undefined)
      url.searchParams.set('locationId', locationId);

    if (parameter_name !== undefined) {
      for (const parameter of parameter_name) {
        if (!this.supported_params.has(parameter)) {
          throw new Error(
            `The following parameter name does not exist on this collection: '${parameter}'.`
          );
        }
      }
      url.searchParams.set('parameter-name', parameter_name.join(','));
    }

    if (datetime !== undefined)
      url.searchParams.set('datetime', DateTimeParameterToEDRString(datetime));
    if (crs !== undefined) url.searchParams.set('crs', crs);
    if (f !== undefined) url.searchParams.set('f', f);
    return url.toString();
  }

  async buildCubeDownloadUrl(
    bbox: number[],
    parameter_name: string[],
    z?: string,
    datetime?: DateTimeParameter,
    crs?: string,
    f?: string
  ): Promise<string> {
    if (!this.supports_cube) {
      throw new Error('Collection does not support cube queries');
    }

    const url = new URL(this.collection.data_queries?.cube?.link.href);
    url.searchParams.set('bbox', bbox.join(','));
    if (z !== undefined) url.searchParams.set('z', z);
    if (datetime !== undefined)
      url.searchParams.set('datetime', DateTimeParameterToEDRString(datetime));
    if (parameter_name != null) {
      for (const parameter of parameter_name) {
        if (!this.supported_params.has(parameter)) {
          throw new Error(
            `The following parameter name does not exist on this collection: '${parameter}'.`
          );
        }
      }
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
