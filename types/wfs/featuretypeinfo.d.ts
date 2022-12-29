/**
 * Parses a DescribeFeatureType and GetFeature (with hits) document
 * This requires providing the base feature type object from the GetCapabilities document
 * @param {WfsFeatureTypeInternal} featureType
 * @param {XmlDocument} describeFeatureTypeDoc
 * @param {XmlDocument} getFeatureHitsDoc
 * @param {WfsVersion} serviceVersion
 * @return {WfsFeatureTypeFull}
 */
export function parseFeatureTypeInfo(featureType: WfsFeatureTypeInternal, describeFeatureTypeDoc: XmlDocument, getFeatureHitsDoc: XmlDocument, serviceVersion: WfsVersion): WfsFeatureTypeFull;
