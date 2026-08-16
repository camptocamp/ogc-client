<template>
  <div class="pico">
    <div style="display: flex; flex-direction: row; gap: 16px">
      <input
        autofocus
        placeholder="Enter a TMS endpoint URL here"
        v-model="url"
        @keydown.enter="createEndpoint()"
      />
      <button type="button" @click="createEndpoint()">Analyze</button>
    </div>
    <Async v-if="loadPromise" :promise="loadPromise">
      <template v-slot:then="{ result }">
        <InfoList :info="result.info" />
        <h4>Available Tile Maps</h4>
        <ItemsTree
          :items="result.tilemaps"
          style="min-height: 200px; max-height: 500px; overflow-y: auto"
        >
          <template v-slot="{ item }">
            <div :title="item.title">
              <!-- target attribute makes sure vitepress router does not handle the click -->
              <a
                href
                target
                @click="handleTileMapClick(result.endpoint, item, $event)"
              >
                {{ item.title }} ({{ item.srs }})
              </a>
            </div>
          </template>
        </ItemsTree>
        <Async v-if="loadTileMapPromise" :promise="loadTileMapPromise">
          <template v-slot:then="{ result: tileMap }">
            <TileMapDetails :tileMap="tileMap" />
          </template>
        </Async>
      </template>
    </Async>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import TileMapDetails from './TileMapDetails.vue';
import TmsEndpoint from '../../../../src/tms/endpoint';
import Async from '../presentation/Async.vue';

export default {
  name: 'TmsEndpoint',
  components: { Async, ItemsTree, InfoList, TileMapDetails },
  data: () => ({
    loadPromise: null,
    loadTileMapPromise: null,
    url: 'https://data.geopf.fr/tms/1.0.0',
  }),
  methods: {
    createEndpoint() {
      this.loadTileMapPromise = null;
      const endpoint = new TmsEndpoint(this.url);

      this.loadPromise = Promise.all([
        endpoint.tileMapServiceInfo,
        endpoint.allTileMaps,
      ]).then(([tmsDocument, tileMaps]) => ({
        info: {
          title: tmsDocument.title || 'TMS Endpoint',
          description: tmsDocument.abstract || 'TMS endpoint information',
        },
        tilemaps: tileMaps || [],
        endpoint,
      }));
    },

    handleTileMapClick(endpoint, tileMap, event) {
      event.preventDefault();
      this.loadTileMapPromise = endpoint.getTileMapInfo(tileMap.href);
    },
  },
};
</script>

<style scoped></style>
