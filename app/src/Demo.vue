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

    <h2 class="my-4">OGC EDR</h2>
    <p>
      Enter an OGC EDR endpoint URL below to get some information and a list of
      collections from it.
    </p>
    <OgcEdrEndpoint></OgcEdrEndpoint>

    <h2 class="my-4">WMTS</h2>
    <p>
      Enter a WMTS endpoint URL below to get some information and a list of
      layers from it.
    </p>
    <WmtsEndpoint></WmtsEndpoint>

    <h2 class="my-4">TMS</h2>
    <p>
      Enter a TMS endpoint URL below to get some information and a list of
      layers from it.
    </p>
    <TmsEndpoint></TmsEndpoint>
  </div>
</template>

<style></style>

<script>
import WmsEndpoint from './components/wms/WmsEndpoint.vue';
import WfsEndpoint from './components/wfs/WfsEndpoint.vue';
import OgcApiEndpoint from './components/ogc-api/OgcApiEndpoint.vue';
import OgcEdrEndpoint from './components/ogc-edr/OgcEdrEndpoint.vue';
import WmtsEndpoint from '@/components/wmts/WmtsEndpoint.vue';
import TmsEndpoint from '@/components/tms/TmsEndpoint.vue';

export default {
  name: 'App',
  components: {
    WmtsEndpoint,
    OgcApiEndpoint,
    OgcEdrEndpoint,
    WfsEndpoint,
    WmsEndpoint,
    TmsEndpoint,
  },
};
</script>
