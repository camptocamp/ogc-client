# ogc-client Examples

This directory contains example scripts demonstrating how to use the ogc-client library.

## Prerequisites

Before running these examples, you need to build the library:

```bash
npm install
npm run build
```

## Running Examples

### STAC API Query Example

Demonstrates querying a STAC (SpatioTemporal Asset Catalog) API endpoint:

```bash
node examples/stac-query.js
```

This example shows how to:

- Connect to a STAC API endpoint
- Retrieve endpoint information and capabilities
- List all available collections
- Get detailed collection metadata (extent, providers, license, etc.)
- Query items with various filters:
  - Limit (pagination)
  - Bounding box (spatial filtering)
  - DateTime (temporal filtering)
- Retrieve a single item
- Build custom query URLs

The example queries the public STAC API at:

- https://api.stac.teledetection.fr
- https://catalog.maap.eo.esa.int/catalogue
- https://stac.dataspace.copernicus.eu/v1/

### OGC API - Connected Systems (CSAPI) Example

Demonstrates working with OGC API - Connected Systems endpoints:

```bash
node examples/csapi-demo.js
```

This example shows how to:

- Initialize CSAPI client classes (SystemsClient, DatastreamsClient, ObservationsClient)
- Query systems and retrieve system details
- List and get datastreams
- Query observations and observation data
- Navigate between related resources using link relations
- Access system events

**Related documentation:**

- [OGC API - Connected Systems Standard](https://github.com/opengeospatial/ogcapi-connected-systems)
- [Part 1: Feature Resources](https://docs.ogc.org/DRAFTS/23-001.html)
- [Part 2: Sampling Resources](https://docs.ogc.org/DRAFTS/23-002.html)

The example uses fixture data by default. To test with a live CSAPI endpoint:

```bash
export CSAPI_API_ROOT=https://your-csapi-server.com
export CSAPI_LIVE=true
node examples/csapi-demo.js
```
