import { DataQueryType, OgcApiCollectionInfo } from '../model.js';
import { DateTimeParameterToEDRString } from './helpers.js';
import {
  bboxWithVerticalAxis,
  bboxWithoutVerticalAxis,
  optionalAreaParams,
  optionalCorridorParams,
  optionalCubeParams,
  optionalLocationParams,
  optionalPositionParams,
  optionalRadiusParams,
  optionalTrajectoryParams,
  WellKnownTextString,
  zParameterToString,
} from './model.js';

/** Builds query URLs according to the OGC EDR specification
 * @see https://docs.ogc.org/is/19-086r6/19-086r6.html
 */
export default class EDRQueryBuilder {
  private supported_query_types: {
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

  /**
   * Build a position query which returns data for the requested coordinate.
   * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#_bbda46d4-04c5-426b-bea3-230d592fe1c2
   *
   * @param coords The coordinates are defined by a Point Well Known Text (WKT) string
   *
   * @param optional_params.z The vertical level to return data for (available options are defined in the vertical attribute of the extent section in the collections metadata response)
   * @param optional_params.datetime Datetime range to return data for (the available range is defined in the temporal attribute of the extent section in the collections metadata response)
   * @param optional_params.parameter_name List of parameter names (available options are listed in the parameter_names section of the collections metadata response)
   * @param optional_params.crs Coordinate reference system identifier for the coords values and output data (available options are listed in the collections metadata response)
   * @param optional_params.f Data format for the output data (available options are listed in the collections response), schemas describing JSON and XML outputs can be defined in the OpenAPI documentation (see https://swagger.io/docs/specification/data-models/)
   *
   * @returns A built position query URL
   */
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

  /**
   * Build a radius query which returns data within the defined radius of the requested coordinate
   * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#_fa3fccfc-df4b-43c0-9195-243d3594226e
   *
   * @param coords The coordinates are defined by a Point Well Known Text (WKT) string
   * @param within Defines radius of area around defined coordinates to include in the data selection
   * @param within_units Distance units for the within parameter (available options are defined in the within_units attribute of the radius data_query section in the collections metadata response)
   *
   * @param optional_params.z The vertical level to return data for (available options are defined in the vertical attribute of the extent section in the collections metadata response)
   * @param optional_params.datetime Datetime range to return data for (the available range is defined in the temporal attribute of the extent section in the collections metadata response)
   * @param parameter_name List of parameter names (available options are listed in the parameter_names section of the collections metadata response)
   * @param optional_params.crs Coordinate reference system identifier for the coords values and output data (available options are listed in the collections metadata response)
   * @param optional_params.f Data format for the output data (available options are listed in the collections response), schemas describing JSON and XML outputs can be defined in the OpenAPI documentation (see https://swagger.io/docs/specification/data-models/)
   *
   * @returns A built radius query URL
   */
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

  /**
   * Build an area query which returns data within the polygon defined by the coords parameter.
   * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#_c92d1888-dc80-454f-8452-e2f070b90dcd
   *
   * @param coords The coordinates are defined by a Polygon Well Known Text (WKT) string
   *
   * @param optional_params.parameter_name List of parameter names (available options are listed in the parameter_names section of the collections metadata response)
   * @param optional_params.datetime Datetime range to return data for (the available range is defined in the temporal attribute of the extent section in the collections metadata response)
   * @param optional_params.z The vertical level to return data for (available options are defined in the vertical attribute of the extent section in the collections metadata response)
   * @param optional_params.crs Coordinate reference system identifier for the coords values and output data (available options are listed in the collections metadata response)
   * @param optional_params.f Data format for the output data (available options are listed in the collections response), schemas describing JSON and XML outputs can be defined in the OpenAPI documentation (see https://swagger.io/docs/specification/data-models/)
   *
   * @returns the built area query URL
   */
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
      url.searchParams.set('z', zParameterToString(optional_params.z));
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

  /**
   * Build a cube query URL; cube queries are used to retrieve data from within a bounding box
   * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#_fe30ac95-7038-4dd1-902d-f4fcd2f31c8d
   * 
   * @param bbox The coordinates are defined by a BBOX string Only data that has a geometry that intersects the area defined by the bbox are selected.
    Lower left corner, coordinate axis 1
    Lower left corner, coordinate axis 2
    Upper right corner, coordinate axis 1
    Upper right corner, coordinate axis 2
    bbox=minx,miny,maxx,maxy
    The X and Y coordinates are values in the coordinate system defined by the crs query parameter. If crs is not defined, the values will be assumed to be WGS84 longitude/latitude coordinates and heights will be assumed to be in meters above mean sea level, or below for negative values.
   *
   * @param optional_params.z The vertical level to return data for (available options are defined in the vertical attribute of the extent section in the collections metadata response)
   * @param optional_params.datetime Datetime range to return data for (the available range is defined in the temporal attribute of the extent section in the collections metadata response)
   * @param optional_params.parameter_name List of parameter names (available options are listed in the parameter_names section of the collections metadata response)
   * @param optional_params.crs Coordinate reference system identifier for the coords values and output data (available options are listed in the collections metadata response)
   * @param optional_params.f Data format for the output data (available options are listed in the collections response), schemas describing JSON and XML outputs can be defined in the OpenAPI documentation (see https://swagger.io/docs/specification/data-models/)
   * 
   * @returns a built cube query URL
   */
  buildCubeDownloadUrl(
    bbox: bboxWithoutVerticalAxis | bboxWithVerticalAxis,
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
      url.searchParams.set('z', zParameterToString(optional_params.z));
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

  /**
   * Build a trajectory query URL that can be used to get data along the path defined by the coords parameter.
   * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#_5181b3c7-ada4-40d9-bcf0-4c890a6087f1
   * 
   * @param coords The coordinates are defined by one of the following Well Known Text (WKT) strings:
    LINESTRING
    LINESTRINGZ
    LINESTRINGM
    LINESTRINGZM
    The Z in LINESTRINGZ and LINESTRINGZM refers to the height value. If the specified CRS does not define the height units, the heights units will default to meters above mean sea level
    The M in LINESTRINGM and LINESTRINGZM refers to the number of seconds that have elapsed since the Unix epoch, that is the time 00:00:00 UTC on 1 January 1970. See https://en.wikipedia.org/wiki/Unix_time
   *
   * @param optional_params.z The vertical level to return data for (available options are defined in the vertical attribute of the extent section in the collections metadata response)
   * @param optional_params.datetime Datetime range to return data for (the available range is defined in the temporal attribute of the extent section in the collections metadata response)
   * @param optional_params.parameter_name List of parameter names (available options are listed in the parameter_names section of the collections metadata response)
   * @param optional_params.crs Coordinate reference system identifier for the coords values and output data (available options are listed in the collections metadata response)
   * @param optional_params.f Data format for the output data (available options are listed in the collections response), schemas describing JSON and XML outputs can be defined in the OpenAPI documentation (see https://swagger.io/docs/specification/data-models/)
   * 
   * @returns a built trajectory query URL
   */
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
      url.searchParams.set('z', zParameterToString(optional_params.z));
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

  /**
   * Build a corridor query which returns data along and around the path defined by the coords parameter.
   * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#_e6b32ddf-d053-46ad-b5fd-c4daec62f4bb
   * 
   * @param coords The coordinates are defined by one of the following Well Known Text (WKT) strings:
    LINESTRING
    LINESTRINGZ
    LINESTRINGM
    LINESTRINGZM
    The Z in LINESTRINGZ and LINESTRINGZM refers to the height value. If the specified CRS does not define the height units, the height units will default to meters above mean sea level
    The M in LINESTRINGM and LINESTRINGZM refers to the number of seconds that have elapsed since the Unix epoch, that is the time 00:00:00 UTC on 1 January 1970. See https://en.wikipedia.org/wiki/Unix_time
   * @param corridor_width The width value represents the whole width of the corridor where the trajectory supplied in the coords query parameter is the center point of the corridor
   * @param width_units Distance units for the corridor-width parameter (available options are defined in the width_units attribute of the corridor data_query section in the collections metadata response)
   * @param corridor_height The height value represents the whole height of the corridor where the trajectory supplied in the coords query parameter is the center point of the corridor
   * @param height_units Distance units for the corridor-height parameter (available options are defined in the height_units attribute of the corridor data_query section in the collections metadata response)
   * 
   * @param optional_params.z The vertical level to return data for (available options are defined in the vertical attribute of the extent section in the collections metadata response)
   * @param optional_params.datetime Datetime range to return data for (the available range is defined in the temporal attribute of the extent section in the collections metadata response)
   * @param optional_params.parameter_name List of parameter names (available options are listed in the parameter_names section of the collections metadata response)
   * @param optional_params.resolution_x Defined if the user requires data at a different resolution from the native resolution of the data along the x-axis, it denotes the number of intervals to retrieve data for along the x-axis
   * @param optional_params.resolution_y Defined if the user requires data at a different resolution from the native resolution of the data along the y-axis, it denotes the number of intervals to retrieve data for along the y-axis
   * @param optional_params.resolution_z No	Defined if the user requires data at a different resolution from the native resolution of the data along the z-axis, it denotes the number of intervals to retrieve data for along the z-axis
   * @param optional_params.crs coordinate reference system identifier for the coords values and output data (available options are listed in the collections metadata response)
   * @param optional_params.f Data format for the output data (available options are listed in the collections response), schemas describing JSON and XML outputs can be defined in the OpenAPI documentation (see https://swagger.io/docs/specification/data-models/)
   * 
   * @returns A built corridor query URL
   */
  buildCorridorDownloadUrl(
    coords: WellKnownTextString,
    corridor_width: number,
    width_units: string,
    corridor_height: number,
    height_units: string,
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
      url.searchParams.set('z', zParameterToString(optional_params.z));
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

  /**
   * Build a Locations query which returns data for the named location.
   * If a location id is not defined the API SHALL return a GeoJSON features array of valid location identifiers,
   * the schema of the GeoJSON response SHOULD be defined in the OpenAPI definition of the EDR service.
   * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#_60c4d31c-62f2-4dc7-9a3e-6a1a9127d29e
   *
   * @param optional_params.locationId A unique identifier for the required location, such as a GeoHash, a World Meteorological Organization (WMO) station identifier or place name.
   * @param optional_params.datetime Datetime range to return data for (the available range is defined in the temporal attribute of the extent section in the collections metadata response)
   * @param optional_params.parameter_name List of parameter names (available options are listed in the parameter_names section of the collections metadata response)
   * @param optional_params.crs Coordinate reference system identifier for the coords values and output data (available options are listed in the collections metadata response)
   * @param optional_params.f Data format for the output data (available options are listed in the collections response), schemas describing JSON and XML outputs can be defined in the OpenAPI documentation (see https://swagger.io/docs/specification/data-models/)
   *
   * @returns A built locations query URL
   */
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

  /**
   * Having multiple versions or instances of the same collection, where the same information is reprocessed or regenerated is not unusal.
   * Although these versions could be described as new collections,
   * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#_5bd2378d-8c59-4516-949e-22db29b30170
   * @returns The instances query URL
   */
  buildInstancesDownloadUrl(): string {
    return this.collection.data_queries?.instances?.link.href;
  }
}
