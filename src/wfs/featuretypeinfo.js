import {
  findChildrenElement,
  getElementAttribute,
  getRootElement,
} from '../shared/xml-utils';

/**
 * Parses a DescribeFeatureType and GetFeature (with hits) document
 * This requires providing the base feature type object from the GetCapabilities document
 * @param {WfsFeatureType} featureType
 * @param {XmlDocument} describeFeatureTypeDoc
 * @param {XmlDocument} getFeatureHitsDoc
 * @param {WfsVersion} serviceVersion
 * @return {FeatureTypeInfo}
 */
export function parseFeatureTypeInfo(
  featureType,
  describeFeatureTypeDoc,
  getFeatureHitsDoc,
  serviceVersion
) {
  const { name, title, abstract, latLonBoundingBox: boundingBox } = featureType;

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
    properties,
    ...(geometryName && { geometryName }),
    ...(geometryType && { geometryType }),
    ...(!Number.isNaN(objectCount) && { objectCount }),
  };
}

/**
 * @param {string} xsdType
 * @return {FeaturePropertyType}
 */
function getTypeFromXsdType(xsdType) {
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

/**
 * @param {string} gmlType
 * @return {FeatureGeometryType}
 */
function getGeomTypeFromGmlType(gmlType) {
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
