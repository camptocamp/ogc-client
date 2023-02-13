<template>
  <div>
    <div class="d-flex flex-row">
      <input
        class="form-control me-3"
        placeholder="Enter an OGC API endpoint URL here"
        v-model="url"
      />
      <div class="spacer-s"></div>
      <button type="button" class="btn btn-primary" @click="createEndpoint()">
        Analyze
      </button>
    </div>
    <Async v-if="endpointSummary" :promise="endpointSummary">
      <template v-slot:then="{ result }">
        <InfoList :info="result.info"></InfoList>
        <ItemsTree :items="result.collections" style="min-height: 200px">
          <template v-slot="{ item }">
            <span>{{ item }}</span>
          </template>
        </ItemsTree>
      </template>
    </Async>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList';
import ItemsTree from '../presentation/ItemsTree';
import Async from '../presentation/Async';
import OgcApiEndpoint from '../../../../dist/ogc-api/endpoint';

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
      ]).then(
        ([
          info,
          hasTiles,
          hasStyles,
          hasRecords,
          hasFeatures,
          collections,
        ]) => ({
          info: {
            ...info,
            hasTiles,
            hasStyles,
            hasRecords,
            hasFeatures,
          },
          collections,
        })
      );
    },
  },
};
</script>

<style scoped></style>
