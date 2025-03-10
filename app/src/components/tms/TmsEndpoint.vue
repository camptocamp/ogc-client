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
      <InfoList :info="info"></InfoList>
      <h4>Available Tile Maps</h4>
      <ItemsTree
        :items="tilemaps"
        style="min-height: 200px; max-height: 400px; overflow-y: auto"
      >
        <template v-slot="{ item }">
          <div :title="item.title">
            <a href @click="handleTileMapClick(item, $event)" class="link-light"
              >{{ item.title }} ({{ item.srs }})</a
            >
          </div>
        </template>
      </ItemsTree>
      <!-- Placeholder for future selected tilemap info component -->
      <div v-if="selectedTileMap">
        <pre>{{ selectedTileMap }}</pre>
      </div>
    </div>
    <div v-if="error">Error: {{ error }}</div>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import TmsEndpoint from '../../../../src/tms/endpoint';

export default {
  name: 'TmsEndpoint',
  components: { ItemsTree, InfoList },
  data: () => ({
    loading: false,
    error: null,
    endpoint: null,
    info: {},
    tilemaps: [],
    selectedTileMap: null,
    url: 'https://data.geopf.fr/tms/1.0.0/',
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

        // Updated method calls: getEndpointInfo() and getAllTileMaps()
        const [tmsDocument, tileMaps] = await Promise.all([
          this.endpoint.getEndpointInfo(),
          this.endpoint.getAllTileMaps(),
        ]);

        // Note: version was removed from the endpoint info so it is not set here.
        this.info = {
          title: tmsDocument.title || 'TMS Endpoint',
          description: tmsDocument.abstract || 'TMS endpoint information',
        };

        this.tilemaps = tileMaps || [];
        console.log('TMS Document loaded:', this.info);
        console.log('Available TileMaps:', this.tilemaps);
      } catch (e) {
        this.error = e.message;
        console.error('Error loading TMS endpoint:', e);
      } finally {
        this.loading = false;
      }
    },

    async handleTileMapClick(tileMap, event) {
      event.preventDefault();
      this.selectedTileMap = tileMap;
      console.log('Selected TileMap:', tileMap);
      console.log('TileMap href:', tileMap.href);
      const tmInfo = await this.endpoint.getTileMapInfo(tileMap.href);
      console.log('TileMap Info:', tmInfo);
    },
  },
};
</script>

<style scoped></style>
