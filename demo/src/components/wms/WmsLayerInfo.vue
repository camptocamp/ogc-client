<template>
  <div>
    <p>{{ layer.title }}</p>
    <div class="spacer-s"></div>
    <InfoList :info="layerInfo"></InfoList>
  </div>
</template>

<style scoped></style>

<script>
import InfoList from '../presentation/InfoList';
export default {
  name: 'WmsLayerInfo',
  components: { InfoList },
  props: {
    /** @type {WmsLayerFull} */
    layer: Object,
  },
  computed: {
    layerInfo() {
      return {
        title: this.layer.title,
        name: this.layer.name,
        ...(this.layer.abstract && { abstract: this.layer.abstract }),
        ...(this.layer.attribution &&
          this.layer.attribution.title && {
            attribution: this.layer.attribution.title,
          }),
      };
    },
  },
};
</script>
