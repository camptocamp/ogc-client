<template>
  <div class="container">
    <div class="col-8 offset-2">
      <h1 class="title text-center" style="font-size: 5em; margin: 2em 0">
        <LibLogo></LibLogo>
      </h1>

      <h2 class="mt-5 mb-4">Presentation</h2>

      <p>
        <LibName></LibName> is a pure Javascript library made for interacting
        with geospatial web services relying on standard protocols, namely
        <a href="https://www.ogc.org/docs/is">OGC standards.</a>
      </p>

      <p>
        Its purpose is to helps you interact with them in a user-friendly and
        consistent way.
      </p>

      <p>Its main features include:</p>

      <ul>
        <li>
          Support for <a href="https://www.ogc.org/standards/wfs">WFS</a> and
          <a href="https://www.ogc.org/standards/wms">WMS</a> protocols
        </li>
        <li>Elaborate cache system to minimize network requests</li>
        <li>
          Fast parsing of XML documents using
          <a href="https://github.com/rgrove/parse-xml">@rgrove/parse-xml</a>
        </li>
        <li>
          Detection of
          <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
            >CORS</a
          >-related issues
        </li>
      </ul>

      <h2 class="mt-5 mb-4">Usage</h2>

      <p>First, install <LibName></LibName> in your project:</p>

      <p>
        <CodeBlock lang="sh"
          >$ npm install --save @camptocamp/ogc-client</CodeBlock
        >
      </p>

      <p>Then, use it like so:</p>

      <p>
        <CodeBlock lang="js">
          <pre>
import { WfsEndpoint } from '@camptocamp/ogc-client';

new WfsEndpoint('https://my.server.org/ows')
  .then(endpoint => endpoint.supportsJson());</pre
          >
        </CodeBlock>
      </p>

      <p>
        Please refer to the API section for more details on how to use each
        functionality.
      </p>

      <h2 class="mt-5 mb-4">Why use it?</h2>

      <p>
        Many libraries are able to leverage OGC protocols for various
        specialized tasks, for instance downloading data or rendering maps.
        Often times though, the application code has the responsibility to
        specify the version to use, the coordinate system, the bounding box to
        query, etc.
      </p>

      <p>
        <LibName></LibName> intends to assist applications in discovering OGC
        services and what they offer, without having to manually write code for
        parsing GetCapabilities documents for example.
      </p>

      <p>
        When an network error is encountered, <LibName></LibName> will do an
        additional check to determine whether this is due to
        <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
          >CORS</a
        >
        limitations. This will help the application code in giving an
        appropriate feedback to the user, i.e. that the targeted resource is
        indeed reachable but does not allow cross-origin usage.
      </p>

      <p>
        <LibName></LibName> also keeps a cache of all operations using the
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/Cache"
          >Cache API</a
        >, thus offering almost limitless storage while also purging expired
        cache entries regularly. By default, all cache entries are kept for one
        hour.
      </p>

      <p>What <LibName></LibName> currently does not do:</p>

      <ul>
        <li>
          No <a href="https://www.ogc.org/standards/wmts">WMTS</a> parsing:
          alternatives already exist, such as the OpenLayers
          <a
            href="https://openlayers.org/en/latest/apidoc/module-ol_format_WMTSCapabilities-WMTSCapabilities.html"
            >WMTS Capabilities</a
          >
          class (<a
            href="https://openlayers.org/en/latest/examples/wmts-capabilities.html"
            >example</a
          >)
        </li>
        <li>
          No GML geometry parsing: again,
          <a
            href="https://openlayers.org/en/latest/apidoc/module-ol_format_GML32-GML32.html"
            >alternatives do exist</a
          >
        </li>
      </ul>

      <h2 class="mt-5 mb-4">Examples</h2>

      <h5>Read a WMS layer extent</h5>

      <p>
        <CodeBlock lang="js">
          <pre>
import { WmsEndpoint } from '@camptocamp/ogc-client';

async function readExtent() {
  const endpoint = await new WmsEndpoint('https://my.server.org/ows').isReady()
  const layer = endpoint.getLayerByName();
  const extent = layer.boundingBoxes['EPSG:4326'];
}</pre
          >
        </CodeBlock>
      </p>

      <h5>Compute a WFS GetFeature url</h5>

      <p>
        <CodeBlock lang="js">
          <pre>
import { WfsEndpoint } from '@camptocamp/ogc-client';

async function getFeatureUrl() {
  const endpoint = await new WfsEndpoint('https://my.server.org/ows').isReady()
  const url = endpoint.getFeatureUrl('my:featureType', {
    asJson: true,
    maxFeature: 1000
  });
}</pre
          >
        </CodeBlock>
      </p>

      <h2 class="mt-5 mb-4">API</h2>

      <h5>WfsEndpoint</h5>

      <h6>
        <code>new WfsEndpoint(url: string)</code>
      </h6>

      <p>
        Creates a new WFS endpoint; wait for the <code>isReady()</code>
        promise before using the endpoint methods.
      </p>

      <h6><code>isReady(): Promise&lt;WfsEndpoint&gt;</code></h6>

      <p>
        Resolves when the endpoint is ready to use. Returns the same endpoint
        object for convenience.
      </p>

      <h6><code>getServiceInfo(): ServiceInfo</code></h6>

      <p>Returns the service info.</p>

      <h6>
        <code>getVersion(): string</code>
      </h6>

      <p>
        Returns the highest protocol version that this WFS endpoint supports:
        either <code>1.0.0</code>, <code>1.1.0</code> or <code>2.0.0</code>;
      </p>

      <h6><code>getFeatureTypes(): FeatureTypeBrief[]</code></h6>

      <p>Returns the available feature types.</p>

      <h6>
        <code
          >getFeatureTypeSummary(featureType: string): FeatureTypeSummary</code
        >
      </h6>

      <p>
        Returns the feature type in summary format. If a namespace is specified
        in the name, this will be used for matching; otherwise, matching will be
        done without taking namespaces into account.
      </p>

      <h6>
        <code
          >getFeatureTypeFull(featureType: string):
          Promise&lt;FeatureTypeFull&gt;</code
        >
      </h6>

      <p>
        Returns a promise that will resolve with the full feature type
        description, including properties with their types, geometry field and
        total object count.
      </p>

      <h6>
        <code
          >getFeatureTypePropDetails(featureType: string):
          Promise&lt;FeatureTypePropsDetails&gt;</code
        >
      </h6>

      <p>
        Returns a promise that will resolve with details on each of the feature
        type properties; for now, this consists of a list of unique values in
        the whole dataset.
      </p>

      <h6>
        <code>supportsJson(featureType: string): boolean</code>
      </h6>

      <p>
        Returns true if the endpoint is able to output the specified feature
        type as GeoJSON.
      </p>

      <h6>
        <code
          >getFeatureUrl(featureType: string, options: GetFeatureUrlOptions):
          string</code
        >
      </h6>

      <p>
        Returns a URL that can be used to query features from this feature type.
      </p>

      <h5>WmsEndpoint</h5>

      <h6>
        <code>new WmsEndpoint(url: string)</code>
      </h6>

      <p>
        Creates a new WMS endpoint; wait for the <code>isReady()</code>
        promise before using the endpoint methods.
      </p>

      <h6><code>isReady(): Promise&lt;WmsEndpoint&gt;</code></h6>

      <p>
        Resolves when the endpoint is ready to use. Returns the same endpoint
        object for convenience.
      </p>

      <h6><code>getServiceInfo(): ServiceInfo</code></h6>

      <p>Returns the service info.</p>

      <h6>
        <code>getVersion(): string</code>
      </h6>

      <p>
        Returns the highest protocol version that this WMS endpoint supports:
        either <code>1.1.0</code>, <code>1.1.1</code> or <code>1.3.0</code>;
      </p>

      <h6><code>getLayers(): LayerSummary[]</code></h6>

      <p>
        Returns the layers advertised in the endpoint. Note that WMS layers are
        organized in a tree structure, so some layers may have children layers
        as well
      </p>

      <h6>
        <code>getLayerByName(layerName: string): LayerFull</code>
      </h6>

      <p>
        Returns the full layer information, including supported coordinate
        systems, available layers, bounding boxes etc. Layer name is case
        sensitive.
      </p>

      <h5>Utilities</h5>

      <h6>
        <code>useCache(() => any, ...keys: string[]): Promise&lt;any&gt;</code>
      </h6>

      <p>
        Will run the provided function and resolve to its return value. The
        function return value will also be stored in cache, meaning that
        subsequent runs will <strong>not</strong> execute the function but
        simply return the cached value. Keys are an indeterminate amount of
        string tokens that are used to uniquely identify the operation.
      </p>

      <p>
        Cached values are kept for one hour. Each call to
        <code>useCache</code> will first loop on the currently cached values and
        clear the ones that have expired to make sure that the cache storage
        does not grow indefinitely.
      </p>

      <p>
        Also note that if <code>useCache</code> is called several times with the
        same key without the first one having returned yet, all subsequent calls
        will <strong>not</strong> trigger additional operations but simply
        resolve at the same time as the first one.
      </p>
    </div>
  </div>
</template>

<script>
import './style/global.css';
import LibName from './components/presentation/LibName';
import LibLogo from './components/presentation/LibLogo';
import CodeBlock from './components/presentation/CodeBlock';

export default {
  name: 'App',
  components: { CodeBlock, LibLogo, LibName },
};
</script>

<style scoped></style>
