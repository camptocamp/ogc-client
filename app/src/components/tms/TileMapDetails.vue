<template>
  <div>
    <h5>{{ tileMap.title }}</h5>
    <p v-if="tileMap.abstract" class="text-muted">{{ tileMap.abstract }}</p>

    <h6 class="mt-3">Tile Map Details</h6>
    <InfoList :info="tileMapInfo" />

    <div v-if="tileMap.tileSets && tileMap.tileSets.length > 0" class="mt-3">
      <h6>Tile Sets</h6>
      <div class="d-flex flex-row flex-wrap gap-2 mb-2">
        <span class="badge bg-secondary"
          >{{ tileMap.tileSets.length }} available resolutions</span
        >
        <span class="badge bg-secondary">{{ tileMap.srs }}</span>
      </div>

      <table class="table table-sm table-striped">
        <thead>
          <tr>
            <th>Order</th>
            <th>Units/Pixel</th>
            <th>Href</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tileSet, index) in tileMap.tileSets" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ tileSet.unitsPerPixel }}</td>
            <td>
              <code class="small">{{ tileSet.href }}</code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="tileMap.boundingBox" class="mt-3">
      <h6>Bounding Box</h6>
      <table class="table table-sm">
        <tr>
          <th>Min X</th>
          <td>{{ boundingBoxValues[0] }}</td>
          <th>Min Y</th>
          <td>{{ boundingBoxValues[1] }}</td>
        </tr>
        <tr>
          <th>Max X</th>
          <td>{{ boundingBoxValues[2] }}</td>
          <th>Max Y</th>
          <td>{{ boundingBoxValues[3] }}</td>
        </tr>
      </table>
    </div>

    <div v-if="tileMap.metadata && tileMap.metadata.length > 0" class="mt-3">
      <h6>Metadata</h6>
      <table class="table table-sm table-striped">
        <thead>
          <tr>
            <th>Type</th>
            <th>MIME Type</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in tileMap.metadata" :key="index">
            <td>{{ item.type }}</td>
            <td>{{ item.mimeType }}</td>
            <td>
              <a :href="item.href" target="_blank" class="small">{{
                item.href
              }}</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';

export default {
  name: 'TileMapDetails',
  components: { InfoList },
  props: {
    tileMap: {
      type: Object,
      required: true,
    },
  },
  computed: {
    boundingBoxValues() {
      return this.tileMap.boundingBox || [null, null, null, null];
    },
    tileMapInfo() {
      return {
        Version: this.tileMap.version,
        'Tile Map Service': this.tileMap.tileMapService,
        'Spatial Reference': this.tileMap.srs,
        Profile: this.tileMap.profile,
        Origin: this.tileMap.origin
          ? `x: ${this.tileMap.origin.x}, y: ${this.tileMap.origin.y}`
          : null,
        'Tile Format': this.tileMap.tileFormat?.mimeType,
        'Tile Size': this.tileMap.tileFormat
          ? `${this.tileMap.tileFormat.width} × ${this.tileMap.tileFormat.height}`
          : null,
        Extension: this.tileMap.tileFormat?.extension,
      };
    },
  },
};
</script>

<style scoped>
.badge {
  font-size: 0.9rem;
}
</style>
