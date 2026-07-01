import { setQueryParams } from '../shared/http-utils.js';
import { WpsVersion } from './model.js';

/**
 * Generates an URL for a DescribeProcess operation
 * @param serviceUrl
 * @param version
 * @param processId Process identifier to describe
 */
export function generateDescribeProcessUrl(
  serviceUrl: string,
  version: WpsVersion,
  processId: string
): string {
  return setQueryParams(serviceUrl, {
    SERVICE: 'WPS',
    REQUEST: 'DescribeProcess',
    VERSION: version,
    IDENTIFIER: processId,
  });
}

/**
 * Generates an URL for an Execute operation (KVP fallback; the primary path is
 * a POST XML request, see `buildExecuteRequest`).
 * @param serviceUrl
 * @param version
 * @param processId Process identifier to execute
 */
export function generateExecuteUrl(
  serviceUrl: string,
  version: WpsVersion,
  processId: string
): string {
  return setQueryParams(serviceUrl, {
    SERVICE: 'WPS',
    REQUEST: 'Execute',
    VERSION: version,
    IDENTIFIER: processId,
  });
}
