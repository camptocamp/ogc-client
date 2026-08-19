<template><div v-html="html"></div></template>

<script>
export default {
  name: 'MarkdownBlock',
  props: {
    html: String,
  },
};
</script>

<style scoped></style>
