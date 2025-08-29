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

/**
 * Type definition for the `z` query parameter in OGC EDR
 *
 * Statement A: If the z parameter is provided, only resources that have a vertical geometry that intersects the vertical information in the z parameter SHALL be part of the result set.
 * Statement B: The z can be defined as a height range by specifying a min-level and max-level separated by a forward slash “/”
 * Statement C: A list of z can be defined be specifying a comma delimited list of values level1, level2, level3 etc
 * Statement	D: An Arithmetic sequence using Recurring height intervals can be specified by Rnumber of intervals/min height/height interval
 * Statement	E: If the z parameter is not provided, the server SHOULD return data at all available vertical levels
 *
 * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#req_edr_z-definition
 * @see https://docs.ogc.org/is/19-086r6/19-086r6.html#req_edr_z-response
 */
export type ZParameter =
  // Statement A:If the z parameter is provided, only resources that have a vertical geometry that intersects the vertical information in the z parameter SHALL be part of the result set.
  | { type: 'single'; level: number }
  // Statement B: The z can be defined as a height range by specifying a min-level and max-level separated by a forward slash “/”
  | { type: 'interval'; minLevel: number; maxLevel: number }
  // Statement C: A list of z can be defined be specifying a comma delimited list of values level1, level2, level3 etc
  | { type: 'list'; levels: number[] }
  // Statement D: An Arithmetic sequence using Recurring height intervals can be specified by Rnumber of intervals/min height/height interval
  | { type: 'repeating'; repeat: number; minLevel: number; step: number };

/**
 * Convert a structured ZParameter into its string representation.
 */
export function zParameterToString(z: ZParameter): string {
  switch (z.type) {
    case 'single':
      return `${z.level}`;

    case 'interval':
      return `${z.minLevel}/${z.maxLevel}`;

    case 'list':
      return z.levels.join(',');

    case 'repeating':
      return `R${z.repeat}/${z.minLevel}/${z.step}`;
  }
}

export type optionalAreaParams = {
  parameter_name?: string[];
  z?: ZParameter;
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
  z?: ZParameter;
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};

export type optionalTrajectoryParams = {
  z?: ZParameter;
  datetime?: DateTimeParameter;
  parameter_name?: string[];
  crs?: string;
  f?: string;
};

export type optionalCorridorParams = {
  z?: ZParameter;
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
  z?: ZParameter;
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};

export type optionalRadiusParams = {
  parameter_name?: string[];
  z?: ZParameter;
  datetime?: DateTimeParameter;
  crs?: string;
  f?: string;
};
