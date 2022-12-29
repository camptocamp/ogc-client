/**
 * Returns an array of features with their id and properties
 * @param {XmlDocument} getFeaturesDoc
 * @param {WfsFeatureTypeFull} featureTypeFull
 * @param {WfsVersion} serviceVersion
 * @return {WfsFeatureWithProps[]}
 */
export function parseFeatureProps(getFeaturesDoc: XmlDocument, featureTypeFull: WfsFeatureTypeFull, serviceVersion: WfsVersion): WfsFeatureWithProps[];
/**
 * Returns an array of features with their id and properties
 * @param {Object} getFeaturesGeojson
 * @return {WfsFeatureWithProps[]}
 */
export function parseFeaturePropsGeojson(getFeaturesGeojson: any): WfsFeatureWithProps[];
/**
 * Returns details regarding the features prop values
 * @param {WfsFeatureWithProps[]} featuresWithProps
 * @return {WfsFeatureTypePropsDetails}
 */
export function computeFeaturePropsDetails(featuresWithProps: WfsFeatureWithProps[]): WfsFeatureTypePropsDetails;
