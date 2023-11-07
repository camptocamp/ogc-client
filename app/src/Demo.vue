<template>
  <div class="pb-5">
    <h2 class="my-4">WMS</h2>
    <p>
      Enter a WMS service URL below to get some information and a list of layers
      from it.
    </p>
    <WmsEndpoint></WmsEndpoint>

    <h2 class="my-4">WFS</h2>
    <p>
      Enter a WFS service URL below to get some information and a list of
      feature types from it.
    </p>
    <WfsEndpoint></WfsEndpoint>

    <h2 class="my-4">OGC API</h2>
    <p>
      Enter an OGC API endpoint URL below to get some information and a list of
      collections from it.
    </p>
    <OgcApiEndpoint></OgcApiEndpoint>
  </div>
</template>

<style></style>

<script>
import WmsEndpoint from './components/wms/WmsEndpoint.vue';
import WfsEndpoint from './components/wfs/WfsEndpoint.vue';
import OgcApiEndpoint from './components/ogc-api/OgcApiEndpoint.vue';

export default {
  name: 'App',
  components: { OgcApiEndpoint, WfsEndpoint, WmsEndpoint },
};
</script>
