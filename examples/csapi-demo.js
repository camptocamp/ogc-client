/**
 * OGC API - Connected Systems (CSAPI) Example
 *
 * This example demonstrates how to use the CSAPI client classes to interact
 * with an OGC API - Connected Systems endpoint. It shows how to query systems,
 * datastreams, and observations.
 *
 * Related documentation:
 * - OGC API - Connected Systems: https://github.com/opengeospatial/ogcapi-connected-systems
 * - Part 1: https://docs.ogc.org/DRAFTS/23-001.html
 * - Part 2: https://docs.ogc.org/DRAFTS/23-002.html
 *
 * Run with: node examples/csapi-demo.js
 */

import {
  SystemsClient,
  DatastreamsClient,
  ObservationsClient,
} from '../dist/dist-node.js';

// CSAPI endpoint base URL
// Replace with your actual CSAPI server endpoint
const CSAPI_API_ROOT =
  process.env.CSAPI_API_ROOT || 'https://example.csapi.server';

async function main() {
  try {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║    OGC API - Connected Systems (CSAPI) Example        ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log(`📡 Connecting to CSAPI endpoint: ${CSAPI_API_ROOT}\n`);

    // ========================================================================
    // 1. SYSTEMS - Query and retrieve system information
    // ========================================================================
    console.log('1️⃣  Working with Systems...\n');

    const systemsClient = new SystemsClient(CSAPI_API_ROOT);

    // List all systems
    console.log('   a) Listing all systems:');
    const systemsCollection = await systemsClient.list();
    console.log(`      Found ${systemsCollection.features.length} system(s)`);
    console.log(`      Collection type: ${systemsCollection.type}`);
    console.log(`      Item type: ${systemsCollection.itemType}\n`);

    // Display first few systems
    systemsCollection.features.slice(0, 3).forEach((system, idx) => {
      console.log(`      ${idx + 1}. ${system.id}`);
      if (system.name) {
        console.log(`         Name: ${system.name}`);
      }
      if (system.description) {
        const desc = system.description.substring(0, 60);
        console.log(
          `         Description: ${desc}${
            system.description.length > 60 ? '...' : ''
          }`
        );
      }
    });
    if (systemsCollection.features.length > 3) {
      console.log(
        `      ... and ${systemsCollection.features.length - 3} more`
      );
    }
    console.log('');

    // Get a specific system
    if (systemsCollection.features.length > 0) {
      const systemId = systemsCollection.features[0].id;
      console.log(
        `   b) Getting detailed information for system: "${systemId}"`
      );
      const system = await systemsClient.get(systemId);

      console.log(`      ID: ${system.id}`);
      console.log(`      Type: ${system.type}`);
      if (system.name) {
        console.log(`      Name: ${system.name}`);
      }
      if (system.description) {
        console.log(`      Description: ${system.description}`);
      }
      if (system.status) {
        console.log(`      Status: ${system.status}`);
      }

      // Show links
      if (system.links && system.links.length > 0) {
        console.log(`\n      Links (${system.links.length}):`);
        system.links.slice(0, 5).forEach((link) => {
          console.log(`        • ${link.rel}: ${link.href}`);
          if (link.title) {
            console.log(`          Title: ${link.title}`);
          }
        });
        if (system.links.length > 5) {
          console.log(`        ... and ${system.links.length - 5} more links`);
        }
      }
      console.log('');

      // Resolve linked resources
      console.log(`   c) Resolving linked resources for system: "${systemId}"`);
      const linkedResources = await systemsClient.getLinkedResources(systemId);
      const linkRels = Object.keys(linkedResources);
      console.log(`      Found ${linkRels.length} link relation(s):`);
      linkRels.slice(0, 5).forEach((rel) => {
        console.log(`        • ${rel} → ${linkedResources[rel]}`);
      });
      console.log('');

      // List system events
      console.log(`   d) Listing events for system: "${systemId}"`);
      try {
        const events = await systemsClient.listEvents(systemId);
        if (events.features && Array.isArray(events.features)) {
          console.log(`      Found ${events.features.length} event(s)`);
          events.features.slice(0, 3).forEach((event, idx) => {
            console.log(`        ${idx + 1}. ${event.id}`);
            if (event.properties?.eventType) {
              console.log(`           Type: ${event.properties.eventType}`);
            }
          });
        } else {
          console.log(`      No events found`);
        }
      } catch (err) {
        console.log(`      Unable to retrieve events: ${err.message}`);
      }
      console.log('');
    }

    // ========================================================================
    // 2. DATASTREAMS - Query and retrieve datastream information
    // ========================================================================
    console.log('2️⃣  Working with Datastreams...\n');

    const datastreamsClient = new DatastreamsClient(CSAPI_API_ROOT);

    // List all datastreams
    console.log('   a) Listing all datastreams:');
    const datastreamsCollection = await datastreamsClient.list();
    console.log(
      `      Found ${datastreamsCollection.features.length} datastream(s)`
    );
    console.log(`      Collection type: ${datastreamsCollection.type}\n`);

    // Display first few datastreams
    datastreamsCollection.features.slice(0, 3).forEach((datastream, idx) => {
      console.log(`      ${idx + 1}. ${datastream.id}`);
      if (datastream.properties?.name) {
        console.log(`         Name: ${datastream.properties.name}`);
      }
      if (datastream.properties?.description) {
        const desc = datastream.properties.description.substring(0, 60);
        console.log(
          `         Description: ${desc}${
            datastream.properties.description.length > 60 ? '...' : ''
          }`
        );
      }
    });
    if (datastreamsCollection.features.length > 3) {
      console.log(
        `      ... and ${datastreamsCollection.features.length - 3} more`
      );
    }
    console.log('');

    // Get a specific datastream
    if (datastreamsCollection.features.length > 0) {
      const datastreamId = datastreamsCollection.features[0].id;
      console.log(
        `   b) Getting detailed information for datastream: "${datastreamId}"`
      );
      const datastream = await datastreamsClient.get(datastreamId);

      console.log(`      ID: ${datastream.id}`);
      console.log(`      Type: ${datastream.type}`);
      if (datastream.properties) {
        if (datastream.properties.name) {
          console.log(`      Name: ${datastream.properties.name}`);
        }
        if (datastream.properties.description) {
          console.log(
            `      Description: ${datastream.properties.description}`
          );
        }
        if (datastream.properties.observedProperty) {
          console.log(
            `      Observed Property: ${JSON.stringify(
              datastream.properties.observedProperty
            )}`
          );
        }
        if (datastream.properties.unitOfMeasurement) {
          console.log(
            `      Unit: ${JSON.stringify(
              datastream.properties.unitOfMeasurement
            )}`
          );
        }
      }

      // Show links
      if (datastream.links && datastream.links.length > 0) {
        console.log(`\n      Links (${datastream.links.length}):`);
        datastream.links.slice(0, 5).forEach((link) => {
          console.log(`        • ${link.rel}: ${link.href}`);
        });
      }
      console.log('');
    }

    // ========================================================================
    // 3. OBSERVATIONS - Query and retrieve observation data
    // ========================================================================
    console.log('3️⃣  Working with Observations...\n');

    const observationsClient = new ObservationsClient(CSAPI_API_ROOT);

    // List all observations
    console.log('   a) Listing all observations:');
    const observationsCollection = await observationsClient.list();
    console.log(
      `      Found ${observationsCollection.features.length} observation(s)`
    );
    console.log(`      Collection type: ${observationsCollection.type}\n`);

    // Display first few observations
    observationsCollection.features.slice(0, 5).forEach((observation, idx) => {
      console.log(`      ${idx + 1}. ${observation.id}`);
      if (observation.properties) {
        if (observation.properties.phenomenonTime) {
          console.log(
            `         Time: ${observation.properties.phenomenonTime}`
          );
        }
        if (observation.properties.result !== undefined) {
          console.log(
            `         Result: ${JSON.stringify(observation.properties.result)}`
          );
        }
        if (observation.properties.resultTime) {
          console.log(
            `         Result Time: ${observation.properties.resultTime}`
          );
        }
      }
    });
    if (observationsCollection.features.length > 5) {
      console.log(
        `      ... and ${observationsCollection.features.length - 5} more`
      );
    }
    console.log('');

    // Get a specific observation
    if (observationsCollection.features.length > 0) {
      const observationId = observationsCollection.features[0].id;
      console.log(
        `   b) Getting detailed information for observation: "${observationId}"`
      );
      const observation = await observationsClient.get(observationId);

      console.log(`      ID: ${observation.id}`);
      console.log(`      Type: ${observation.type}`);
      if (observation.properties) {
        console.log('      Properties:');
        if (observation.properties.phenomenonTime) {
          console.log(
            `        Phenomenon Time: ${observation.properties.phenomenonTime}`
          );
        }
        if (observation.properties.result !== undefined) {
          console.log(
            `        Result: ${JSON.stringify(observation.properties.result)}`
          );
        }
        if (observation.properties.resultTime) {
          console.log(
            `        Result Time: ${observation.properties.resultTime}`
          );
        }
        if (observation.properties.resultQuality) {
          console.log(
            `        Quality: ${JSON.stringify(
              observation.properties.resultQuality
            )}`
          );
        }
      }

      // Show geometry if present
      if (observation.geometry) {
        console.log(`\n      Geometry:`);
        console.log(`        Type: ${observation.geometry.type}`);
        if (observation.geometry.coordinates) {
          console.log(
            `        Coordinates: ${JSON.stringify(
              observation.geometry.coordinates
            )}`
          );
        }
      }

      // Show links
      if (observation.links && observation.links.length > 0) {
        console.log(`\n      Links (${observation.links.length}):`);
        observation.links.slice(0, 5).forEach((link) => {
          console.log(`        • ${link.rel}: ${link.href}`);
        });
      }
      console.log('');
    }

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('✅ CSAPI Example completed successfully!\n');
    console.log('Key Concepts Demonstrated:');
    console.log('  • SystemsClient - Access and query connected systems');
    console.log('  • DatastreamsClient - Retrieve datastream metadata');
    console.log('  • ObservationsClient - Query observation data');
    console.log('  • Link resolution - Navigate between related resources');
    console.log('  • System events - Access temporal events for systems\n');

    console.log('Next Steps:');
    console.log(
      '  • Explore other CSAPI clients: DeploymentsClient, ProceduresClient,'
    );
    console.log(
      '    SamplingFeaturesClient, PropertiesClient, ControlStreamsClient,'
    );
    console.log('    CommandsClient, FeasibilityClient, SystemEventsClient');
    console.log('  • Implement filtering and pagination for large datasets');
    console.log('  • Use link relations to navigate between resources');
    console.log('  • Integrate with your sensor data processing workflows\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('\nNote: This example uses fixture data by default.');
    console.error(
      'To test with a live CSAPI endpoint, set the CSAPI_API_ROOT environment variable:'
    );
    console.error('  export CSAPI_API_ROOT=https://your-csapi-server.com');
    console.error('  export CSAPI_LIVE=true');
    console.error('  node examples/csapi-demo.js');
    process.exit(1);
  }
}

// Run the example
main();
