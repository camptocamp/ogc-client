<template>
  <div>
    <div class="d-flex flex-row my-4">
      <input
        class="form-control me-3"
        placeholder="Enter a TMS endpoint URL here"
        v-model="url"
      />
      <div class="spacer-s"></div>
      <button type="button" class="btn btn-primary" @click="createEndpoint()">
        Analyze
      </button>
    </div>
    <div v-if="loading">Loading...</div>
    <div v-if="loaded">
      <InfoList :info="info" />
      <h4>Available Tile Maps</h4>
      <ItemsTree
        :items="tilemaps"
        style="min-height: 200px; max-height: 400px; overflow-y: auto"
      >
        <template v-slot="{ item }">
          <div :title="item.title">
            <a
              href
              @click="handleTileMapClick(item, $event)"
              class="link-light"
            >
              {{ item.title }} ({{ item.srs }})
            </a>
          </div>
        </template>
      </ItemsTree>
      <!-- Display detailed tilemap info using our new component -->
      <TileMapDetails v-if="selectedTileMap" :tileMap="selectedTileMap" />
    </div>
    <div v-if="error" class="text-danger">Error: {{ error }}</div>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import TileMapDetails from './TileMapDetails.vue';
import TmsEndpoint from '../../../../src/tms/endpoint';

export default {
  name: 'TmsEndpoint',
  components: { ItemsTree, InfoList, TileMapDetails },
  data: () => ({
    loading: false,
    error: null,
    endpoint: null,
    info: {},
    tilemaps: [],
    selectedTileMap: null,
    url: 'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0',
  }),
  computed: {
    loaded() {
      return this.endpoint && !this.loading && !this.error;
    },
  },
  methods: {
    async createEndpoint() {
      this.error = null;
      this.loading = true;
      this.selectedTileMap = null;

      try {
        this.endpoint = new TmsEndpoint(this.url);

        // Using getters instead of methods
        const [tmsDocument, tileMaps] = await Promise.all([
          this.endpoint.tileMapServiceInfo,
          this.endpoint.allTileMaps,
        ]);

        this.info = {
          title: tmsDocument.title || 'TMS Endpoint',
          description: tmsDocument.abstract || 'TMS endpoint information',
        };

        this.tilemaps = tileMaps || [];
      } catch (e) {
        this.error = e.message;
        console.error('Error loading TMS endpoint:', e);
      } finally {
        this.loading = false;
      }
    },

    async handleTileMapClick(tileMap, event) {
      event.preventDefault();
      // Optionally, store a copy of the clicked tileMap reference
      this.selectedTileMap = tileMap;
      try {
        // getTileMapInfo remains a method since it takes a parameter
        const tmInfo = await this.endpoint.getTileMapInfo(tileMap.href);
        // Update selectedTileMap with full resource info
        this.selectedTileMap = tmInfo;
      } catch (e) {
        this.error = e.message;
        console.error('Error fetching TileMap info:', e);
      }
    },
  },
};
</script>

<style scoped>
/* Add any component-specific styles if needed */
</style>
