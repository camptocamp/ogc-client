<template><div v-html="parsed"></div></template>

<script>
import * as marked from 'marked';

export default {
  name: 'MarkdownBlock',
  props: {
    text: String,
  },
  computed: {
    parsed() {
      return this.text ? marked.parse(this.text) : '';
    },
  },
};
</script>

<style scoped></style>
