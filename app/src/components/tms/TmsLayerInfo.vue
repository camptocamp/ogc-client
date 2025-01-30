<template>
  <div>
    <p>{{ tileMapLayer.title }}</p>
    <InfoList :info="tileMapLayer"></InfoList>
  </div>
</template>

<style scoped></style>

<script>
import InfoList from '../presentation/InfoList.vue';
export default {
  name: 'TmsLayerInfo',
  components: { InfoList },
  props: {
    /** @type {{ new(): TileMapLayer}} */
    tileMapLayer: Object,
    /** @type {{ new(): TmsEndpoint}} */
    endpoint: Object,
  },
};
</script>
