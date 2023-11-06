<template>
  <div>
    <div class="d-flex flex-row">
      <input
        class="form-control me-3"
        placeholder="Enter a WFS service URL here"
        v-model="url"
      />
      <div class="spacer-s"></div>
      <button type="button" class="btn btn-primary" @click="createEndpoint()">
        Analyze
      </button>
    </div>
    <div v-if="loading">Loading...</div>
    <div v-if="loaded">
      <InfoList :info="endpoint.getServiceInfo()"></InfoList>
      <ItemsTree :items="endpoint.getFeatureTypes()" style="min-height: 200px">
        <template v-slot="{ item }">
          <div :title="item.abstract">
            <template v-if="item.name">
              <a
                href
                @click="handleItemClick(item, $event)"
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
      <WfsFeatureTypeInfo
        v-if="selectedFeatureType"
        :feature-type="selectedFeatureType"
        :endpoint="endpoint"
      ></WfsFeatureTypeInfo>
    </div>
    <div v-if="error">Error: {{ error }}</div>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import WfsFeatureTypeInfo from './WfsFeatureTypeInfo.vue';
import WfsEndpoint from '../../../../src/wfs/endpoint';

export default {
  name: 'WfsEndpoint',
  components: { WfsFeatureTypeInfo, ItemsTree, InfoList },
  data: () => ({
    loading: false,
    error: null,
    endpoint: null,
    url: 'https://ahocevar.com/geoserver/wfs',
    selectedFeatureType: null,
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
      this.endpoint = new WfsEndpoint(this.url);
      try {
        await this.endpoint.isReady();
      } catch (e) {
        this.error = e.message;
      }
      this.loading = false;
    },
    async handleItemClick(layer, event) {
      event.preventDefault();
      this.selectedFeatureType = await this.endpoint.getFeatureTypeFull(
        layer.name
      );
    },
  },
};
</script>

<style scoped></style>
