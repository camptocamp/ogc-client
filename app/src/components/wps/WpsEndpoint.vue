<template>
  <div>
    <div class="d-flex flex-row my-4">
      <input
        class="form-control me-3"
        placeholder="Enter a WPS endpoint URL here"
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
      <h4>Available Processes</h4>
      <ItemsTree
        :items="endpoint.getProcesses()"
        style="min-height: 200px; max-height: 400px; overflow-y: auto"
      >
        <template v-slot="{ item }">
          <div :title="item.abstract">
            <a
              href
              @click="handleProcessClick(item, $event)"
              class="link-light"
              >{{ item.title || item.identifier }}</a
            >
          </div>
        </template>
      </ItemsTree>
      <WpsProcessInfo
        v-if="selectedProcess"
        :process="selectedProcess"
        :endpoint="endpoint"
      ></WpsProcessInfo>
    </div>
    <div v-if="error" class="text-danger">Error: {{ error }}</div>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import WpsProcessInfo from './WpsProcessInfo.vue';
import WpsEndpoint from '../../../../src/wps/endpoint';

export default {
  name: 'WpsEndpoint',
  components: { WpsProcessInfo, ItemsTree, InfoList },
  data: () => ({
    loading: false,
    error: null,
    endpoint: null,
    url: 'https://sextant.ifremer.fr/services/wps3/demo',
    selectedProcess: null,
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
      this.selectedProcess = null;
      this.endpoint = new WpsEndpoint(this.url);
      try {
        await this.endpoint.isReady();
      } catch (e) {
        this.error = e.message;
      }
      this.loading = false;
    },
    handleProcessClick(process, event) {
      event.preventDefault();
      this.selectedProcess = process;
    },
  },
};
</script>

<style scoped></style>
