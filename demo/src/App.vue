<template>
  <div id="app">
    <h1></h1>
    <section class="padding-m text-l">
      <strong>ogc-client</strong>
    </section>

    <h1 class="text-l text-bold padding-m align-right">Introduction</h1>
    <section class="padding-m">
      This is the demo app for the <strong>ogc-client</strong> library.
    </section>

    <h1 class="text-l text-bold padding-m align-right">WMS</h1>
    <section class="padding-m">WMS stuff goes here</section>
  </div>
</template>

<style>
#app {
  display: grid;
  grid-template-columns: 30% auto;
  height: 100%;
}

h1 {
  grid-column: 1;
  background-color: #4b5563;
  color: #f9fafb;
}

section {
  grid-column: 2;
}
</style>

<script>
import './style/reset.css';
import './style/generics.css';
import './style/helpers.css';

export default {
  name: 'App',
  components: {},
};
</script>
