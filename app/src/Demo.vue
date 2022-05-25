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
  </div>
</template>

<style></style>

<script>
import WmsEndpoint from './components/wms/WmsEndpoint';
import WfsEndpoint from './components/wfs/WfsEndpoint';

export default {
  name: 'App',
  components: { WfsEndpoint, WmsEndpoint },
};
</script>
