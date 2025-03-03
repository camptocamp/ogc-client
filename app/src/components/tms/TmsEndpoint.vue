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
      <ItemsTree
        :items="endpoint.getLayers()"
        style="min-height: 200px; max-height: 400px; overflow: auto"
      >
        <template v-slot="{ item }">
          <div :title="item.abstract">
            <a
                href
                @click="handleLayerClick(item, $event)"
                class="link-light"
                >{{ item.title }} 
                <template v-if="item.srs">({{ item.srs }})</template> <template v-if="item.extension">({{ item.extension }})</template></a
              >
          </div>
        </template>
      </ItemsTree>
      <div v-if="loadingLayerDetails" class="mt-3">Loading layer details...</div>
      <TmsLayerInfo
        v-if="selectedLayerDetails && !loadingLayerDetails"
        :tileMapLayer="selectedLayerDetails"
        :endpoint="endpoint"
      ></TmsLayerInfo>
    </div>
    <div v-if="error">Error: {{ error }}</div>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import TmsLayerInfo from './TmsLayerInfo.vue';
import TmsEndpoint from '../../../../src/tms/endpoint';

export default {
  name: 'TmsEndpoint',
  components: { TmsLayerInfo, ItemsTree, InfoList },
  data: () => ({
    loading: false,
    loadingLayerDetails: false,
    error: null,
    layerError: null,
    endpoint: null,
    url: 'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/',
    selectedLayer: null,
    selectedLayerDetails: null,
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
      this.endpoint = new TmsEndpoint(this.url);
      try {
        await this.endpoint.isReady();
      } catch (e) {
        this.error = e.message;
      }
      this.loading = false;
    },
    async handleLayerClick(layer, event) {
      event.preventDefault();
      this.selectedLayer = this.endpoint.getLayerByHref(layer.href);
      
      // Show loading indicator while fetching details
      this.loadingLayerDetails = true;
      this.layerError = null;
      
      try {
        // Fetch detailed layer information including metadata
        this.selectedLayerDetails = await this.endpoint.getLayerDetails(layer.href);
      } catch (e) {
        this.layerError = e.message;
        // Fall back to basic layer information if detailed fetch fails
        this.selectedLayerDetails = this.selectedLayer;
      } finally {
        this.loadingLayerDetails = false;
      }
    },
  },
};
</script>

<style scoped></style>
