/**
 * STAC API Query Example
 *
 * This example demonstrates how to use the StacEndpoint class to query
 * a STAC API endpoint and retrieve collections and items.
 *
 * Run with: node examples/stac-query.js
 */

import { StacEndpoint } from '../dist/dist-node.js';

// STAC API base URL
const STAC_API_URLS = [
  'https://api.stac.teledetection.fr',
  'https://catalog.maap.eo.esa.int/catalogue',
  'https://stac.dataspace.copernicus.eu/v1/'
];

async function main(STAC_API_URL) {
  try {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║         STAC API Query Example                        ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Create STAC endpoint
    console.log(`📡 Connecting to STAC API: ${STAC_API_URL}\n`);
    const stac = new StacEndpoint(STAC_API_URL);

    // Get endpoint information
    console.log('1️⃣  Getting endpoint information...');
    const info = await stac.info;
    console.log(`   Title: ${info.title || 'N/A'}`);
    console.log(`   Description: ${info.description}`);
    console.log(`   STAC Version: ${info.stacVersion}`);
    console.log(`   Conformance Classes: ${info.conformsTo?.length || 0}`);
    console.log('');

    // Check capabilities
    const isStac = await stac.isStacApi;
    const supportsOgc = await stac.supportsOgcFeatures;
    console.log(`   ✓ STAC API Core: ${isStac ? 'Yes' : 'No'}`);
    console.log(`   ✓ OGC API Features: ${supportsOgc ? 'Yes' : 'No'}`);
    console.log('');

    // List all collections
    console.log('2️⃣  Listing all collections...');
    const collections = await stac.allCollections;
    console.log(`   Found ${collections.length} collection(s):\n`);
    collections.slice(0, 5).forEach((id, idx) => {
      console.log(`   ${idx + 1}. ${id}`);
    });
    if (collections.length > 5) {
      console.log(`   ... and ${collections.length - 5} more`);
    }
    console.log('');

    // Get detailed information about a collection that has proper STAC items
    // Use AeolusL0ProductsB16 if available, otherwise fall back to first collection
    if (collections.length > 0) {
      const collectionId = collections.includes('AeolusL0ProductsB16')
        ? 'AeolusL0ProductsB16'
        : collections[0];
      console.log(`3️⃣  Getting details for collection: "${collectionId}"...`);
      const collection = await stac.getCollection(collectionId);

      console.log(`   Title: ${collection.title || 'N/A'}`);
      console.log(
        `   Description: ${collection.description.substring(0, 100)}${
          collection.description.length > 100 ? '...' : ''
        }`
      );
      console.log(`   License: ${collection.license}`);

      if (collection.keywords && collection.keywords.length > 0) {
        console.log(
          `   Keywords: ${collection.keywords.slice(0, 5).join(', ')}`
        );
      }

      if (collection.providers && collection.providers.length > 0) {
        console.log(`   Provider: ${collection.providers[0].name}`);
      }

      // Spatial extent
      if (collection.extent.spatial.bbox.length > 0) {
        const bbox = collection.extent.spatial.bbox[0];
        console.log(`   Spatial Extent: [${bbox.join(', ')}]`);
      }

      // Temporal extent
      if (collection.extent.temporal.interval.length > 0) {
        const interval = collection.extent.temporal.interval[0];
        console.log(
          `   Temporal Extent: ${interval[0] || 'open'} to ${
            interval[1] || 'open'
          }`
        );
      }

      // Assets
      if (collection.assets) {
        const assetKeys = Object.keys(collection.assets);
        console.log(
          `   Collection Assets: ${assetKeys.length} (${assetKeys
            .slice(0, 3)
            .join(', ')}${assetKeys.length > 3 ? '...' : ''})`
        );
      }

      // Summaries
      if (collection.summaries) {
        const summaryKeys = Object.keys(collection.summaries);
        console.log(`   Summaries: ${summaryKeys.join(', ')}`);
      }
      console.log('');

      // Query items from the collection
      console.log(`4️⃣  Querying items from collection: "${collectionId}"...`);
      console.log('   Parameters: limit=5\n');

      const items = await stac.getCollectionItems(collectionId, {
        limit: 5,
      });

      console.log(`   Found ${items.length} item(s):\n`);
      items.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.id}`);
        console.log(`      Date: ${item.properties.datetime || 'N/A'}`);

        if (item.bbox) {
          console.log(`      BBox: [${item.bbox.join(', ')}]`);
        }

        if (item.properties.platform) {
          console.log(`      Platform: ${item.properties.platform}`);
        }

        if (item.properties.gsd) {
          console.log(`      GSD: ${item.properties.gsd}m`);
        }

        const assetCount = Object.keys(item.assets).length;
        const assetKeys = Object.keys(item.assets).slice(0, 3).join(', ');
        console.log(
          `      Assets: ${assetCount} (${assetKeys}${
            assetCount > 3 ? '...' : ''
          })`
        );
        console.log('');
      });

      // Demonstrate pagination using next links (STAC standard approach)
      console.log(`4️⃣b Demonstrating pagination via next links...`);
      console.log('   Querying with limit=2 to get paginated results\n');

      const firstPage = await stac.getCollectionItemsResponse(collectionId, {
        limit: 2,
      });

      console.log(`   First page: ${firstPage.features.length} item(s)`);
      firstPage.features.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.id}`);
      });

      // Check for next link
      const nextLink = firstPage.links?.find((link) => link.rel === 'next');
      if (nextLink) {
        console.log(`\n   Following "next" link for pagination...`);
        console.log(`   Next URL: ${nextLink.href}`);

        // Fetch next page using the link
        const nextPage = await fetch(nextLink.href).then((r) => r.json());
        console.log(`\n   Second page: ${nextPage.features.length} item(s)`);
        nextPage.features.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.id}`);
        });
      } else {
        console.log(`   No more pages available`);
      }
      console.log('');

      // Demonstrate filtering by bounding box
      console.log(`5️⃣  Querying items with spatial filter...`);

      // Use the first item's bbox (if available) to ensure we get results
      // This is more reliable than using the collection extent
      let filterBbox;
      if (items.length > 0 && items[0].bbox) {
        const itemBbox = items[0].bbox;

        // Optionally expand the bbox slightly to potentially capture nearby items
        const expansion = 0.5; // degrees
        filterBbox = [
          itemBbox[0] - expansion, // minX (longitude)
          itemBbox[1] - expansion,  // minY (latitude)
          itemBbox[2] + expansion,  // maxX (longitude)
          itemBbox[3] + expansion,   // maxY (latitude)
        ];

        console.log(
          `   Using bbox from first item (expanded by ${expansion}°)`
        );
        console.log(
          `   BBox: [${filterBbox.map((v) => v.toFixed(2)).join(', ')}]`
        );
        console.log(`   Limit: 5\n`);

        const filteredItems = await stac.getCollectionItems(collectionId, {
          bbox: filterBbox,
          limit: 5,
        });

        console.log(`   Found ${filteredItems.length} item(s) in bbox`);
        filteredItems.forEach((item, idx) => {
          console.log(
            `   ${idx + 1}. ${item.id} - ${item.properties.datetime || 'N/A'}`
          );
        });
        console.log('');
      } else {
        console.log(`   Skipped: No items with bbox available\n`);
      }

      // Demonstrate datetime filtering
      console.log(`6️⃣  Querying items with temporal filter...`);

      // Use the collection's temporal extent to ensure we get results
      const temporalInterval = collection.extent.temporal.interval[0];
      let startDate, endDate;

      if (temporalInterval && temporalInterval[0]) {
        // If collection has temporal extent, query within it
        startDate = new Date(temporalInterval[0]);

        // Query a 30-day window starting from the collection's start date
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);

        // If end date exceeds collection extent, use collection's end date
        if (temporalInterval[1]) {
          const collectionEnd = new Date(temporalInterval[1]);
          if (endDate > collectionEnd) {
            endDate = collectionEnd;
          }
        }
      } else {
        // Fallback: query recent data if no temporal extent
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      console.log(
        `   Date range: ${startDate.toISOString().split('T')[0]} to ${
          endDate.toISOString().split('T')[0]
        }`
      );
      console.log(`   Limit: 5\n`);

      const recentItems = await stac.getCollectionItems(collectionId, {
        datetime: { start: startDate, end: endDate },
        limit: 5,
      });

      console.log(`   Found ${recentItems.length} item(s) in date range`);
      recentItems.forEach((item, idx) => {
        console.log(
          `   ${idx + 1}. ${item.id} - ${item.properties.datetime || 'N/A'}`
        );
      });
      console.log('');

      // Get a single item
      if (items.length > 0) {
        const itemId = items[0].id;
        console.log(`7️⃣  Getting single item: "${itemId}"...`);
        const singleItem = await stac.getCollectionItem(collectionId, itemId);

        console.log(`   ID: ${singleItem.id}`);
        console.log(`   Type: ${singleItem.type}`);
        console.log(`   Collection: ${singleItem.collection}`);
        console.log(`   Geometry Type: ${singleItem.geometry?.type || 'null'}`);

        // Show asset details
        console.log(`\n   Assets (${Object.keys(singleItem.assets).length}):`);
        Object.entries(singleItem.assets)
          .slice(0, 5)
          .forEach(([key, asset]) => {
            console.log(`     • ${key}:`);
            console.log(`       Type: ${asset.type || 'N/A'}`);
            console.log(`       Roles: ${asset.roles?.join(', ') || 'N/A'}`);
            if (asset.title) {
              console.log(`       Title: ${asset.title}`);
            }
          });
        console.log('');
      }

      // Build a custom query URL
      console.log(`8️⃣  Building custom query URL...`);
      const customUrl = await stac.getCollectionItemsUrl(collectionId, {
        limit: 10,
        bbox: filterBbox,
        datetime: { start: startDate },
      });
      console.log(`   URL: ${customUrl}`);
      console.log('');
    }

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
for (const STAC_API_URL of STAC_API_URLS) {
  await main(STAC_API_URL);
}
