<template>
  <!-- inspired by https://github.com/byteboomers/vue-prom -->
  <div v-if="pending">
    <slot name="pending">
      <span>Loading...</span>
    </slot>
  </div>
  <div v-else-if="rejected">
    <slot name="catch" :error="rejected">
      <span class="error">Error: {{ rejected }}</span>
    </slot>
  </div>
  <div v-else>
    <slot name="then" :result="resolved">
      <span>Loaded: {{ resolved }}</span>
    </slot>
  </div>
</template>

<style scoped>
.error {
  color: darkred;
}
</style>

<script>
export default {
  name: 'Async',
  props: {
    promise: Promise,
  },
  data: () => ({
    pending: true,
    resolved: null,
    rejected: null,
  }),
  watch: {
    promise: {
      immediate: true,
      handler(value) {
        if (value instanceof Promise) {
          this.pending = true;
          value.then(
            (resolved) => {
              this.resolved = resolved;
              this.rejected = null;
              this.pending = false;
            },
            (rejected) => {
              this.rejected = rejected;
              this.resolved = null;
              this.pending = false;
            }
          );
        } else {
          this.resolved = value;
          this.rejected = null;
          this.pending = false;
        }
      },
    },
  },
};
</script>
