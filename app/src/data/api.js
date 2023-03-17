const API = {
  exports: [
    {
      name: 'WfsEndpoint',
      type: 'Class',
      constructor: {
        params: [{ name: 'url', type: 'string' }],
        description: `Creates a new WFS endpoint; wait for the \`isReady()\` promise before using the endpoint methods.`,
      },
      methods: [
        {
          name: 'isReady',
          description: `Resolves when the endpoint is ready to use. Returns the same endpoint object for convenience.`,
          params: [],
          return: { type: 'Promise', subType: 'WfsEndpoint' },
        },
        {
          name: 'getServiceInfo',
          description: `Returns the service info.`,
          params: [],
          return: { type: 'GenericEndpointInfo' },
        },
        {
          name: 'getVersion',
          description: `Returns the highest protocol version that this WFS endpoint supports.
Note that if the url used for initialization does specify a version (e.g. \`1.0.0\`,
this version will most likely be used instead of the highest supported one.`,
          params: [],
          return: { type: 'string', values: ['1.0.0', '1.1.0', '2.0.0'] },
        },
        {
          name: 'getFeatureTypes',
          description: `Returns the available feature types.`,
          params: [],
          return: { type: 'Array', subType: 'WfsFeatureTypeBrief' },
        },
        {
          name: 'getFeatureTypeSummary',
          description: `Returns the feature type in summary format. If a namespace is specified in the name,
this will be used for matching; otherwise, matching will be done without taking namespaces into account.`,
          params: [{ name: 'featureType', type: 'string' }],
          return: { type: 'WfsFeatureTypeSummary' },
        },
        {
          name: 'getFeatureTypeFull',
          description: `Returns a promise that will resolve with the full feature type description,
including properties with their types, geometry field and total object count.`,
          params: [{ name: 'featureType', type: 'string' }],
          return: { type: 'Promise', subType: 'WfsFeatureTypeFull' },
        },
        {
          name: 'getFeatureTypePropDetails',
          description: `Returns a promise that will resolve with details on each of the feature type properties;
for now, this consists of a list of unique values in the whole dataset.`,
          params: [{ name: 'featureType', type: 'string' }],
          return: { type: 'Promise', subType: 'WfsFeatureTypePropDetails' },
        },
        {
          name: 'supportsJson',
          description: `Returns true if the endpoint is able to output the specified feature type as GeoJSON.`,
          params: [{ name: 'featureType', type: 'string' }],
          return: { type: 'boolean' },
        },
        {
          name: 'getFeatureUrl',
          description: `Returns a URL that can be used to query features from this feature type.`,
          params: [
            { name: 'featureType', type: 'string' },
            { name: 'options', type: 'GetFeatureUrlOptions' },
          ],
          return: { type: 'string' },
        },
      ],
    },
    {
      name: 'WmsEndpoint',
      type: 'Class',
      constructor: {
        params: [{ name: 'url', type: 'string' }],
        description: `Creates a new WMS endpoint; wait for the \`isReady()\` promise before using the endpoint methods.`,
      },
      methods: [
        {
          name: 'isReady',
          description: `Resolves when the endpoint is ready to use. Returns the same endpoint object for convenience.`,
          params: [],
          return: { type: 'Promise', subType: 'WmsEndpoint' },
        },
        {
          name: 'getServiceInfo',
          description: `Returns the service info.`,
          params: [],
          return: { type: 'GenericEndpointInfo' },
        },
        {
          name: 'getVersion',
          description: `Returns the highest protocol version that this WMS endpoint supports.
Note that if the url used for initialization does specify a version (e.g. \`1.1.0\`,
this version will most likely be used instead of the highest supported one.`,
          params: [],
          return: { type: 'string', values: ['1.1.0', '1.1.1', '1.3.0'] },
        },
        {
          name: 'getLayers',
          description: `Returns the layers advertised in the endpoint. Note that WMS layers are organized
in a tree structure, so some layers may have children layers as well`,
          params: [],
          return: { type: 'Array', subType: 'WmsLayerSummary' },
        },
        {
          name: 'getLayerByName',
          description: `Returns the full layer information, including supported coordinate systems,
available layers, bounding boxes etc. Layer name is case sensitive.`,
          params: [{ name: 'layerName', type: 'string' }],
          return: { type: 'WmsLayerFull' },
        },
      ],
    },
    {
      name: 'OgcApiEndpoint',
      type: 'Class',
      constructor: {
        params: [{ name: 'url', type: 'string' }],
        description: `Creates a new OGC API endpoint.`,
      },
      properties: [
        {
          name: 'info',
          description: `A Promise which resolves to the endpoint info.`,
          type: 'Promise',
          subType: 'OgcApiEndpointInfo',
        },
        {
          name: 'conformanceClasses',
          description: `A Promise which resolves to an array of conformance classes.`,
          type: 'Promise',
          subType: {
            type: 'Array',
            subType: 'string',
          },
        },
        {
          name: 'allCollections',
          description: `A Promise which resolves to an array of all collection identifiers as strings.`,
          type: 'Promise',
          subType: {
            type: 'Array',
            subType: 'string',
          },
        },
        {
          name: 'recordCollections',
          description: `A Promise which resolves to an array of records collection identifiers as strings.`,
          type: 'Promise',
          subType: {
            type: 'Array',
            subType: 'string',
          },
        },
        {
          name: 'featureCollections',
          description: `A Promise which resolves to an array of feature collection identifiers as strings.`,
          type: 'Promise',
          subType: {
            type: 'Array',
            subType: 'string',
          },
        },
        {
          name: 'hasTiles',
          description: `A Promise which resolves to a boolean indicating whether the endpoint offer tiles.`,
          type: 'Promise',
          subType: 'boolean',
        },
        {
          name: 'hasStyles',
          description: `A Promise which resolves to a boolean indicating whether the endpoint offer styles.`,
          type: 'Promise',
          subType: 'boolean',
        },
        {
          name: 'hasFeatures',
          description: `A Promise which resolves to a boolean indicating whether the endpoint offer feature collections.`,
          type: 'Promise',
          subType: 'boolean',
        },
        {
          name: 'hasRecords',
          description: `A Promise which resolves to a boolean indicating whether the endpoint offer record collections.`,
          type: 'Promise',
          subType: 'boolean',
        },
      ],
      methods: [
        {
          name: 'getCollectionInfo',
          description: `Returns a promise resolving to a document describing the specified collection.`,
          params: [{ name: 'collectionId', type: 'string' }],
          return: { type: 'Promise', subType: 'OgcApiCollectionInfo' },
        },
        {
          name: 'getCollectionItems',
          description: `Returns a promise resolving to an array of items from a collection with the given query parameters.`,
          params: [
            { name: 'collectionId', type: 'string' },
            { name: 'limit', type: 'number', default: 10 },
            { name: 'offset', type: 'number', default: 0 },
            { name: 'skipGeometry', type: 'boolean', optional: true },
            {
              name: 'sortby',
              type: 'Array',
              subType: 'string',
              optional: true,
            },
            {
              name: 'bbox',
              type: '[number, number, number, number]',
              optional: true,
            },
            {
              name: 'properties',
              type: 'Array',
              subType: 'string',
              optional: true,
            },
          ],
          return: {
            type: 'Promise',
            subType: {
              type: 'Array',
              subType: 'OgcApiCollectionItem',
            },
          },
        },
        {
          name: 'getCollectionItem',
          description: `Returns a promise resolving to a specific item from a collection.`,
          params: [
            { name: 'collectionId', type: 'string' },
            { name: 'itemId', type: 'string' },
          ],
          return: { type: 'Promise', subType: 'OgcApiCollectionItem' },
        },
      ],
    },
    {
      name: 'useCache',
      type: 'Function',
      description: `Will run the provided function and resolve to its return value.
The function return value will also be stored in cache, meaning that subsequent runs will **not** execute the function but
simply return the cached value. \`keys\` are an indeterminate amount of string tokens that are used to uniquely identify the operation.

Cached values are kept for one hour. Each call to \`useCache\` will first loop on the currently cached values and
clear the ones that have expired to make sure that the cache storage does not grow indefinitely.

Also note that if \`useCache\` is called several times with the same key without the first one having returned yet, all subsequent calls
will **not** trigger additional operations but simply resolve at the same time as the first one.

Cache is kept using the [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache), which has virtually no size limit.
Cache entries might be removed by the browser without notice. The identifying key for the cache entries is \`ogc-client\`.`,
      params: [
        { name: 'process', type: 'AsyncFunction', params: [], subType: 'any' },
        { name: '...keys', type: 'Array', subType: 'string' },
      ],
      return: { type: 'Promise', subType: 'any' },
    },
    {
      name: 'sharedFetch',
      type: 'Function',
      description: `Returns a promise equivalent to \`fetch(url)\` but guarded against identical concurrent requests.
Requests are considered identical if they share the _exact_ same url and method.`,
      params: [
        { name: 'url', type: 'string' },
        { name: 'method', type: `'GET' | 'HEAD'` },
      ],
      return: { type: 'Promise', subType: 'Response' },
    },
  ],
  types: [
    {
      name: 'GenericEndpointInfo',
      type: 'Object',
      properties: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'title' },
        { type: 'string', name: 'abstract' },
        { type: 'string', name: 'fees' },
        { type: 'string', name: 'constraints' },
        { type: 'Array', subType: 'string', name: 'keywords' },
        {
          type: 'Array',
          subType: 'string',
          name: 'outputFormats',
          optional: true,
        },
      ],
    },
    {
      name: 'WfsFeatureTypeBrief',
      type: 'Object',
      properties: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'title', optional: true },
        { type: 'string', name: 'abstract', optional: true },
        {
          type: 'BoundingBox',
          name: 'boundingBox',
          optional: true,
        },
      ],
    },
    {
      name: 'WfsFeatureTypeSummary',
      type: 'Object',
      properties: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'title', optional: true },
        { type: 'string', name: 'abstract', optional: true },
        {
          type: 'BoundingBox',
          name: 'boundingBox',
          optional: true,
        },
        { type: 'CrsCode', name: 'defaultCrs' },
        { type: 'Array', subtype: 'CrsCode', name: 'otherCrs' },
        { type: 'Array', subtype: 'string', name: 'outputFormats' },
      ],
    },
    {
      name: 'WfsFeatureTypeFull',
      type: 'Object',
      properties: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'title', optional: true },
        { type: 'string', name: 'abstract', optional: true },
        {
          type: 'BoundingBox',
          name: 'boundingBox',
          optional: true,
        },
        { type: 'CrsCode', name: 'defaultCrs' },
        { type: 'Array', subtype: 'CrsCode', name: 'otherCrs' },
        { type: 'Array', subtype: 'string', name: 'outputFormats' },
        {
          type: 'Map',
          subType: 'FeaturePropertyType',
          name: 'properties',
          description:
            'These properties will _not_ include the feature geometry',
        },
        {
          type: 'string',
          name: 'geometryName',
          description: 'Not defined if no geometry present',
          optional: true,
        },
        {
          type: 'FeatureGeometryType',
          name: 'geometryType',
          description: 'Not defined if no geometry present',
          optional: true,
        },
        {
          type: 'number',
          name: 'objectCount',
          description: 'Not defined if object count could not be determined',
          optional: true,
        },
      ],
    },
    {
      name: 'WfsFeatureTypePropDetails',
      type: 'Object',
      properties: [
        {
          name: 'uniqueValues',
          type: 'Array',
          subType: 'WfsFeatureTypeUniqueValue',
        },
      ],
    },
    {
      name: 'WfsFeatureTypeUniqueValue',
      type: 'Object',
      properties: [
        {
          type: 'number',
          name: 'count',
          description: 'Number of occurrences of this value in the dataset',
        },
        {
          type: 'Union',
          subTypes: ['number', 'boolean', 'string'],
          name: 'value',
        },
      ],
    },
    {
      name: 'GetFeatureUrlOptions',
      type: 'Object',
      properties: [
        {
          type: 'number',
          name: 'maxFeatures',
          description: 'All objects will be returned if undefined',
        },
        {
          type: 'boolean',
          name: 'asJson',
          description:
            'If `true`, will ask for GeoJSON; will throw if the service does not support it',
        },
        {
          type: 'MimeType',
          name: 'outputFormat',
          description: 'A supported output format (overridden by `asJson`)',
        },
        {
          type: 'CrsCode',
          name: 'outputCrs',
          description:
            'If unspecified, this will be the data native projection',
        },
        {
          type: 'BoundingBox',
          name: 'extent',
          description: 'An extent to restrict returned objects',
        },
        {
          type: 'CrsCode',
          name: 'extentCrs',
          description:
            'If unspecified, `extent` should be in the data native projection',
        },
      ],
    },
    {
      name: 'WmsLayerSummary',
      type: 'Object',
      properties: [
        {
          type: 'string',
          name: 'name',
          description: 'The layer is renderable if defined',
          optional: true,
        },
        { type: 'string', name: 'title' },
        { type: 'string', name: 'abstract' },
        {
          type: 'Array',
          subType: 'WmsLayerFull',
          name: 'children',
          description: 'Not defined if the layer is a leaf in the tree',
          optional: true,
        },
      ],
    },
    {
      name: 'WmsLayerFull',
      type: 'Object',
      properties: [
        {
          type: 'string',
          name: 'name',
          description: 'The layer is renderable if defined',
          optional: true,
        },
        { type: 'string', name: 'title' },
        { type: 'string', name: 'abstract', optional: true },
        { type: 'Array', subType: 'CrsCode', name: 'availableCrs' },
        { type: 'Array', subType: 'WmsLayerStyle', name: 'styles' },
        {
          type: 'Map',
          key: 'string',
          subType: 'BoundingBox',
          name: 'boundingBoxes',
          description:
            'Dictionary of bounding boxes for each of the available CRS',
        },
        { type: 'WmsLayerAttribution', name: 'attribution', optional: true },
        {
          type: 'Array',
          subType: 'WmsLayerFull',
          name: 'children',
          description: 'Not defined if the layer is a leaf in the tree',
          optional: true,
        },
      ],
    },
    {
      name: 'WmsLayerAttribution',
      type: 'Object',
      properties: [
        { type: 'string', name: 'title', optional: true },
        { type: 'string', name: 'url', optional: true },
        { type: 'string', name: 'logoUrl', optional: true },
      ],
    },
    {
      name: 'WmsLayerStyle',
      type: 'Object',
      properties: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'title' },
        {
          type: 'string',
          name: 'legendUrl',
          description:
            'May not be defined; a GetLegendGraphic operation should work in any case',
          optional: true,
        },
      ],
    },
    {
      name: 'BoundingBox',
      type: 'Array',
      subTypes: ['number', 'number', 'number', 'number'],
      description:
        'Values are `minX`, `minY`, `maxX` and `maxY` expressed in latitudes and longitudes',
    },
    {
      name: 'OgcApiEndpointInfo',
      type: 'Object',
      subTypes: ['number', 'number', 'number', 'number'],
      description: 'Information related to an OGC API endpoint.',
    },
    {
      name: 'OgcApiCollectionInfo',
      type: 'Object',
      subTypes: ['number', 'number', 'number', 'number'],
      description:
        'Information on a specific collection of an OGC API endpoint.',
    },
    {
      name: 'OgcApiCollectionItem',
      type: 'Object',
      subTypes: ['number', 'number', 'number', 'number'],
      description: 'An item coming from an OGC API endpoint',
    },
  ],
};

export default API;
