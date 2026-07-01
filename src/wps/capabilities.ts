import { XmlDocument, XmlElement } from '@rgrove/parse-xml';
import { readProviderFromCapabilities } from '../shared/ows.js';
import {
  findChildElement,
  findChildrenElement,
  getChildrenElement,
  getElementAttribute,
  getElementName,
  getElementText,
  getRootElement,
  stripNamespace,
} from '../shared/xml-utils.js';
import { type OperationName, type OperationUrl } from '../shared/models.js';
import { WpsEndpointInfo, WpsProcessSummary, WpsVersion } from './model.js';

/**
 * Will read a WPS version from the capabilities doc
 * @param capabilitiesDoc Capabilities document
 * @return The parsed WPS version, or null if no version could be found
 */
export function readVersionFromCapabilities(
  capabilitiesDoc: XmlDocument
): WpsVersion {
  return getRootElement(capabilitiesDoc).attributes['version'] as WpsVersion;
}

/**
 * Will read all operation URLs from the capabilities doc; WPS relies on the
 * OWS 1.1 `OperationsMetadata` section, like WFS 1.1/2.0.
 * @param capabilitiesDoc Capabilities document
 * @return The parsed operations URLs
 */
export function readOperationUrlsFromCapabilities(
  capabilitiesDoc: XmlDocument
): Record<OperationName, OperationUrl> {
  const urls: Record<OperationName, OperationUrl> = {};
  const operationsMetadata = findChildElement(
    getRootElement(capabilitiesDoc),
    'OperationsMetadata'
  );
  findChildrenElement(operationsMetadata, 'Operation').forEach((operation) => {
    const name = getElementAttribute(operation, 'name');
    urls[name] = parseOperation(operation);
  });
  return urls;
}

/**
 * Will read all processes advertised in the capabilities doc
 * @param capabilitiesDoc Capabilities document
 * @return Parsed process summaries
 */
export function readProcessesFromCapabilities(
  capabilitiesDoc: XmlDocument
): WpsProcessSummary[] {
  const processOfferings = findChildElement(
    getRootElement(capabilitiesDoc),
    'ProcessOfferings'
  );
  return findChildrenElement(processOfferings, 'Process').map((processEl) => {
    const abstract = getElementText(findChildElement(processEl, 'Abstract'));
    const processVersion = getElementAttribute(processEl, 'wps:processVersion');
    return {
      identifier: getElementText(findChildElement(processEl, 'Identifier')),
      title: getElementText(findChildElement(processEl, 'Title')),
      ...(abstract && { abstract }),
      ...(processVersion && { processVersion }),
    };
  });
}

/**
 * Will read service-related info from the capabilities doc
 * @param capabilitiesDoc Capabilities document
 * @return Parsed service info
 */
export function readInfoFromCapabilities(
  capabilitiesDoc: XmlDocument
): WpsEndpointInfo {
  const service = findChildElement(
    getRootElement(capabilitiesDoc),
    'ServiceIdentification'
  );
  const keywords = findChildrenElement(
    findChildElement(service, 'Keywords'),
    'Keyword'
  )
    .map(getElementText)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return {
    title: getElementText(findChildElement(service, 'Title')),
    name: getElementText(findChildElement(service, 'ServiceType')),
    abstract: getElementText(findChildElement(service, 'Abstract')),
    fees: getElementText(findChildElement(service, 'Fees')),
    constraints: getElementText(findChildElement(service, 'AccessConstraints')),
    provider: readProviderFromCapabilities(capabilitiesDoc),
    keywords,
  };
}

/**
 * Parse an OWS operation definition (e.g. Execute) into its method URLs
 * @param operation Operation element
 */
function parseOperation(operation: XmlElement): OperationUrl {
  const urls: OperationUrl = {};
  const dcp = findChildrenElement(operation, 'DCP');
  const http = dcp.flatMap((d) => findChildElement(d, 'HTTP'));
  const methods = http.flatMap((h) => getChildrenElement(h));
  methods.forEach((method) => {
    const methodName = stripNamespace(getElementName(method));
    urls[methodName] = getElementAttribute(method, 'xlink:href');
  });
  return urls;
}
