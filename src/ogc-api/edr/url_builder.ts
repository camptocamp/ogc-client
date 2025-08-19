import { DateTimeParameter } from '../../shared/models.js';
import { DataQueryType, OgcApiCollectionInfo } from '../model.js';
import { DateTimeParameterToEDRString } from './helpers.js';

type WellKnownTextString = string;

export default class EDRQueryBuilder {
  protected supported_query_types: {
    area: boolean;
    locations: boolean;
    cube: boolean;
    trajectory: boolean;
    corridor: boolean;
    radius: boolean;
    position: boolean;
    instances: boolean;
  };

  private supported_params: Set<string> = new Set();

  constructor(private collection: OgcApiCollectionInfo) {
    if (!collection.data_queries) {
      throw new Error('No data queries found, so cannot issue EDR queries');
    } else {
      this.supported_query_types = {
        area: collection.data_queries.area !== undefined,
        locations: collection.data_queries.locations !== undefined,
        cube: collection.data_queries.cube !== undefined,
        trajectory: collection.data_queries.trajectory !== undefined,
        corridor: collection.data_queries.corridor !== undefined,
        radius: collection.data_queries.radius !== undefined,
        position: collection.data_queries.position !== undefined,
        instances: collection.data_queries.instances !== undefined,
      };
    }

    for (const parameter of Object.values(collection.parameter_names)) {
      this.supported_params.add(parameter.id);
    }

    this.collection = collection;
  }

  get supported_parameters(): Set<string> {
    return this.supported_params;
  }

  get supported_queries(): Set<DataQueryType> {
    const queries: Set<DataQueryType> = new Set();
    for (const [key, value] of Object.entries(this.supported_query_types)) {
      if (value) {
        queries.add(key as DataQueryType);
      }
    }
    return queries;
  }

  buildAreaDownloadUrl(
    coords: WellKnownTextString,
    parameter_names: string[],
    z?: string,
    datetime?: DateTimeParameter,
    crs?: string,
    f?: string
  ): string {
    if (!this.supported_query_types.area) {
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

  buildLocationsDownloadUrl(
    locationId?: string,
    parameter_name?: string[],
    datetime?: DateTimeParameter,
    crs?: string,
    f?: string
  ): string {
    if (!this.supported_query_types.locations) {
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

  buildCubeDownloadUrl(
    bbox: number[],
    parameter_name?: string[],
    z?: string,
    datetime?: DateTimeParameter,
    crs?: string,
    f?: string
  ): string {
    if (!this.supported_query_types.cube) {
      throw new Error('Collection does not support cube queries');
    }

    // Check that the bbox is valid
    if (bbox.length !== 4) {
      throw new Error('bbox argument must be of length 4');
    }
    const minX = bbox[0];
    const minY = bbox[1];
    const maxX = bbox[2];
    const maxY = bbox[3];
    if (minX > maxX) {
      throw new Error('minX must be less than or equal to maxX');
    }
    if (minY > maxY) {
      throw new Error('minY must be less than or equal to maxY');
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

  buildTrajectoryDownloadUrl(
    coords: WellKnownTextString,
    z?: string,
    datetime?: DateTimeParameter,
    parameter_name?: string[],
    crs?: string,
    f?: string
  ): string {
    if (!this.supported_query_types.trajectory) {
      throw new Error('Collection does not support trajectory queries');
    }

    const url = new URL(this.collection.data_queries?.trajectory?.link.href);
    url.searchParams.set('coords', coords);
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

  buildCorridorDownloadUrl(
    coords: WellKnownTextString,
    corridor_width: number,
    width_units: string,
    corridor_height: number,
    height_units: number,
    z?: string,
    datetime?: DateTimeParameter,
    parameter_name?: string[],
    resolution_x?: string,
    resolution_y?: string,
    resolution_z?: string,
    crs?: string,
    f?: string
  ): string {
    if (!this.supported_query_types.corridor) {
      throw new Error('Collection does not support corridor queries');
    }

    const url = new URL(this.collection.data_queries?.corridor?.link.href);
    url.searchParams.set('coords', coords);
    url.searchParams.set('corridor-width', corridor_width.toString());
    url.searchParams.set('width-units', width_units);
    url.searchParams.set('corridor-height', corridor_height.toString());
    url.searchParams.set('height-units', height_units.toString());
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
    if (resolution_x !== undefined)
      url.searchParams.set('resolution-x', resolution_x);
    if (resolution_y !== undefined)
      url.searchParams.set('resolution-y', resolution_y);
    if (resolution_z !== undefined)
      url.searchParams.set('resolution-z', resolution_z);
    if (crs !== undefined) url.searchParams.set('crs', crs);
    if (f !== undefined) url.searchParams.set('f', f);
    return url.toString();
  }

  buildPositionDownloadUrl(
    coords: WellKnownTextString,
    z?: string,
    datetime?: DateTimeParameter,
    parameter_name?: string[],
    crs?: string,
    f?: string
  ): string {
    if (!this.supported_query_types.position) {
      throw new Error('Collection does not support position queries');
    }
    const url = new URL(this.collection.data_queries?.position?.link.href);
    url.searchParams.set('coords', coords);
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

  buildRadiusDownloadUrl(
    coords: WellKnownTextString,
    within: number,
    within_units: string,
    z?: string,
    datetime?: DateTimeParameter,
    parameter_name?: string[],
    crs?: string,
    f?: string
  ): string {
    if (!this.supported_query_types.radius) {
      throw new Error('Collection does not support radius queries');
    }
    const url = new URL(this.collection.data_queries?.radius?.link.href);
    url.searchParams.set('coords', coords);
    url.searchParams.set('within', within.toString());
    url.searchParams.set('within-units', within_units);
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
}
