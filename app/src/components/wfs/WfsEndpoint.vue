<template>
  <div class="pico">
    <div style="display: flex; flex-direction: row; gap: 16px">
      <input
        autofocus
        placeholder="Enter a WFS service URL here"
        v-model="url"
        @keydown.enter="createEndpoint()"
      />
      <button type="button" @click="createEndpoint()">Analyze</button>
    </div>
    <Async v-if="loadPromise" :promise="loadPromise">
      <template v-slot:then="{ result: endpoint }">
        <InfoList :info="endpoint.getServiceInfo()"></InfoList>
        <ItemsTree
          :items="endpoint.getFeatureTypes()"
          style="min-height: 200px; max-height: 500px; overflow-y: auto"
        >
          <template v-slot="{ item }">
            <div :title="item.abstract">
              <template v-if="item.name">
                <!-- target attribute makes sure vitepress router does not handle the click -->
                <a
                  href
                  target
                  @click="handleItemClick(endpoint, item, $event)"
                  >{{ item.title }}</a
                >
              </template>
              <template v-else>
                <span>{{ item.title }}</span>
              </template>
            </div>
          </template>
        </ItemsTree>
        <Async v-if="loadFeatureTypePromise" :promise="loadFeatureTypePromise">
          <template v-slot:then="{ result: selectedFeatureType }">
            <WfsFeatureTypeInfo
              v-if="selectedFeatureType"
              :feature-type="selectedFeatureType"
              :endpoint="endpoint"
            ></WfsFeatureTypeInfo
          ></template>
        </Async>
      </template>
    </Async>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import WfsFeatureTypeInfo from './WfsFeatureTypeInfo.vue';
import WfsEndpoint from '../../../../src/wfs/endpoint';
import Async from '../presentation/Async.vue';

export default {
  name: 'WfsEndpoint',
  components: { Async, WfsFeatureTypeInfo, ItemsTree, InfoList },
  data: () => ({
    loadPromise: null,
    url: 'https://data.geopf.fr/wfs/ows',
    loadFeatureTypePromise: null,
  }),
  methods: {
    createEndpoint() {
      this.loadFeatureTypePromise = null;
      const endpoint = new WfsEndpoint(this.url);
      this.loadPromise = endpoint.isReady();
    },
    handleItemClick(endpoint, layer, event) {
      event.preventDefault();
      this.loadFeatureTypePromise = endpoint.getFeatureTypeFull(layer.name);
    },
  },
};
</script>

<style scoped></style>
