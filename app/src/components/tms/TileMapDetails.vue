<template>
  <div>
    <h6>Tile Map Details</h6>
    <InfoList :info="tileMapInfo" />

    <div v-if="tileMap.tileSets && tileMap.tileSets.length > 0">
      <h6>Tile Sets</h6>
      <InfoList :info="tileMap.tileSets"></InfoList>
    </div>

    <div v-if="tileMap.metadata && tileMap.metadata.length > 0">
      <h6>Metadata</h6>
      <InfoList :info="tileMap.metadata"></InfoList>
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
    tileMapInfo() {
      return {
        title: this.tileMap.title,
        abstract: this.tileMap.abstract,
        Version: this.tileMap.version,
        'Tile Map Service': this.tileMap.tileMapService,
        'Spatial Reference': this.tileMap.srs,
        profile: this.tileMap.profile,
        origin: this.tileMap.origin,
        tileFormat: this.tileMap.tileFormat,
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
