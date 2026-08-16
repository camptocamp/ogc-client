<template>
  <div class="pico">
    <div style="display: flex; flex-direction: row; gap: 16px">
      <input
        autofocus
        placeholder="Enter an OGC API endpoint URL here"
        v-model="url"
        @keydown.enter="createEndpoint()"
      />
      <button type="button" @click="createEndpoint()">Analyze</button>
    </div>
    <Async v-if="endpointSummary" :promise="endpointSummary">
      <template v-slot:then="{ result }">
        <InfoList :info="result.info"></InfoList>
        <ItemsTree
          :items="result.collections"
          style="min-height: 200px; max-height: 500px; overflow-y: auto"
        >
          <template v-slot="{ item }">
            <span>{{ item }}</span>
          </template>
        </ItemsTree>
      </template>
    </Async>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import Async from '../presentation/Async.vue';
import OgcApiEndpoint from '../../../../src/ogc-api/endpoint';

export default {
  name: 'OgcApiEndpoint',
  components: { Async, ItemsTree, InfoList },
  data: () => ({
    endpoint: null,
    endpointSummary: null,
    endpointCollections: null,
    url: 'https://demo.ldproxy.net/zoomstack',
  }),
  computed: {
    loaded() {
      return this.endpoint && this.loading === false && this.error === null;
    },
  },
  methods: {
    createEndpoint() {
      this.endpoint = new OgcApiEndpoint(this.url);
      this.endpointSummary = Promise.all([
        this.endpoint.info,
        this.endpoint.hasTiles,
        this.endpoint.hasStyles,
        this.endpoint.hasRecords,
        this.endpoint.hasFeatures,
        this.endpoint.allCollections,
        this.endpoint.hasEnvironmentalDataRetrieval,
      ]).then(
        ([
          info,
          hasTiles,
          hasStyles,
          hasRecords,
          hasFeatures,
          collections,
          hasEnvironmentalDataRetrieval,
        ]) => ({
          info: {
            ...info,
            hasTiles,
            hasStyles,
            hasRecords,
            hasFeatures,
            hasEnvironmentalDataRetrieval,
          },
          collections,
        }),
      );
    },
  },
};
</script>

<style scoped></style>
