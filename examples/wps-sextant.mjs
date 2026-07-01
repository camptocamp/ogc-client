/**
 * WPS Example — Ifremer Sextant demo server
 *
 * This example demonstrates how to use the WpsEndpoint class to interact with
 * a Web Processing Service (WPS 1.0.0). It queries the public py-qgis-wps demo
 * server hosted by Ifremer / Sextant.
 *
 * It shows how to:
 * - Connect to a WPS endpoint (GetCapabilities) and read service info
 * - List the advertised processes
 * - Describe a process (inputs / outputs)
 * - Execute a process asynchronously and poll its status until completion
 *
 * Run with: node examples/wps-sextant.mjs
 */

import { WpsEndpoint } from '../dist/dist-node.js';

// WPS demo endpoint (py-qgis-wps, WPS 1.0.0)
const WPS_URL = 'https://sextant.ifremer.fr/services/wps3/demo';

// Process used for the execute demo (advertised by the demo server)
const PROCESS_ID = 'script:demo-inputs';

async function main() {
  try {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║         WPS Example — Ifremer Sextant demo            ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Create and initialize the endpoint (fetches & parses GetCapabilities)
    console.log(`📡 Connecting to WPS: ${WPS_URL}\n`);
    const endpoint = await new WpsEndpoint(WPS_URL).isReady();

    // 1. Service information
    console.log('1️⃣  Service information');
    const info = endpoint.getServiceInfo();
    console.log(`   Version: ${endpoint.getVersion()}`);
    console.log(`   Title:   ${info?.title || 'N/A'}`);
    console.log(`   Provider:${info?.provider?.name || 'N/A'}`);
    console.log('');

    // 2. List the advertised processes
    const processes = endpoint.getProcesses() ?? [];
    console.log(`2️⃣  Processes (${processes.length})`);
    processes.forEach((p) => {
      console.log(`   - ${p.identifier}: ${p.title || ''}`);
    });
    console.log('');

    // 3. Describe a process
    console.log(`3️⃣  DescribeProcess: ${PROCESS_ID}`);
    const full = await endpoint.describeProcess(PROCESS_ID);
    console.log(`   Title: ${full?.title || 'N/A'}`);
    console.log(`   Inputs:`);
    full?.inputs?.forEach((input) => {
      console.log(
        `     - ${input.identifier} (${input.type}) [${input.minOccurs}..${input.maxOccurs}]`
      );
    });
    console.log(`   Outputs:`);
    full?.outputs?.forEach((output) => {
      console.log(`     - ${output.identifier} (${output.type})`);
    });
    console.log('');

    // 4. Execute the process asynchronously, then poll until it completes
    console.log(`4️⃣  Execute: ${PROCESS_ID} (asynchronous)`);
    const response = await endpoint.execute(PROCESS_ID, {
      inputs: [
        { identifier: 'STRING', literalValue: 'hello ogc-client' },
        { identifier: 'NUMBER', literalValue: '3.14' },
        { identifier: 'INT', literalValue: '42' },
        { identifier: 'ENUM', literalValue: 'option 2' },
        { identifier: 'BOOL', literalValue: 'true' },
        {
          identifier: 'EXTENT',
          boundingBoxValue: { crs: 'EPSG:4326', bbox: [-5, 43, 9, 51] },
        },
      ],
      outputs: [{ identifier: 'OUTPUT', asReference: true }],
      status: true,
      storeExecuteResponse: true,
    });
    console.log(`   Initial status: ${response.status}`);
    console.log(`   Status location: ${response.statusLocation || 'N/A'}`);

    if (response.statusLocation) {
      console.log('   Polling status...');
      for (let i = 0; i < 15; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const status = await endpoint.getStatus(response.statusLocation);
        console.log(
          `     poll #${i + 1}: ${status.status} (${
            status.percentCompleted ?? '?'
          }%)`
        );
        if (status.status === 'succeeded' || status.status === 'failed') {
          status.outputs.forEach((output) => {
            if (output.reference) {
              console.log(
                `     → ${output.identifier}: ${output.reference.href}`
              );
            } else if (output.data) {
              console.log(
                `     → ${output.identifier}: ${output.data.content}`
              );
            }
          });
          break;
        }
      }
    }
    console.log('');

    console.log('✅ Example completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the example
await main();
