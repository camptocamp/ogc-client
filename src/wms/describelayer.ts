import { XmlDocument } from '@rgrove/parse-xml';
import {
  findChildElement,
  getElementAttribute,
  getElementText,
  getRootElement,
} from '../shared/xml-utils.js';
import { WmsLayerDescription } from './model.js';

/**
 * Parses a WMS DescribeLayer response document and returns the description
 * for the requested layer.
 * @param describeLayerDoc The parsed XML document from a DescribeLayer response
 * @param layerName The layer name to look for in the response
 * @return The layer description, or null if the layer was not found in the response
 */
export function parseDescribeLayerResponse(
  describeLayerDoc: XmlDocument,
  layerName: string,
): WmsLayerDescription | null {
  const root = getRootElement(describeLayerDoc);
  const match = findChildElement(root, 'LayerDescription');
  if (!match) return null;

  const owsType = getElementText(
    findChildElement(match, 'owsType'),
  ) as WmsLayerDescription['owsType'];
  const onlineResource = findChildElement(match, 'OnlineResource');
  const owsUrl = getElementAttribute(onlineResource, 'xlink:href');

  const typeNameEl = findChildElement(match, 'TypeName');
  const typeName =
    getElementText(findChildElement(typeNameEl, 'FeatureTypeName')) ||
    getElementText(findChildElement(typeNameEl, 'CoverageTypeName'));

  return {
    layerName,
    owsType,
    owsUrl,
    ...(typeName ? { typeName } : {}),
  };
}
