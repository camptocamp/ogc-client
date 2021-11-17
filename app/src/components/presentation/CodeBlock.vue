<template>
  <pre><code v-bind:class='lang + " border-0 rounded-2 p-3"'><slot></slot></code></pre>
</template>

<script>
export default {
  name: 'CodeBlock',
  props: ['lang'],
};
</script>

<style scoped></style>
