# ogc-client

> A javascript library for interacting with [OGC-compliant services](https://www.ogc.org/docs/is)

**ogc-client** is a pure Javascript library which implements several OGC standards and will help you interact with
them in a user-friendly and consistent way.

The following standards are partially implemented:
* WMS - *Web Map Service*
* WFS - *Web Feature Service*

Why no WMTS support? Because [openlayers](https://www.github.com/openlayers/openlayers) has a incredibly thorough and well-tested WMTS capabilities parser and you should just use it.
Reimplementing it in **ogc-client** currently does not bring any significant value.

> TODO: link to demo app on gh-pages

## Why use it?

1. **ogc-client** will abstract the service version so you don't have to worry about it
2. **ogc-client** will handle XML so you only have to deal with native Javascript objects
3. **ogc-client** will hide the complexity of OGC standards behind straightforward APIs
4. **ogc-client** will run heavy tasks in a worker to avoid blocking the main thread
4. **ogc-client** will keep a persistent cache of operations to minimize requests and processing
5. **ogc-client** will handle errors in a graceful way and extract relevant messages for you
6. **ogc-client** will tell you if a service is not usable for [CORS-related issues](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## Instructions

To install **ogc-client**, run:

```bash
$ npm install --save @camptocamp/ogc-client
```

### API

> TODO

### Demo

The demo app is located in the `demo` folder. To start it locally, clone the repository and run the following commands:

```bash
$ cd demo
$ npm install
$ npm run serve
```

The app is based on [Vue.js 2](https://vuejs.org/) and will showcase most features implemented in the library.
You will need to supply it with valid OGC service urls.
