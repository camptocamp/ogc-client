<template>
  <div class="pico">
    <div style="display: flex; flex-direction: row; gap: 16px">
      <input
        autofocus
        placeholder="Enter a WMS service URL here"
        v-model="url"
        @keydown.enter="createEndpoint()"
      />
      <button type="button" @click="createEndpoint()">Analyze</button>
    </div>
    <Async v-if="loadPromise" :promise="loadPromise">
      <template v-slot:then="{ result: endpoint }">
        <InfoList :info="endpoint.getServiceInfo()"></InfoList>
        <ItemsTree
          :items="endpoint.getLayers()"
          style="min-height: 200px; max-height: 500px; overflow: auto"
        >
          <template v-slot="{ item }">
            <div :title="item.abstract">
              <template v-if="item.name">
                <!-- target attribute makes sure vitepress router does not handle the click -->
                <a
                  href
                  target
                  @click="handleLayerClick(endpoint, item, $event)"
                  >{{ item.title }}</a
                >
              </template>
              <template v-else>
                <span>{{ item.title }}</span>
              </template>
            </div>
          </template>
        </ItemsTree>
        <WmsLayerInfo
          v-if="selectedLayer"
          :layer="selectedLayer"
          :endpoint="endpoint"
        ></WmsLayerInfo>
      </template>
    </Async>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import WmsLayerInfo from './WmsLayerInfo.vue';
import WmsEndpoint from '../../../../src/wms/endpoint';
import Async from '../presentation/Async.vue';

export default {
  name: 'WmsEndpoint',
  components: { Async, WmsLayerInfo, ItemsTree, InfoList },
  data: () => ({
    loadPromise: null,
    url: 'https://data.geopf.fr/wms-r/wms',
    selectedLayer: null,
  }),
  methods: {
    createEndpoint() {
      this.selectedLayer = null;
      const endpoint = new WmsEndpoint(this.url);
      this.loadPromise = endpoint.isReady();
    },
    handleLayerClick(endpoint, layer, event) {
      this.selectedLayer = endpoint.getLayerByName(layer.name);
      event.preventDefault();
    },
  },
};
</script>

<style scoped></style>
