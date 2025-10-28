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
  - Limit and offset (pagination)
  - Bounding box (spatial filtering)
  - DateTime (temporal filtering)
- Retrieve a single item
- Build custom query URLs

The example queries the public STAC API at https://api.stac.teledetection.fr
