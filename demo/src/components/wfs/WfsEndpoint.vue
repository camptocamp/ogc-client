<template>
  <div>
    <div>
      <input placeholder="Enter a WFS service URL here" v-model="url" />
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
          :items="endpoint.getFeatureTypes()"
          class="scroll-y flex-grow flex-shrink"
        >
          <template v-slot="{ item }">
            <div :title="item.abstract">
              <template v-if="item.name">
                <a href @click="handleItemClick(item, $event)">{{
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
          <WfsFeatureTypeInfo
            v-if="selectedFeatureType"
            :feature-type="selectedFeatureType"
            :endpoint-url="url"
          ></WfsFeatureTypeInfo>
        </div>
      </div>
    </div>
    <div v-if="error">Error: {{ error }}</div>
  </div>
</template>

<script>
import WfsEndpoint from '../../../../src/wfs/endpoint';
import InfoList from '../presentation/InfoList';
import ItemsTree from '../presentation/ItemsTree';
import WfsFeatureTypeInfo from './WfsFeatureTypeInfo';

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
      this.selectedFeatureType = await this.endpoint.getFeatureTypeInformation(
        layer.name
      );
    },
  },
};
</script>

<style scoped></style>
