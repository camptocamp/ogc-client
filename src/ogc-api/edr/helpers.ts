import { DateTimeParameter } from "../../shared/models.js";

export function DateTimeParameterToEDRString(param: DateTimeParameter): string {
  const format = (d: Date) => d.toISOString();

  if (param instanceof Date) {
    return format(param);
  }

  if ('start' in param && 'end' in param) {
    return `${format(param.start)}/${format(param.end)}`;
  }

  if ('start' in param) {
    return `${format(param.start)}/..`;
  }

  if ('end' in param) {
    return `../${format(param.end)}`;
  }

  throw new Error('Invalid DateTimeParameter');
}
