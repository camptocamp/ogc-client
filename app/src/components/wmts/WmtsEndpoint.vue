<template>
  <div>
    <div class="d-flex flex-row my-4">
      <input
        class="form-control me-3"
        placeholder="Enter a WMS service URL here"
        v-model="url"
      />
      <button type="button" class="btn btn-primary" @click="createEndpoint()">
        Analyze
      </button>
    </div>
    <div v-if="loading">Loading...</div>
    <div v-if="loaded">
      <InfoList :info="endpoint.getServiceInfo()"></InfoList>
      <ItemsTree :items="endpoint.getLayers()" style="min-height: 200px">
        <template v-slot="{ item }">
          <div :title="item.abstract">
            <template v-if="item.name">
              <a
                href
                @click="handleLayerClick(item, $event)"
                class="link-light"
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
    </div>
    <div v-if="error">Error: {{ error }}</div>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import WmtsEndpoint from '../../../../src/wmts/endpoint';
import WmtsLayerInfo from '@/components/wmts/WmtsLayerInfo.vue';

export default {
  name: 'WmtsEndpoint',
  components: { WmtsLayerInfo, ItemsTree, InfoList },
  data: () => ({
    loading: false,
    error: null,
    endpoint: null,
    url: 'https://basemap.at/wmts/1.0.0/WMTSCapabilities.xml',
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
      this.endpoint = new WmtsEndpoint(this.url);
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
