<template>
  <div id="app">
    <h1 class="text-l text-bold padding-m align-right bg-dark text-white"></h1>
    <section class="padding-m text-l">
      <strong>ogc-client</strong>
    </section>

    <h1 class="text-l text-bold padding-m align-right bg-dark text-white">
      Introduction
    </h1>
    <section class="padding-m">
      This is the demo app for the <strong>ogc-client</strong> library.
    </section>

    <h1 class="text-l text-bold padding-m align-right bg-dark text-white">
      WMS
    </h1>
    <section class="padding-m">
      <p>
        Enter a WMS service URL below to get some information and a list of
        layers from it.
      </p>
      <div class="spacer-m"></div>
      <WmsEndpoint></WmsEndpoint>
    </section>
  </div>
</template>

<style>
#app {
  display: grid;
  grid-template-columns: 15rem auto;
  height: 100%;
}

h1 {
  grid-column: 1;
}
h1:nth-last-of-type(1) {
  height: 1fr;
}

section {
  grid-column: 2;
}
</style>

<script>
import './style/reset.css';
import './style/generics.css';
import './style/helpers.css';
import WmsEndpoint from './components/WmsEndpoint';

export default {
  name: 'App',
  components: { WmsEndpoint },
};
</script>
