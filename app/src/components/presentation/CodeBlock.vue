<template>
  <pre
    class="rounded small"
  ><code v-bind:class='lang + " p-3"'><slot></slot></code></pre>
</template>

<script>
export default {
  name: 'CodeBlock',
  props: ['lang'],
};
</script>

<style scoped></style>
