import {
  findChildrenElement,
  getElementAttribute,
  getRootElement,
} from '../shared/xml-utils.js';
import { XmlDocument } from '@rgrove/parse-xml';
import {
  FeatureGeometryType,
  FeaturePropertyType,
  WfsFeatureTypeFull,
  WfsFeatureTypeInternal,
  WfsVersion,
} from './model.js';

/**
 * Parses a DescribeFeatureType and GetFeature (with hits) document
 * This requires providing the base feature type object from the GetCapabilities document
 */
export function parseFeatureTypeInfo(
  featureType: WfsFeatureTypeInternal,
  describeFeatureTypeDoc: XmlDocument,
  getFeatureHitsDoc: XmlDocument,
  serviceVersion: WfsVersion
): WfsFeatureTypeFull {
  const {
    name,
    title,
    abstract,
    defaultCrs,
    otherCrs,
    outputFormats,
    latLonBoundingBox: boundingBox,
  } = featureType;

  const hitsAttr = serviceVersion.startsWith('2.0')
    ? 'numberMatched'
    : 'numberOfFeatures';
  const objectCount = parseInt(
    getElementAttribute(getRootElement(getFeatureHitsDoc), hitsAttr)
  );

  const complexTypeEl = findChildrenElement(
    getRootElement(describeFeatureTypeDoc),
    'complexType',
    true
  )[0];
  const typeElementsEls = findChildrenElement(complexTypeEl, 'element', true);
  const properties = typeElementsEls
    .filter((el) => getElementAttribute(el, 'type').startsWith('xsd:'))
    .reduce(
      (prev, curr) => ({
        ...prev,
        [getElementAttribute(curr, 'name')]: getTypeFromXsdType(
          getElementAttribute(curr, 'type')
        ),
      }),
      {}
    );

  const geomEl = typeElementsEls.filter((el) =>
    getElementAttribute(el, 'type').startsWith('gml:')
  )[0];
  const geometryName = geomEl ? getElementAttribute(geomEl, 'name') : undefined;
  const geometryType = geomEl
    ? getGeomTypeFromGmlType(getElementAttribute(geomEl, 'type'))
    : undefined;

  return {
    name,
    ...(title && { title }),
    ...(abstract && { abstract }),
    ...(boundingBox && { boundingBox }),
    ...(defaultCrs && { defaultCrs }),
    ...(otherCrs && { otherCrs }),
    ...(outputFormats && { outputFormats }),
    properties,
    ...(geometryName && { geometryName }),
    ...(geometryType && { geometryType }),
    ...(!Number.isNaN(objectCount) && { objectCount }),
  };
}

function getTypeFromXsdType(xsdType: string): FeaturePropertyType {
  const xsdTypeNoNamespace =
    xsdType.indexOf(':') > -1
      ? xsdType.substr(xsdType.indexOf(':') + 1)
      : xsdType;

  switch (xsdTypeNoNamespace) {
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'float':
    case 'double':
    case 'decimal':
      return 'float';
    case 'long':
    case 'byte':
    case 'integer':
    case 'int':
    case 'positiveInteger':
    case 'negativeInteger':
    case 'nonPositiveInteger':
    case 'nonNegativeInteger':
    case 'short':
    case 'unsignedLong':
    case 'unsignedInt':
    case 'unsignedShort':
    case 'unsignedByte':
      return 'integer';
    default:
      return 'string';
  }
}

function getGeomTypeFromGmlType(gmlType: string): FeatureGeometryType {
  const gmlTypeNoNamespace =
    gmlType.indexOf(':') > -1
      ? gmlType.substr(gmlType.indexOf(':') + 1)
      : gmlType;

  // these should cover types in GML2 to 3.2
  switch (gmlTypeNoNamespace) {
    case 'PointPropertyType':
      return 'point';
    case 'MultiPointPropertyType':
      return 'multipoint';
    case 'CurvePropertyType':
    case 'LineStringPropertyType':
      return 'linestring';
    case 'MultiCurvePropertyType':
    case 'MultiLineStringPropertyType':
      return 'linestring';
    case 'PolygonPropertyType':
    case 'SurfacePropertyType':
      return 'polygon';
    case 'MultiPolygonPropertyType':
    case 'MultiSurfacePropertyType':
      return 'multipolygon';
    default:
      return 'unknown';
  }
}
