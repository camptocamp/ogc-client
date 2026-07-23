/**
 * ncWMS Example
 *
 * This example demonstrates how to:
 * 1. initialize an ncWMS endpoint
 * 2. read metadata for a layer
 * 3. request min/max values for a bbox, time and elevation
 * 4. generate a legend URL using the same rendering parameters
 *
 * Run with: node examples/ncwms.js
 */

import { getDimensionDefaultValue, NcwmsEndpoint } from '../dist/dist-node.js';

const NCWMS_URL =
  'https://tds0.ifremer.fr/thredds/wms/LPO_GLOBANA_ISAS20_ARGO_MNTH_TIME_SERIE?service=WMS&request=GetCapabilities';
const LAYER_NAME = 'TEMP';
const SAMPLE_BBOX = [-60, 30, -30, 50];

function getLayerDimensionValue(layer, dimensionName) {
  const dimension = layer.dimensions?.find((dim) => dim.name === dimensionName);
  return dimension ? getDimensionDefaultValue(dimension) : null;
}

async function main() {
  try {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                    ncWMS Example                      ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log(`📡 Connecting to ncWMS endpoint: ${NCWMS_URL}\n`);
    const endpoint = await new NcwmsEndpoint(NCWMS_URL).isReady();

    const layer = endpoint.getLayerByName(LAYER_NAME);
    if (!layer) {
      throw new Error(`Layer "${LAYER_NAME}" was not found.`);
    }

    const time = getLayerDimensionValue(layer, 'time');
    const elevation = getLayerDimensionValue(layer, 'elevation');

    if (!time || !elevation) {
      throw new Error(
        `Layer "${LAYER_NAME}" does not expose default time/elevation values.`
      );
    }

    console.log(`1️⃣  Getting metadata for layer "${LAYER_NAME}"...`);
    console.log(`   Title: ${layer.title}`);
    console.log(`   Abstract: ${layer.abstract || 'N/A'}`);
    console.log(`   Bounding box (CRS:84): [${SAMPLE_BBOX.join(', ')}]`);
    console.log(`   Time: ${time}`);
    console.log(`   Elevation: ${elevation}\n`);

    const details = await endpoint.getLayerDetails(LAYER_NAME);
    if (!details) {
      throw new Error(
        `No ncWMS metadata is available for layer "${LAYER_NAME}".`
      );
    }

    console.log('   ncWMS metadata:');
    console.log(`   Units: ${details.units || 'N/A'}`);
    console.log(`   Default palette: ${details.defaultPalette || 'N/A'}`);
    console.log(`   Scale range: [${details.scaleRange.join(', ')}]`);
    console.log(`   Supported styles: ${details.supportedStyles.join(', ')}`);
    console.log(`   Palettes: ${details.palettes.slice(0, 5).join(', ')}`);
    if (details.palettes.length > 5) {
      console.log(`   ... and ${details.palettes.length - 5} more`);
    }
    console.log('');

    console.log('2️⃣  Reading min/max values for the requested subset...');
    const minMax = await endpoint.getMinMax(LAYER_NAME, SAMPLE_BBOX, {
      time,
      elevation,
    });
    console.log(`   Min: ${minMax.min}`);
    console.log(`   Max: ${minMax.max}\n`);

    console.log(
      '3️⃣  Generating a legend URL for the same rendering parameters...'
    );
    const legendUrl = endpoint.getLegendUrl(LAYER_NAME, {
      style: `boxfill/${details.defaultPalette || 'rainbow'}`,
      colorScaleRange: [minMax.min, minMax.max],
    });
    console.log(`   Legend URL: ${legendUrl}`);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exitCode = 1;
  }
}

main();
