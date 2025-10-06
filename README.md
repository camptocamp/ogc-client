![Upstream Contribution](https://img.shields.io/badge/contributing%20to-camptocamp%2Fogc--client-blue)

> ⚙️ This fork is actively developing support for the **OGC API - Connected Systems** standard, with the goal of contributing back to [camptocamp/ogc-client](https://github.com/camptocamp/ogc-client).

📋 [Implementation Plan](https://github.com/Sam-Bolling/ogc-client/blob/main/docs/connected-systems-plan.md)

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
- TMS - _Tile Map Service_

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
import { WmsEndpoint, WfsEndpoint } from '@camptocamp/ogc-client';
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
