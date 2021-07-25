import {
  findChildElement,
  findChildrenElement,
  getChildrenElement,
  getElementAttribute,
  getElementName,
  getElementText,
  getRootElement,
  stripNamespace,
} from '../shared/xml-utils';

/**
 * Returns an array of features with their id and properties
 * @param {XmlDocument} getFeaturesDoc
 * @param {WfsFeatureTypeFull} featureTypeFull
 * @param {WfsVersion} serviceVersion
 * @return {WfsFeatureWithProps[]}
 */
export function parseFeatureProps(
  getFeaturesDoc,
  featureTypeFull,
  serviceVersion
) {
  const collection = getRootElement(getFeaturesDoc);
  let members;
  if (serviceVersion.startsWith('2.0')) {
    members = findChildrenElement(collection, 'member').map(
      (parent) => getChildrenElement(parent)[0]
    );
  } else {
    const membersRoot = findChildElement(collection, 'featureMembers');
    members = membersRoot
      ? getChildrenElement(membersRoot)
      : findChildrenElement(collection, 'featureMember').map(
          (parent) => getChildrenElement(parent)[0]
        );
  }
  const idAttr = serviceVersion === '1.0.0' ? 'fid' : 'gml:id';

  function isElementProperty(propName) {
    return propName in featureTypeFull.properties;
  }

  function parseElementPropertyValue(propName, valueAsString) {
    const type = featureTypeFull.properties[propName];
    switch (type) {
      case 'integer':
        return parseInt(valueAsString);
      case 'float':
        return parseFloat(valueAsString);
      case 'boolean':
        return valueAsString === 'true';
      default:
        return valueAsString;
    }
  }

  function getProperties(memberEl) {
    return getChildrenElement(memberEl)
      .filter((el) => isElementProperty(stripNamespace(getElementName(el))))
      .reduce((prev, curr) => {
        const propName = stripNamespace(getElementName(curr));
        return {
          ...prev,
          [propName]: parseElementPropertyValue(propName, getElementText(curr)),
        };
      }, {});
  }

  return members.map((el) => ({
    id: getElementAttribute(el, idAttr),
    properties: getProperties(el),
  }));
}

/**
 * Returns an array of features with their id and properties
 * @param {Object} getFeaturesGeojson
 * @return {WfsFeatureWithProps[]}
 */
export function parseFeaturePropsGeojson(getFeaturesGeojson) {
  if (
    !('features' in getFeaturesGeojson) ||
    !Array.isArray(getFeaturesGeojson.features)
  ) {
    throw new Error('Geojson object is apparently not a FeatureCollection');
  }
  return getFeaturesGeojson.features.map((feature) => ({
    id: feature.id,
    properties: { ...feature.properties },
  }));
}

/**
 * Returns details regarding the features prop values
 * @param {WfsFeatureWithProps[]} featuresWithProps
 * @return {Object.<string, WfsFeatureTypePropDetails>}
 */
export function computeFeaturePropsDetails(featuresWithProps) {
  return featuresWithProps.reduce((prev, curr) => {
    for (const propName in curr.properties) {
      const propValue = curr.properties[propName];
      if (!(propName in prev)) {
        prev[propName] = { uniqueValues: [] };
      }
      const uniqueValue = prev[propName].uniqueValues.find(
        (v) => v.value === propValue
      );
      if (uniqueValue) uniqueValue.count++;
      else prev[propName].uniqueValues.push({ value: propValue, count: 1 });
    }
    return prev;
  }, {});
}
