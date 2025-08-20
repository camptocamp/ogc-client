import { DateTimeParameter } from '../../shared/models.js';
import { DataQueryType, OgcApiCollectionInfo } from '../model.js';
import { DateTimeParameterToEDRString } from './helpers.js';

type WellKnownTextString = string;

type bbox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type bboxWithVerticalAxis = bbox & {
  minZ: number;
  maxZ: number;
};

type optionalAreaParams = {
  parameter_name?: string[];
  z?: string;
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};

type optionalLocationParams = {
  locationId?: string;
  parameter_name?: string[];
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};

type optionalCubeParams = {
  parameter_name?: string[];
  z?: string;
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};

type optionalTrajectoryParams = {
  z?: string;
  datetime?: DateTimeParameter;
  parameter_name?: string[];
  crs?: string;
  f?: string;
};

type optionalCorridorParams = {
  z?: string;
  datetime?: DateTimeParameter;
  parameter_name?: string[];
  resolution_x?: string;
  resolution_y?: string;
  resolution_z?: string;
  crs?: string;
  f?: string;
};

type optionalPositionParams = {
  parameter_name?: string[];
  z?: string;
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};

type optionalRadiusParams = {
  parameter_name?: string[];
  z?: string;
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};

/** Builds EDR query URLs according to the OGC API EDR specification
 * https://docs.ogc.org/is/19-086r6/19-086r6.html
 */
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

  /**
   * Return the set of EDR queries supported by this collection
   */
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
    optional_params: optionalAreaParams = {}
  ): string {
    if (!this.supported_query_types.area) {
      throw new Error('Collection does not support area queries');
    }

    const url = new URL(this.collection.data_queries?.area?.link.href);

    url.searchParams.set('coords', coords);
    if (optional_params.z !== undefined)
      url.searchParams.set('z', optional_params.z);
    if (optional_params.datetime !== undefined)
      url.searchParams.set(
        'datetime',
        DateTimeParameterToEDRString(optional_params.datetime)
      );
    if (optional_params.parameter_name) {
      for (const param of optional_params.parameter_name) {
        if (!this.supported_params.has(param)) {
          throw new Error(
            `The following parameter name does not exist on this collection: '${param}'.`
          );
        }
      }

      url.searchParams.set(
        'parameter-name',
        optional_params.parameter_name.join(',')
      );
    }
    if (optional_params.crs !== undefined)
      url.searchParams.set('crs', optional_params.crs);
    if (optional_params.f !== undefined)
      url.searchParams.set('f', optional_params.f);
    return url.toString();
  }

  buildLocationsDownloadUrl(
    optional_params: optionalLocationParams = {}
  ): string {
    if (!this.supported_query_types.locations) {
      throw new Error('Collection does not support location queries');
    }

    const url = new URL(this.collection.data_queries?.locations?.link.href);
    if (optional_params.locationId !== undefined)
      url.searchParams.set('locationId', optional_params.locationId);

    if (optional_params.parameter_name !== undefined) {
      for (const parameter of optional_params.parameter_name) {
        if (!this.supported_params.has(parameter)) {
          throw new Error(
            `The following parameter name does not exist on this collection: '${parameter}'.`
          );
        }
      }
      url.searchParams.set(
        'parameter-name',
        optional_params.parameter_name.join(',')
      );
    }

    if (optional_params.datetime !== undefined)
      url.searchParams.set(
        'datetime',
        DateTimeParameterToEDRString(optional_params.datetime)
      );
    if (optional_params.crs !== undefined)
      url.searchParams.set('crs', optional_params.crs);
    if (optional_params.f !== undefined)
      url.searchParams.set('f', optional_params.f);
    return url.toString();
  }

  buildCubeDownloadUrl(
    bbox: bbox | bboxWithVerticalAxis,
    optional_params: optionalCubeParams = {}
  ): string {
    if (!this.supported_query_types.cube) {
      throw new Error('Collection does not support cube queries');
    }

    // make sure all bbox keys are defined
    for (const key in bbox) {
      if (bbox[key] === undefined || bbox[key] === null) {
        throw new Error('All bbox keys must be defined');
      }
    }

    if (bbox.minX > bbox.maxX) {
      throw new Error('minX must be less than or equal to maxX');
    }
    if (bbox.minY > bbox.maxY) {
      throw new Error('minY must be less than or equal to maxY');
    }
    if ('minZ' in bbox && 'maxZ' in bbox) {
      if (bbox.minZ > bbox.maxZ) {
        throw new Error('minZ must be less than or equal to maxZ');
      }
    }

    const url = new URL(this.collection.data_queries?.cube?.link.href);

    let bboxAsString: string;
    if ('minZ' in bbox && 'maxZ' in bbox) {
      bboxAsString = `${bbox.minX},${bbox.minY},${bbox.minZ},${bbox.maxX},${bbox.maxY},${bbox.maxZ}`;
    } else {
      bboxAsString = `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`;
    }

    url.searchParams.set('bbox', bboxAsString);
    if (optional_params.z !== undefined)
      url.searchParams.set('z', optional_params.z);
    if (optional_params.datetime !== undefined)
      url.searchParams.set(
        'datetime',
        DateTimeParameterToEDRString(optional_params.datetime)
      );
    if (optional_params.parameter_name) {
      for (const parameter of optional_params.parameter_name) {
        if (!this.supported_params.has(parameter)) {
          throw new Error(
            `The following parameter name does not exist on this collection: '${parameter}'.`
          );
        }
      }
      url.searchParams.set(
        'parameter-name',
        optional_params.parameter_name.join(',')
      );
    }
    if (optional_params.crs !== undefined)
      url.searchParams.set('crs', optional_params.crs);
    if (optional_params.f !== undefined)
      url.searchParams.set('f', optional_params.f);
    return url.toString();
  }

  buildTrajectoryDownloadUrl(
    coords: WellKnownTextString,
    optional_params: optionalTrajectoryParams = {}
  ): string {
    if (!this.supported_query_types.trajectory) {
      throw new Error('Collection does not support trajectory queries');
    }

    const url = new URL(this.collection.data_queries?.trajectory?.link.href);
    url.searchParams.set('coords', coords);
    if (optional_params.z !== undefined)
      url.searchParams.set('z', optional_params.z);
    if (optional_params.datetime !== undefined)
      url.searchParams.set(
        'datetime',
        DateTimeParameterToEDRString(optional_params.datetime)
      );
    if (optional_params.parameter_name) {
      for (const parameter of optional_params.parameter_name) {
        if (!this.supported_params.has(parameter)) {
          throw new Error(
            `The following parameter name does not exist on this collection: '${parameter}'.`
          );
        }
      }
      url.searchParams.set(
        'parameter-name',
        optional_params.parameter_name.join(',')
      );
    }
    if (optional_params.crs !== undefined)
      url.searchParams.set('crs', optional_params.crs);
    if (optional_params.f !== undefined)
      url.searchParams.set('f', optional_params.f);
    return url.toString();
  }

  buildCorridorDownloadUrl(
    coords: WellKnownTextString,
    corridor_width: number,
    width_units: string,
    corridor_height: number,
    height_units: number,
    optional_params: optionalCorridorParams = {}
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
    if (optional_params.z !== undefined)
      url.searchParams.set('z', optional_params.z);
    if (optional_params.datetime !== undefined)
      url.searchParams.set(
        'datetime',
        DateTimeParameterToEDRString(optional_params.datetime)
      );
    if (optional_params.parameter_name) {
      for (const parameter of optional_params.parameter_name) {
        if (!this.supported_params.has(parameter)) {
          throw new Error(
            `The following parameter name does not exist on this collection: '${parameter}'.`
          );
        }
      }
      url.searchParams.set(
        'parameter-name',
        optional_params.parameter_name.join(',')
      );
    }
    if (optional_params.resolution_x !== undefined)
      url.searchParams.set('resolution-x', optional_params.resolution_x);
    if (optional_params.resolution_y !== undefined)
      url.searchParams.set('resolution-y', optional_params.resolution_y);
    if (optional_params.resolution_z !== undefined)
      url.searchParams.set('resolution-z', optional_params.resolution_z);
    if (optional_params.crs !== undefined)
      url.searchParams.set('crs', optional_params.crs);
    if (optional_params.f !== undefined)
      url.searchParams.set('f', optional_params.f);
    return url.toString();
  }

  buildPositionDownloadUrl(
    coords: WellKnownTextString,
    optional_params: optionalPositionParams = {}
  ): string {
    if (!this.supported_query_types.position) {
      throw new Error('Collection does not support position queries');
    }
    const url = new URL(this.collection.data_queries?.position?.link.href);
    url.searchParams.set('coords', coords);
    if (optional_params.z !== undefined)
      url.searchParams.set('z', optional_params.z);
    if (optional_params.datetime !== undefined)
      url.searchParams.set(
        'datetime',
        DateTimeParameterToEDRString(optional_params.datetime)
      );
    if (optional_params.parameter_name) {
      for (const parameter of optional_params.parameter_name) {
        if (!this.supported_params.has(parameter)) {
          throw new Error(
            `The following parameter name does not exist on this collection: '${parameter}'.`
          );
        }
      }
      url.searchParams.set(
        'parameter-name',
        optional_params.parameter_name.join(',')
      );
    }
    if (optional_params.crs !== undefined)
      url.searchParams.set('crs', optional_params.crs);
    if (optional_params.f !== undefined)
      url.searchParams.set('f', optional_params.f);
    return url.toString();
  }

  buildRadiusDownloadUrl(
    coords: WellKnownTextString,
    within: number,
    within_units: string,
    optional_params: optionalRadiusParams = {}
  ): string {
    if (!this.supported_query_types.radius) {
      throw new Error('Collection does not support radius queries');
    }
    const url = new URL(this.collection.data_queries?.radius?.link.href);
    url.searchParams.set('coords', coords);
    url.searchParams.set('within', within.toString());
    url.searchParams.set('within-units', within_units);
    if (optional_params.z !== undefined)
      url.searchParams.set('z', optional_params.z);
    if (optional_params.datetime !== undefined)
      url.searchParams.set(
        'datetime',
        DateTimeParameterToEDRString(optional_params.datetime)
      );
    if (optional_params.parameter_name != null) {
      for (const parameter of optional_params.parameter_name) {
        if (!this.supported_params.has(parameter)) {
          throw new Error(
            `The following parameter name does not exist on this collection: '${parameter}'.`
          );
        }
      }
      url.searchParams.set(
        'parameter-name',
        optional_params.parameter_name.join(',')
      );
    }

    if (optional_params.crs !== undefined)
      url.searchParams.set('crs', optional_params.crs);
    if (optional_params.f !== undefined)
      url.searchParams.set('f', optional_params.f);
    return url.toString();
  }

  buildInstancesDownloadUrl(): string {
    return this.collection.data_queries?.instances?.link.href;
  }
}
