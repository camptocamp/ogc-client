<template>
  <div id="app" class="pos-relative">
    <div class="app-bg bg-dark"></div>

    <section class="padding-m text-l">
      <strong>ogc-client</strong>
    </section>

    <h1 class="text-l text-bold padding-m align-right text-white">
      Introduction
    </h1>
    <section class="padding-m">
      This is the demo app for the <strong>ogc-client</strong> library.
    </section>

    <h1 class="text-l text-bold padding-m align-right text-white">WMS</h1>
    <section class="padding-m">
      <p>
        Enter a WMS service URL below to get some information and a list of
        layers from it.
      </p>
      <div class="spacer-m"></div>
      <WmsEndpoint></WmsEndpoint>
    </section>

    <h1 class="text-l text-bold padding-m align-right text-white">WFS</h1>
    <section class="padding-m">
      <p>
        Enter a WFS service URL below to get some information and a list of
        feature types from it.
      </p>
      <div class="spacer-m"></div>
      <WfsEndpoint></WfsEndpoint>
    </section>
  </div>
</template>

<style>
#app {
  display: grid;
  grid-template-columns: 15rem auto;
  min-height: 100%;
  grid-auto-rows: max-content;
}

.app-bg {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 15rem;
  z-index: -1;
}

h1 {
  grid-column: 1;
}

section {
  grid-column: 2;
}
</style>

<script>
import './style/reset.css';
import './style/generics.css';
import './style/helpers.css';
import WmsEndpoint from './components/wms/WmsEndpoint';
import WfsEndpoint from './components/wfs/WfsEndpoint';

export default {
  name: 'App',
  components: { WfsEndpoint, WmsEndpoint },
};
</script>
