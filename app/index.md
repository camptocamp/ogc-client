---
outline: deep
title: Docs
---

<div class="lib-logo">ogc-client</div>

## Presentation

<span class="lib-name">ogc-client</span> is a pure Javascript library made for interacting with geospatial web services relying on standard protocols, namely [OGC standards](https://www.ogc.org/docs/is).

Its purpose is to help you interact with them in a user-friendly and consistent way.

Its main features include:

- Support for many protoocols such as [WFS](https://www.ogc.org/standards/wfs), [WMS](https://www.ogc.org/standards/wms), [WMTS](https://www.ogc.org/standards/wmts), [WPS](https://www.ogc.org/standards/wps), [OGC API](https://ogcapi.ogc.org/), STAC API, TMS and NcWMS extension
- Elaborate cache system to minimize network requests
- Fast parsing of XML documents using [@rgrove/parse-xml](https://github.com/rgrove/parse-xml)
- Detection of [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)-related issues

## Prerequisites

<span class="lib-name">ogc-client</span> requires Node.js version 20.x or newer (but we recommend using [active LTS release](https://github.com/nodejs/release#release-schedule)).

## Usage

First, install <span class="lib-name">ogc-client</span> in your project:

```sh
$ npm install --save @camptocamp/ogc-client
```

Then, use it like so:

```js
import { WfsEndpoint } from '@camptocamp/ogc-client';

new WfsEndpoint('https://my.server.org/ows')
  .isReady()
  .then((endpoint) => console.log(endpoint.getFeatureTypes()));
```

Please refer to the [examples below](#examples) for more details on how to use each functionality.

::: details A note on text encoding
Even though **UTF-8** is the most common text encoding in the web, some services might respond with other encodings such as **UTF-16**, **[ISO-8859-1](https://en.wikipedia.org/wiki/ISO/IEC_8859-1)**, etc.
<span class="lib-name">ogc-client</span> will attempt to decode the responses using the information at its disposal, and in most case decoding should succeed. It may happen though that some unrecognized characters will remain; please [open an issue](https://github.com/camptocamp/ogc-client/issues/new) if that is the case!
:::

## Why use it?

Many libraries are able to leverage OGC protocols for various specialized tasks, for instance downloading data or rendering maps. Often times though, the application code has the responsibility to specify the version to use, the coordinate system, the bounding box to query, etc.

<span class="lib-name">ogc-client</span> intends to assist applications in discovering OGC services and what they offer, without having to manually write code for parsing GetCapabilities documents for example.

When an network error is encountered, <span class="lib-name">ogc-client</span> will do an additional check to determine whether this is due to [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) limitations. This will help the application code in giving an appropriate feedback to the user, i.e. that the targeted resource is indeed reachable but does not allow cross-origin usage.

<span class="lib-name">ogc-client</span> also keeps a cache of all operations using the [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache), thus offering almost limitless storage while also purging expired cache entries regularly. By default, all cache entries are kept for one hour.

What <span class="lib-name">ogc-client</span> currently does not do:

- No GML geometry parsing: the [OpenLayers GML parser](https://openlayers.org/en/latest/apidoc/module-ol_format_GML32-GML32.html) offers extensive support of the GML format

## Examples

##### Read a WMS layer extent

```js
import { WmsEndpoint } from '@camptocamp/ogc-client';

async function readExtent() {
  const endpoint = await new WmsEndpoint('https://my.server.org/ows').isReady();
  const layer = endpoint.getLayerByName();
  const extent = layer.boundingBoxes['EPSG:4326'];
}
```

##### Compute a WFS GetFeature url

```js
import { WfsEndpoint } from '@camptocamp/ogc-client';

async function getFeatureUrl() {
  const endpoint = await new WfsEndpoint('https://my.server.org/ows').isReady();
  const url = endpoint.getFeatureUrl('my:featureType', {
    asJson: true,
    maxFeatures: 1000,
  });
}
```

##### Query the first 10 items of an OGC API Records collection

```js
import { OgcApiEndpoint } from '@camptocamp/ogc-client';

async function getFirstTenRecords() {
  const endpoint = new OgcApiEndpoint('https://my.server.org/main');
  const firstCollection = (await endpoint.recordCollections)[0];
  return endpoint.getCollectionItems(firstCollection, 10, 0);
}
```

##### Add a WMTS layer to an [OpenLayers](https://openlayers.org/) map

```js
import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import { transformExtent } from 'ol/proj';
import { WmtsEndpoint } from '@camptocamp/ogc-client';

// create the OpenLayers map
// ...

async function addWmtsLayer() {
  const endpoint = await new WmtsEndpoint('https://my.server.org/wmts').isReady();
  const layer = endpoint.getLayers()[0];
  const matrixSet = layer.matrixSets[0];
  const tileGrid = await endpoint.getOpenLayersTileGrid(
    layer.name,
    matrixSet.identifier
  );
  const resourceLink = layer.resourceLinks[0];
  const dimensions = endpoint.getDefaultDimensions(layer.name);
  const layer = new TileLayer({
    source: new WMTS({
      layer: layer.name,
      style: layer.defaultStyle,
      matrixSet: matrixSet.identifier,
      format: resourceLink.format,
      url: resourceLink.url,
      requestEncoding: resourceLink.encoding,
      tileGrid,
      projection: matrixSet.crs,
      dimensions,
    }),
    // this will limit the rendering to the actual range where data is available
    maxResolution: tileGrid.getResolutions()[0],
    extent: transformExtent(
      layer.latLonBoundingBox,
      'EPSG:4326',
      openLayersMap.getView().getProjection()
    );
  });
  openLayersMap.addLayer(layer);
}
```

##### Reading a Tile Map Service (TMS) endpoint

```js
import { TmsEndpoint } from '@camptocamp/ogc-client';

// Create a TMS endpoint
const endpoint = new TmsEndpoint(
  'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0',
);

// Get endpoint information
const info = await endpoint.tileMapServiceInfo;
console.log(info.title, info.abstract);

// Get all available tile maps
const tileMaps = await endpoint.allTileMaps;

// Get detailed information for a specific tile map
const tileMapDetails = await endpoint.getTileMapInfo(tileMaps[0].href);
```

##### Run a process on a Web Processing Service (WPS)

```js
import { WpsEndpoint } from '@camptocamp/ogc-client';

async function runProcess() {
  const endpoint = await new WpsEndpoint('https://my.server.org/wps').isReady();

  // Read service info and list the advertised processes
  const info = endpoint.getServiceInfo();
  const processes = endpoint.getProcesses();

  // Describe a process to discover its inputs and outputs
  const description = await endpoint.describeProcess(processes[0].identifier);

  // Execute the process and read the result
  const result = await endpoint.execute(processes[0].identifier, {
    inputs: [{ identifier: 'NAME', literalValue: 'hello ogc-client' }],
    outputs: [{ identifier: 'OUTPUT', asReference: true }],
  });
}
```
