<template>
  <div class="pico">
    <div style="display: flex; flex-direction: row; gap: 16px">
      <input
        autofocus
        placeholder="Enter a WPS endpoint URL here"
        v-model="url"
        @keydown.enter="createEndpoint()"
      />
      <button type="button" @click="createEndpoint()">Analyze</button>
    </div>
    <Async v-if="loadPromise" :promise="loadPromise">
      <template v-slot:then="{ result: endpoint }">
        <InfoList :info="endpoint.getServiceInfo()"></InfoList>
        <h4>Available Processes</h4>
        <ItemsTree
          :items="endpoint.getProcesses()"
          style="min-height: 200px; max-height: 500px; overflow-y: auto"
        >
          <template v-slot="{ item }">
            <div :title="item.abstract">
              <!-- target attribute makes sure vitepress router does not handle the click -->
              <a href target @click="handleProcessClick(item, $event)">{{
                item.title || item.identifier
              }}</a>
            </div>
          </template>
        </ItemsTree>
        <WpsProcessInfo
          v-if="selectedProcess"
          :process="selectedProcess"
          :endpoint="endpoint"
        ></WpsProcessInfo>
      </template>
    </Async>
  </div>
</template>

<script>
import InfoList from '../presentation/InfoList.vue';
import ItemsTree from '../presentation/ItemsTree.vue';
import WpsProcessInfo from './WpsProcessInfo.vue';
import WpsEndpoint from '../../../../src/wps/endpoint';
import Async from '../presentation/Async.vue';

export default {
  name: 'WpsEndpoint',
  components: { Async, WpsProcessInfo, ItemsTree, InfoList },
  data: () => ({
    loadPromise: null,
    url: 'https://sextant.ifremer.fr/services/wps3/demo',
    selectedProcess: null,
  }),
  methods: {
    createEndpoint() {
      this.selectedProcess = null;
      const endpoint = new WpsEndpoint(this.url);
      this.loadPromise = endpoint.isReady();
    },
    handleProcessClick(process, event) {
      event.preventDefault();
      this.selectedProcess = process;
    },
  },
};
</script>

<style scoped></style>
