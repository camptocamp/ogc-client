import { DateTimeParameter } from '../../shared/models.js';

/**
 * A Well Known Text (WKT) string
 * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#req_edr_coords-definition
 */
export type WellKnownTextString = string;

/**
 * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#_e523d01c-5768-4591-8634-976215cbfce3
 */
export type bboxWithoutVerticalAxis = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/**
 * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#_e523d01c-5768-4591-8634-976215cbfce3
 */
export type bboxWithVerticalAxis = bboxWithoutVerticalAxis & {
  minZ: number;
  maxZ: number;
};

export type optionalAreaParams = {
  parameter_name?: string[];
  z?: string;
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};

export type optionalLocationParams = {
  locationId?: string;
  parameter_name?: string[];
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};

export type optionalCubeParams = {
  parameter_name?: string[];
  z?: string;
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};

export type optionalTrajectoryParams = {
  z?: string;
  datetime?: DateTimeParameter;
  parameter_name?: string[];
  crs?: string;
  f?: string;
};

export type optionalCorridorParams = {
  z?: string;
  datetime?: DateTimeParameter;
  parameter_name?: string[];
  resolution_x?: string;
  resolution_y?: string;
  resolution_z?: string;
  crs?: string;
  f?: string;
};

export type optionalPositionParams = {
  parameter_name?: string[];
  z?: string;
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};

export type optionalRadiusParams = {
  parameter_name?: string[];
  z?: string;
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};
