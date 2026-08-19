<template>
  <div>
    <div class="pico" style="display: flex; flex-direction: row; gap: 16px">
      <input
        autofocus
        placeholder="Enter a WMTS service URL here"
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
          style="min-height: 200px; max-height: 500px; overflow-y: auto"
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
        <WmtsLayerInfo
          v-if="selectedLayer"
          :layer="selectedLayer"
          :endpoint="endpoint"
        ></WmtsLayerInfo>
      </template>
    </Async>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import WmtsEndpoint from '../../../../src/wmts/endpoint';
import WmtsLayerInfo from '@/components/wmts/WmtsLayerInfo.vue';
import Async from '../presentation/Async.vue';

export default {
  name: 'WmtsEndpoint',
  components: { Async, WmtsLayerInfo, ItemsTree, InfoList },
  data: () => ({
    loadPromise: null,
    url: 'https://data.geopf.fr/wmts',
    selectedLayer: null,
  }),
  methods: {
    createEndpoint() {
      this.selectedLayer = null;
      const endpoint = new WmtsEndpoint(this.url);
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
