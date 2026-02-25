# ogc-client [![Latest version on NPM](https://img.shields.io/npm/v/%40camptocamp%2Fogc-client)](https://www.npmjs.com/package/@camptocamp/ogc-client) [![Latest @dev version on NPM](https://img.shields.io/npm/v/%40camptocamp%2Fogc-client/dev)](https://www.npmjs.com/package/@camptocamp/ogc-client?activeTab=versions)

> A Typescript library for interacting with [OGC-compliant services](https://www.ogc.org/docs/is)

**ogc-client** is a Typescript library which implements several OGC standards and will help you interact with
them in a user-friendly and consistent way.

[Documentation and live demo here!](https://camptocamp.github.io/ogc-client/)

The following standards are partially implemented:

- WMS - _Web Map Service_
- WFS - _Web Feature Service_
- WMTS - _Web Map Tile Service_
- OGC API (Records and Features)
- OGC API — Connected Systems (CSAPI)
- TMS - _Tile Map Service_
- STAC API - _SpatioTemporal Asset Catalog_

## Why use it?

1. **ogc-client** will abstract the service version so you don't have to worry about it
2. **ogc-client** will handle XML so you only have to deal with native Javascript objects
3. **ogc-client** will hide the complexity of OGC standards behind straightforward APIs
4. **ogc-client** will run heavy tasks in a worker to avoid blocking the main thread
5. **ogc-client** will keep a persistent cache of operations to minimize requests and processing
6. **ogc-client** will tell you if a service is not usable for [CORS-related issues](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## Instructions

To install **ogc-client**, run:

```bash
$ npm install --save @camptocamp/ogc-client
```

To use, import API symbols like so:

```js
import { WmsEndpoint, WfsEndpoint, StacEndpoint } from '@camptocamp/ogc-client';
```

Note: if you want to disable web worker usage, for example to solve issues with the `Referer` header on outgoing
requests, use:

```js
import { enableFallbackWithoutWorker } from '@camptocamp/ogc-client';

enableFallbackWithoutWorker();
```

All processing will be done on the main thread after this call, including HTTP requests.

### Use the latest development version

[The `@camptocamp/ogc-client` NPM package](https://www.npmjs.com/package/@camptocamp/ogc-client) is updated on every commit on the `main` branch under the `@dev` tag. To use it:

```bash
$ npm install --save @camptocamp/ogc-client@dev
```

### Application

A provided application containing the documentation and demo is located in the `app` folder.
To start it locally, clone the repository and run the following commands:

```bash
$ npm install
$ cd app
$ npm install
$ npm start
```

The app is based on [Vue.js](https://vuejs.org/) and will showcase most features implemented in the library.
You will need to supply it with valid OGC service urls.

## Quick Examples

### STAC API

See the [`examples/`](./examples/) directory for more complete examples, including:

- `examples/stac-query.js` - Full STAC API query example with spatial and temporal filters

Run examples with:

```bash
npm run build
node examples/stac-query.js
```

## OGC Connected Systems API (CSAPI)

The library includes support for the [OGC API — Connected Systems](https://ogcapi.ogc.org/connectedsystems/) standard ([Part 1: Feature Resources](https://docs.ogc.org/is/23-001/23-001.html), [Part 2: Dynamic Data](https://docs.ogc.org/is/23-002/23-002.html)). This standard extends the OGC API family into the IoT/sensor domain, providing a REST API for discovering and querying sensor systems, deployments, datastreams, observations, commands, and related resources.

CSAPI is available as an **opt-in sub-path export**, meaning it is only included in your production bundle if you explicitly import it.

### If you don't need Connected Systems

Nothing changes. Use the library exactly as before:

```ts
import { OgcApiEndpoint, WmsEndpoint } from '@camptocamp/ogc-client';
```

CSAPI code will not be included in your bundle.

### If you need Connected Systems

Add a second import from the CSAPI sub-path:

```ts
import { OgcApiEndpoint } from '@camptocamp/ogc-client';
import { createCSAPIBuilder } from '@camptocamp/ogc-client/csapi';

const endpoint = new OgcApiEndpoint('https://api.example.org');

if (await endpoint.hasConnectedSystems) {
  const builder = await createCSAPIBuilder(endpoint, 'weather-stations');
  const systemsUrl = builder.getSystems({ limit: 50 });
  const dsUrl = builder.getDataStreams();
}
```

The `createCSAPIBuilder()` factory function connects to the endpoint and discovers available CSAPI resources. The returned `CSAPIQueryBuilder` provides methods for all 9 resource types: systems, deployments, sampling features, procedures, properties, datastreams, observations, control streams, and commands.

### Why a separate import path?

The OGC Connected Systems standard is large — it spans 9 resource types across 2 specification parts with multiple response formats (GeoJSON, SWE Common, SensorML). By isolating CSAPI behind a sub-path export, users who only need WMS/WFS/WMTS/etc. don't pay the bundle-size cost for functionality they're not using. Modern bundlers (Webpack 5+, Vite, Rollup, esbuild) handle this automatically.
