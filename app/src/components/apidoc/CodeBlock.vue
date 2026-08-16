<template>
  <div class="language-js">
    <pre style="white-space: normal">
        <code v-html="html"></code>
      </pre>
  </div>
</template>

<script>
export default {
  name: 'CodeBlock',
  props: ['html'],
};
</script>

<style scoped></style>
