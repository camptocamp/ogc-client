<template>
  <div class="container">
    <div class="col-8 offset-2">
      <h1
        class="title text-center"
        style="font-size: 5em; margin: 130px 0 70px"
      >
        <LibLogo></LibLogo>
      </h1>

      <div
        class="d-flex flex-row justify-content-center"
        style="margin-bottom: 70px"
      >
        <button
          type="button"
          class="btn btn-primary tab-toggle m-3"
          :class="{ 'tab-toggle-enabled': !demoTabEnabled }"
          @click="demoTabEnabled = false"
        >
          DOCS
        </button>
        <button
          type="button"
          class="btn btn-primary tab-toggle m-3"
          :class="{ 'tab-toggle-enabled': demoTabEnabled }"
          @click="demoTabEnabled = true"
        >
          TRY IT!
        </button>
      </div>

      <Docs v-if="!demoTabEnabled"></Docs>
      <Demo v-if="demoTabEnabled"></Demo>
    </div>
  </div>
</template>

<script>
import './style/global.css';
import LibLogo from './components/presentation/LibLogo';
import Docs from './Docs';
import Demo from './Demo';

export default {
  name: 'App',
  components: { Docs, LibLogo, Demo },
  data: () => ({
    demoTabEnabled: false,
  }),
};
</script>

<style scoped>
.tab-toggle {
  font-family: 'Comfortaa';
  font-size: 1em;
  color: var(--brand-dark);
  padding: 1em 1.2em 0.9em 1.2em;
  line-height: 1em;
  font-weight: bold;
  border-radius: 100px;
  background: transparent;
  border-color: var(--brand-dark-hover);
}
.tab-toggle:hover {
  background: var(--brand-dark-shadow);
}
.tab-toggle:focus {
  box-shadow: 0 0 0 0.25rem var(--brand-dark-shadow);
}
.tab-toggle-enabled {
  color: white;
  background: var(--brand-dark);
}
.tab-toggle-enabled:hover {
  background: var(--brand-dark-hover);
}
</style>
