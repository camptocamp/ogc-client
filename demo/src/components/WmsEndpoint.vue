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
      <ServiceInfo :info="serviceInfo"></ServiceInfo>
      <div class="spacer-s"></div>
      <ItemsTree :items="layers"></ItemsTree>
    </div>
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
    loading: null,
    error: null,
    serviceInfo: null,
    layers: null,
    url: 'https://ahocevar.com/geoserver/wms',
  }),
  computed: {
    loaded() {
      return this.loading === false && this.error === null;
    },
  },
  methods: {
    async createEndpoint() {
      this.loading = true;
      const endpoint = new WmsEndpoint(this.url);
      endpoint
        .getServiceInfo()
        .catch((error) => (this.error = error.message))
        .finally(() => (this.loading = false));
      this.serviceInfo = await endpoint.getServiceInfo();
      this.layers = await endpoint.getLayers();
    },
  },
};
</script>

<style scoped></style>
