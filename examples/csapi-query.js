/**
 * OGC API - Connected Systems (CSAPI) Query Example
 *
 * This example demonstrates how to use the CSAPI client classes to query
 * a Connected Systems API endpoint and retrieve systems, datastreams, and observations.
 *
 * Run with: node examples/csapi-query.js
 */

import {
  SystemsClient,
  DatastreamsClient,
  ObservationsClient,
  DeploymentsClient,
} from '../dist/dist-node.js';

// CSAPI base URL - replace with your actual endpoint
const CSAPI_API_URL =
  process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

async function main() {
  try {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║   OGC API - Connected Systems Query Example          ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log(`📡 Connecting to CSAPI endpoint: ${CSAPI_API_URL}\n`);

    // Create client instances for different resource types
    const systemsClient = new SystemsClient(CSAPI_API_URL);
    const datastreamsClient = new DatastreamsClient(CSAPI_API_URL);
    const observationsClient = new ObservationsClient(CSAPI_API_URL);
    const deploymentsClient = new DeploymentsClient(CSAPI_API_URL);

    // 1️⃣ List all systems
    console.log('1️⃣  Listing all systems...');
    const systemsCollection = await systemsClient.list();

    console.log(
      `   Found ${systemsCollection.features?.length || 0} system(s):\n`
    );
    systemsCollection.features?.slice(0, 5).forEach((system, idx) => {
      console.log(`   ${idx + 1}. ${system.id}`);
      if (system.properties?.name) {
        console.log(`      Name: ${system.properties.name}`);
      }
      if (system.properties?.description) {
        console.log(
          `      Description: ${system.properties.description.substring(
            0,
            60
          )}...`
        );
      }
    });

    if (systemsCollection.features && systemsCollection.features.length > 5) {
      console.log(`   ... and ${systemsCollection.features.length - 5} more`);
    }
    console.log('');

    // 2️⃣ Get details for a specific system
    if (systemsCollection.features && systemsCollection.features.length > 0) {
      const systemId = systemsCollection.features[0].id;
      console.log(`2️⃣  Getting details for system: "${systemId}"...`);

      const system = await systemsClient.get(systemId);
      console.log(`   ID: ${system.id}`);
      console.log(`   Type: ${system.type}`);

      if (system.properties) {
        console.log(`   Name: ${system.properties.name || 'N/A'}`);
        console.log(
          `   Description: ${system.properties.description || 'N/A'}`
        );

        if (system.properties.validTime) {
          console.log(
            `   Valid Time: ${JSON.stringify(system.properties.validTime)}`
          );
        }
      }

      // Show links
      if (system.links && system.links.length > 0) {
        console.log(`\n   Links (${system.links.length}):`);
        system.links.slice(0, 5).forEach((link) => {
          console.log(`     • ${link.rel}: ${link.href}`);
        });
        if (system.links.length > 5) {
          console.log(`     ... and ${system.links.length - 5} more`);
        }
      }
      console.log('');

      // 3️⃣ Get linked resources for the system
      console.log(`3️⃣  Getting linked resources for system: "${systemId}"...`);
      const linkedResources = await systemsClient.getLinkedResources(systemId);

      console.log(
        `   Found ${Object.keys(linkedResources).length} linked resource(s):\n`
      );
      Object.entries(linkedResources).forEach(([rel, href]) => {
        console.log(`   • ${rel}: ${href}`);
      });
      console.log('');

      // 4️⃣ List system events
      console.log(`4️⃣  Listing events for system: "${systemId}"...`);
      try {
        const systemEvents = await systemsClient.listEvents(systemId);

        if (systemEvents.features && systemEvents.features.length > 0) {
          console.log(`   Found ${systemEvents.features.length} event(s):\n`);
          systemEvents.features.slice(0, 3).forEach((event, idx) => {
            console.log(`   ${idx + 1}. ${event.id}`);
            if (event.properties?.eventType) {
              console.log(`      Event Type: ${event.properties.eventType}`);
            }
            if (event.properties?.time) {
              console.log(`      Time: ${event.properties.time}`);
            }
          });

          if (systemEvents.features.length > 3) {
            console.log(`   ... and ${systemEvents.features.length - 3} more`);
          }
        } else {
          console.log(`   No events found for this system`);
        }
      } catch (error) {
        console.log(`   No events available for this system`);
      }
      console.log('');
    }

    // 5️⃣ List datastreams
    console.log('5️⃣  Listing all datastreams...');
    try {
      const datastreamsCollection = await datastreamsClient.list();

      console.log(
        `   Found ${
          datastreamsCollection.features?.length || 0
        } datastream(s):\n`
      );
      datastreamsCollection.features?.slice(0, 5).forEach((datastream, idx) => {
        console.log(`   ${idx + 1}. ${datastream.id}`);
        if (datastream.properties?.name) {
          console.log(`      Name: ${datastream.properties.name}`);
        }
        if (datastream.properties?.observedProperty) {
          console.log(
            `      Observed Property: ${JSON.stringify(
              datastream.properties.observedProperty
            ).substring(0, 60)}...`
          );
        }
      });

      if (
        datastreamsCollection.features &&
        datastreamsCollection.features.length > 5
      ) {
        console.log(
          `   ... and ${datastreamsCollection.features.length - 5} more`
        );
      }
      console.log('');

      // 6️⃣ Get specific datastream details
      if (
        datastreamsCollection.features &&
        datastreamsCollection.features.length > 0
      ) {
        const datastreamId = datastreamsCollection.features[0].id;
        console.log(`6️⃣  Getting details for datastream: "${datastreamId}"...`);

        const datastream = await datastreamsClient.get(datastreamId);
        console.log(`   ID: ${datastream.id}`);
        console.log(`   Type: ${datastream.type}`);

        if (datastream.properties) {
          console.log(`   Name: ${datastream.properties.name || 'N/A'}`);

          if (datastream.properties.observedProperty) {
            console.log(
              `   Observed Property: ${JSON.stringify(
                datastream.properties.observedProperty
              )}`
            );
          }

          if (datastream.properties.unitOfMeasurement) {
            console.log(
              `   Unit of Measurement: ${JSON.stringify(
                datastream.properties.unitOfMeasurement
              )}`
            );
          }
        }
        console.log('');
      }
    } catch (error) {
      console.log(`   No datastreams available on this endpoint`);
      console.log('');
    }

    // 7️⃣ List observations
    console.log('7️⃣  Listing all observations...');
    try {
      const observationsCollection = await observationsClient.list();

      console.log(
        `   Found ${
          observationsCollection.features?.length || 0
        } observation(s):\n`
      );
      observationsCollection.features
        ?.slice(0, 5)
        .forEach((observation, idx) => {
          console.log(`   ${idx + 1}. ${observation.id}`);
          if (observation.properties?.phenomenonTime) {
            console.log(
              `      Phenomenon Time: ${observation.properties.phenomenonTime}`
            );
          }
          if (observation.properties?.result !== undefined) {
            console.log(
              `      Result: ${JSON.stringify(observation.properties.result)}`
            );
          }
        });

      if (
        observationsCollection.features &&
        observationsCollection.features.length > 5
      ) {
        console.log(
          `   ... and ${observationsCollection.features.length - 5} more`
        );
      }
      console.log('');
    } catch (error) {
      console.log(`   No observations available on this endpoint`);
      console.log('');
    }

    // 8️⃣ List deployments
    console.log('8️⃣  Listing all deployments...');
    try {
      const deploymentsCollection = await deploymentsClient.list();

      console.log(
        `   Found ${
          deploymentsCollection.features?.length || 0
        } deployment(s):\n`
      );
      deploymentsCollection.features?.slice(0, 5).forEach((deployment, idx) => {
        console.log(`   ${idx + 1}. ${deployment.id}`);
        if (deployment.properties?.name) {
          console.log(`      Name: ${deployment.properties.name}`);
        }
        if (deployment.properties?.validTime) {
          console.log(
            `      Valid Time: ${JSON.stringify(
              deployment.properties.validTime
            )}`
          );
        }
      });

      if (
        deploymentsCollection.features &&
        deploymentsCollection.features.length > 5
      ) {
        console.log(
          `   ... and ${deploymentsCollection.features.length - 5} more`
        );
      }
      console.log('');
    } catch (error) {
      console.log(`   No deployments available on this endpoint`);
      console.log('');
    }

    console.log('✅ Example completed successfully!\n');
    console.log('💡 Note: This example uses fixture data by default.');
    console.log(
      '   To test with a live endpoint, set the CSAPI_API_ROOT environment variable:'
    );
    console.log(
      '   CSAPI_API_ROOT=https://your-csapi-endpoint.com node examples/csapi-query.js\n'
    );
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
main();
