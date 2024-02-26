<template>
  <div>
    <p>{{ layer.title }}</p>
    <InfoList :info="layer"></InfoList>
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
        Selected matrix set:&nbsp;
        <select
          v-model="selectedMatrixSet"
          class="form-select d-inline-block w-auto"
        >
          <option v-for="(matrixSet, index) in layer.matrixSets" :value="index">
            {{ matrixSet.identifier }}
          </option>
        </select>
      </label>
    </div>
    <div
      ref="map-root"
      style="width: 100%; height: 300px; margin-top: 10px"
    ></div>
  </div>
</template>

<style scoped></style>

<script>
import InfoList from '../presentation/InfoList.vue';
import Map from 'ol/Map';
import View from 'ol/View';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';

// this is necessary for tile reprojection to work
register(proj4);

async function addWmtsLayer(olMap) {
  const endpoint = await new WmtsEndpoint(
    'https://my.server.org/wmts'
  ).isReady();
  const layer = endpoint.getLayers()[0];
  const matrixSetLink = layer.matrixSets[0];
  const tileGrid = await endpoint.getOpenLayersTileGrid(
    layer.name,
    matrixSetLink.identifier
  );
  const resourceLink = layer.resourceLinks[0];
  const dimensions = endpoint.getDefaultDimensions(layer.name);
  const olLayer = new TileLayer({
    source: new WMTS({
      layer: this.layer.name,
      matrixSet: matrixSetLink.identifier,
      format: resourceLink.format,
      url: resourceLink.url,
      requestEncoding: resourceLink.encoding,
      tileGrid,
      projection: matrixSetLink.crs,
      dimensions,
    }),
  });
  olMap.addLayer(olLayer);
}

export default {
  name: 'WmtsLayerInfo',
  components: { InfoList },
  props: {
    /** @type {{ new(): WmtsLayer}} */
    layer: Object,
    /** @type {{ new(): WmtsEndpoint}} */
    endpoint: Object,
  },
  data: () =>
    /**
     * @type {Object}
     * @property {Map} olMap
     * @property {string} selectedStyle
     * @property {string} selectedMatrixSet
     */ ({
      selectedStyle: '',
      selectedMatrixSet: 0,
      olMap: null,
    }),
  watch: {
    layer: {
      immediate: true,
      async handler(newVal) {
        this.selectedStyle = newVal.defaultStyle || newVal.styles[0]?.name;
        this.selectedMatrixSet = 0;
        const matrixSetLink = newVal.matrixSets[this.selectedMatrixSet];
        const tileGrid = await this.endpoint.getOpenLayersTileGrid(
          this.layer.name,
          matrixSetLink.identifier
        );
        if (!this.olMap) {
          this.olMap = new Map({
            target: this.$refs['map-root'],
            layers: [
              new TileLayer({
                source: new OSM(),
              }),
            ],
            view: new View({
              zoom: 2,
              center: [0, 0],
            }),
          });
        } else {
          this.olMap.getLayers().pop();
        }
        const resourceLink = this.layer.resourceLinks[0];
        const dimensions = this.endpoint.getDefaultDimensions(this.layer.name);
        const layer = new TileLayer({
          source: new WMTS({
            layer: this.layer.name,
            style: this.selectedStyle,
            matrixSet: matrixSetLink.identifier,
            format: resourceLink.format,
            url: resourceLink.url,
            requestEncoding: resourceLink.encoding,
            tileGrid,
            projection: matrixSetLink.crs,
            dimensions,
          }),
        });
        this.olMap.addLayer(layer);
      },
    },
  },
};
</script>
