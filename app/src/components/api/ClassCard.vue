<template>
  <div class="card mb-4">
    <div class="card-header text-uppercase fs-6">
      <span class="me-3 fs-5">●</span>class
    </div>
    <div class="card-body pb-0">
      <h5 class="mb-3">
        <code>{{ apiElement.name }}</code>
      </h5>
      <CodeBlock lang="js" class="mb-3">
        <pre>
import { {{ apiElement.name }} } from '@camptocamp/ogc-client';</pre
        >
      </CodeBlock>
      <MarkdownBlock class="mb-3" :text="apiElement.description" />
    </div>
  </div>
</template>

<script>
import MarkdownBlock from '../presentation/MarkdownBlock';
import CodeBlock from '../presentation/CodeBlock';
export default {
  name: 'ClassCard',
  components: { MarkdownBlock, CodeBlock },
  props: {
    apiElement: Object,
  },
};
</script>

<style scoped>
.card-header {
  color: rgb(234, 108, 0);
  background: rgba(234, 108, 0, 0.03);
}
</style>
