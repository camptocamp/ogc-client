import { DataQueryTypes } from '../ogc-common/common.js';
import { OgcEDRCollectionInfo } from './model.js';

export function parseDataQueries(doc: OgcEDRCollectionInfo): DataQueryTypes[] {
  const types: DataQueryTypes[] = [];

  if (!doc.data_queries) return types;

  for (const [key] of Object.entries(doc.data_queries)) {
    types.push(key as DataQueryTypes);
  }

  return types;
}
