<template>
  <div>
    <p>{{ layer.title }}</p>
    <div class="spacer-s"></div>
    <InfoList :info="layerInfo"></InfoList>
    <div class="spacer-s"></div>
    <div>
      Selected style:&nbsp;
      <select v-model="selectedStyle">
        <option v-for="style in layer.styles" :value="style.name">
          {{ style.title }}
        </option>
      </select>
      <div class="spacer-m"></div>
      Selected CRS:&nbsp;
      <select v-model="selectedCrs">
        <option v-for="crs in layer.availableCrs">
          {{ crs }}
        </option>
      </select>
    </div>
    <div class="spacer-s"></div>
    <img :src="fullMapSrc" alt="layer preview" />
  </div>
</template>

<style scoped></style>

<script>
import InfoList from '../presentation/InfoList';
export default {
  name: 'WmsLayerInfo',
  components: { InfoList },
  props: {
    /** @type {{ new(): WmsLayerFull}} */
    layer: Object,
    endpointUrl: String,
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
      };
    },
    fullMapSrc() {
      if (!(this.selectedCrs in this.layer.boundingBoxes)) {
        return '';
      }
      const bbox = this.layer.boundingBoxes[this.selectedCrs];
      const ratio = (bbox[2] - bbox[0]) / (bbox[3] - bbox[1]);
      const maxDimension = 500;
      const width = Math.round(ratio > 1 ? maxDimension : maxDimension * ratio);
      const height = Math.round(width / ratio);

      const urlObj = new URL(this.endpointUrl);
      urlObj.searchParams.set('SERVICE', 'WMS');
      urlObj.searchParams.set('REQUEST', 'GetMap');
      urlObj.searchParams.set('LAYERS', this.layer.name);
      urlObj.searchParams.set('STYLES', this.selectedStyle);
      urlObj.searchParams.set('WIDTH', width.toString());
      urlObj.searchParams.set('HEIGHT', height.toString());
      urlObj.searchParams.set('FORMAT', 'image/png');
      urlObj.searchParams.set('CRS', this.selectedCrs);
      urlObj.searchParams.set('BBOX', bbox.join(','));
      return urlObj.toString();
    },
  },
};
</script>
