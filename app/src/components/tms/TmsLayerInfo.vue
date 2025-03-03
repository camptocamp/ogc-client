<template>
  <div class="mt-4">
    <h3>{{ tileMapLayer.title }}</h3>
    
    <!-- Basic layer information -->
    <div class="card mb-3">
      <div class="card-header">Basic Information</div>
      <div class="card-body">
        <InfoList :info="{
          'href': tileMapLayer.href,
          'srs': tileMapLayer.srs,
          'profile': tileMapLayer.profile,
          'extension': tileMapLayer.extension || 'N/A'
        }"></InfoList>
      </div>
    </div>
    
    <!-- Metadata section -->
    <div v-if="tileMapLayer.metadata && tileMapLayer.metadata.length > 0" class="card mb-3">
      <div class="card-header">Metadata</div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Type</th>
                <th>MIME Type</th>
                <th>Resource</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in tileMapLayer.metadata" :key="index">
                <td>{{ item.type }}</td>
                <td>{{ item.mimeType }}</td>
                <td>
                  <a :href="item.href" target="_blank" class="text-break">
                    {{ item.href }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Bounding box section -->
    <div v-if="tileMapLayer.bounds" class="card mb-3">
      <div class="card-header">Bounding Box</div>
      <div class="card-body">
        <InfoList :info="{
          'CRS': tileMapLayer.bounds.crs,
          'MinX': tileMapLayer.bounds.minx,
          'MinY': tileMapLayer.bounds.miny,
          'MaxX': tileMapLayer.bounds.maxx,
          'MaxY': tileMapLayer.bounds.maxy
        }"></InfoList>
      </div>
    </div>
    
    <!-- Tile format section -->
    <div v-if="tileMapLayer.tileFormat" class="card mb-3">
      <div class="card-header">Tile Format</div>
      <div class="card-body">
        <InfoList :info="{
          'Width': tileMapLayer.tileFormat.width,
          'Height': tileMapLayer.tileFormat.height,
          'MIME Type': tileMapLayer.tileFormat.mimeType,
          'Extension': tileMapLayer.tileFormat.extension
        }"></InfoList>
      </div>
    </div>
    
    <!-- Tile sets section -->
    <div v-if="tileMapLayer.tileSets && tileMapLayer.tileSets.length > 0" class="card mb-3">
      <div class="card-header">Tile Sets ({{ tileMapLayer.tileSets.length }})</div>
      <div class="card-body">
        <div class="accordion" id="tileSetAccordion">
          <div class="accordion-item" v-for="(tileSet, index) in tileMapLayer.tileSets.slice(0, maxVisibleTileSets)" :key="index">
            <h2 class="accordion-header" :id="'heading' + index">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" :data-bs-target="'#collapse' + index" aria-expanded="false" :aria-controls="'collapse' + index">
                Level {{ tileSet.order }} ({{ tileSet.unitsPerPixel }} units/pixel)
              </button>
            </h2>
            <div :id="'collapse' + index" class="accordion-collapse collapse" :aria-labelledby="'heading' + index">
              <div class="accordion-body">
                <InfoList :info="{
                  'href': tileSet.href,
                  'order': tileSet.order,
                  'unitsPerPixel': tileSet.unitsPerPixel,
                  'minRow': tileSet.minRow,
                  'maxRow': tileSet.maxRow,
                  'minCol': tileSet.minCol,
                  'maxCol': tileSet.maxCol
                }"></InfoList>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Show more/less button for tile sets -->
        <div v-if="tileMapLayer.tileSets.length > defaultMaxVisibleTileSets" class="text-center mt-3">
          <button @click="toggleTileSetVisibility" class="btn btn-sm btn-outline-primary">
            {{ showAllTileSets ? 'Show Less' : 'Show All Tile Sets' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-break {
  word-break: break-all;
}
</style>

<script>
import InfoList from '../presentation/InfoList.vue';

export default {
  name: 'TmsLayerInfo',
  components: { InfoList },
  props: {
    /** @type {{ new(): TileMapLayerDetails}} */
    tileMapLayer: Object,
    /** @type {{ new(): TmsEndpoint}} */
    endpoint: Object,
  },
  data() {
    return {
      showAllTileSets: false,
      defaultMaxVisibleTileSets: 5
    };
  },
  computed: {
    maxVisibleTileSets() {
      if (!this.tileMapLayer.tileSets) return 0;
      return this.showAllTileSets ? this.tileMapLayer.tileSets.length : this.defaultMaxVisibleTileSets;
    }
  },
  methods: {
    toggleTileSetVisibility() {
      this.showAllTileSets = !this.showAllTileSets;
    }
  }
};
</script>
