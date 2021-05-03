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
      <ServiceInfo :info="endpoint.getServiceInfo()"></ServiceInfo>
      <div class="spacer-s"></div>
      <ItemsTree
        :items="endpoint.getLayers()"
        class="scroll-y"
        style="height: 25rem"
      >
        <template v-slot="{ item }">
          <div :title="item.abstract">
            <template v-if="item.name">
              <a href>{{ item.title }}</a>
            </template>
            <template v-else>
              <span>{{ item.title }}</span>
            </template>
          </div>
        </template>
      </ItemsTree>
    </div>
    <div v-if="error">Error: {{ error }}</div>
  </div>
</template>

<script>
import WmsEndpoint from '../../../src/wms/endpoint';
import ServiceInfo from './presentation/ServiceInfo';
import ItemsTree from './presentation/ItemsTree';

export default {
  name: 'WmsEndpoint',
  components: { ItemsTree, ServiceInfo },
  data: () => ({
    loading: false,
    error: null,
    endpoint: null,
    url: 'https://ahocevar.com/geoserver/wms',
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
  },
};
</script>

<style scoped></style>
