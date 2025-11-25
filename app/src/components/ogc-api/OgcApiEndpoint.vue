<template>
  <div>
    <div class="d-flex flex-row my-4">
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

        <!-- CSAPI Capabilities Section -->
        <div v-if="result.hasConnectedSystemsApi" class="csapi-section mt-4">
          <h5 class="csapi-header">CSAPI Capabilities</h5>
          <dl class="small csapi-grid">
            <template v-for="cap in csapiResourceLabels" :key="cap.key">
              <dt class="d-flex flex-row" style="gap: 0.5rem">
                <span>{{ cap.label }}</span>
                <div
                  class="flex-grow-1"
                  style="
                    border-top: 2px solid #e0e0e0;
                    margin-top: 0.7em;
                    min-width: 6px;
                  "
                ></div>
              </dt>
              <dd>
                <span :class="result.csapiCapabilities[cap.key] ? 'text-success' : 'text-muted'">
                  {{ result.csapiCapabilities[cap.key] ? 'true' : 'false' }}
                </span>
              </dd>
            </template>
          </dl>
        </div>

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
    csapiResourceLabels: [
      { key: 'hasSystems', label: 'Has Systems' },
      { key: 'hasDatastreams', label: 'Has Datastreams' },
      { key: 'hasObservations', label: 'Has Observations' },
      { key: 'hasDeployments', label: 'Has Deployments' },
      { key: 'hasProcedures', label: 'Has Procedures' },
      { key: 'hasSamplingFeatures', label: 'Has Sampling Features' },
      { key: 'hasProperties', label: 'Has Properties' },
      { key: 'hasCommands', label: 'Has Commands' },
      { key: 'hasControlStreams', label: 'Has Control Streams' },
      { key: 'hasSystemEvents', label: 'Has System Events' },
      { key: 'hasSystemHistory', label: 'Has System History' },
      { key: 'hasFeasibility', label: 'Has Feasibility' },
    ],
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
        this.endpoint.hasConnectedSystemsApi,
        this.endpoint.csapiCapabilities,
      ]).then(
        ([
          info,
          hasTiles,
          hasStyles,
          hasRecords,
          hasFeatures,
          collections,
          hasEnvironmentalDataRetrieval,
          hasConnectedSystemsApi,
          csapiCapabilities,
        ]) => ({
          info: {
            ...info,
            hasTiles,
            hasStyles,
            hasRecords,
            hasFeatures,
            hasEnvironmentalDataRetrieval,
            hasConnectedSystemsApi,
          },
          collections,
          hasConnectedSystemsApi,
          csapiCapabilities,
        })
      );
    },
  },
};
</script>

<style scoped>
.csapi-section {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.csapi-header {
  color: #495057;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.csapi-grid {
  display: grid;
  grid-template-columns: 0fr auto;
  grid-gap: 0.5rem 1rem;
  margin-bottom: 0;
}

.csapi-grid dt {
  grid-column: 1;
}

.csapi-grid dd {
  grid-column: 2;
  margin-bottom: 0;
}

.text-success {
  color: #28a745;
  font-weight: 500;
}

.text-muted {
  color: #6c757d;
}
</style>
