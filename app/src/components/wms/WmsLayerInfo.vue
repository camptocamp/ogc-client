<template>
  <div>
    <p>{{ layer.title }}</p>
    <InfoList :info="layerInfo"></InfoList>
    <div class="d-flex flex-row justify-content-between">
      <label>
        Selected style:&nbsp;
        <select
          v-model="selectedStyle"
          class="form-select d-inline-block w-auto"
        >
          <option v-for="style in layer.styles" :value="style.name">
            {{ style.title || style.name }}
          </option>
        </select>
      </label>
      <label>
        Selected CRS:&nbsp;
        <select v-model="selectedCrs" class="form-select d-inline-block w-auto">
          <option v-for="crs in layer.availableCrs">
            {{ crs }}
          </option>
        </select>
      </label>
    </div>
    <img :src="fullMapSrc" alt="layer preview" />
  </div>
</template>

<style scoped></style>

<script>
import InfoList from '../presentation/InfoList.vue';

export default {
  name: 'WmsLayerInfo',
  components: { InfoList },
  props: {
    /** @type {{ new(): WmsLayerFull}} */
    layer: Object,
    /** @type {{ new(): WmsEndpoint}} */
    endpoint: Object,
  },
  data: () => ({
    selectedStyle: '',
    selectedCrs: '',
  }),
  watch: {
    layer: {
      immediate: true,
      handler(newVal) {
        this.selectedStyle =
          newVal.styles.length > 0 ? newVal.styles[0].name : '';
        this.selectedCrs = newVal.availableCrs[0];
      },
    },
  },
  computed: {
    layerInfo() {
      return {
        name: this.layer.name,
        ...(this.layer.abstract && { abstract: this.layer.abstract }),
        ...(this.layer.attribution &&
          this.layer.attribution.title && {
            attribution: this.layer.attribution.title,
          }),
        ...(this.layer.keywords && { keywords: this.layer.keywords }),
      };
    },
    fullMapSrc() {
      if (!(this.selectedCrs in this.layer.boundingBoxes)) {
        return '';
      }
      const extent = this.layer.boundingBoxes[this.selectedCrs];
      const ratio = (extent[2] - extent[0]) / (extent[3] - extent[1]);
      const maxDimension = 500;
      const widthPx = Math.round(
        ratio > 1 ? maxDimension : maxDimension * ratio
      );
      const heightPx = Math.round(widthPx / ratio);
      return this.endpoint.getMapUrl([this.layer.name], {
        extent,
        widthPx,
        heightPx,
        crs: this.selectedCrs,
        styles: [this.selectedStyle],
        outputFormat: 'image/png',
      });
    },
  },
};
</script>
