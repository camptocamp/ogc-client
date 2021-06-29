<template>
  <div>
    <div>
      <input placeholder="Enter a WMS service URL here" v-model="url" />
      <div class="spacer-s"></div>
      <button type="button" @click="createEndpoint()">Analyze</button>
    </div>
    <div class="spacer-s"></div>
    <div v-if="loading">Loading...</div>
    <div v-if="loaded">
      <InfoList :info="endpoint.getServiceInfo()"></InfoList>
      <div class="spacer-s"></div>
      <div
        class="flex-row flex-align-stretch"
        style="min-height: 200px; max-height: 650px"
      >
        <ItemsTree
          :items="endpoint.getLayers()"
          class="scroll-y flex-grow flex-shrink"
        >
          <template v-slot="{ item }">
            <div :title="item.abstract">
              <template v-if="item.name">
                <a href @click="handleLayerClick(item, $event)">{{
                  item.title
                }}</a>
              </template>
              <template v-else>
                <span>{{ item.title }}</span>
              </template>
            </div>
          </template>
        </ItemsTree>
        <div class="spacer-s"></div>
        <div class="flex-grow">
          <WmsLayerInfo
            v-if="selectedLayer"
            :layer="selectedLayer"
            :endpoint-url="url"
          ></WmsLayerInfo>
        </div>
      </div>
    </div>
    <div v-if="error">Error: {{ error }}</div>
  </div>
</template>

<script>
import WmsEndpoint from '../../../../src/wms/endpoint';
import InfoList from '../presentation/InfoList';
import ItemsTree from '../presentation/ItemsTree';
import WmsLayerInfo from './WmsLayerInfo';

export default {
  name: 'WmsEndpoint',
  components: { WmsLayerInfo, ItemsTree, InfoList },
  data: () => ({
    loading: false,
    error: null,
    endpoint: null,
    url: 'https://ahocevar.com/geoserver/wms',
    selectedLayer: null,
  }),
  computed: {
    loaded() {
      return this.endpoint && this.loading === false && this.error === null;
    },
  },
  methods: {
    async createEndpoint() {
      this.error = null;
      this.loading = true;
      this.endpoint = new WmsEndpoint(this.url);
      try {
        await this.endpoint.isReady();
      } catch (e) {
        this.error = e.message;
      }
      this.loading = false;
    },
    handleLayerClick(layer, event) {
      this.selectedLayer = this.endpoint.getLayerByName(layer.name);
      event.preventDefault();
    },
  },
};
</script>

<style scoped></style>
