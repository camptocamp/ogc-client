<template>
  <div class="card mb-4">
    <div class="card-header text-uppercase fs-6">
      <span class="me-3 fs-4">●</span>function
    </div>
    <div class="card-body pb-0">
      <h5 class="mb-3">
        <code
          >{{ apiElement.name }}() <span class="fs-5">⇢</span>
          {{ apiElement.return.type }}</code
        >
      </h5>
      <CodeBlock lang="js" class="mb-3">
        <pre>
import { {{ apiElement.name }} } from '@camptocamp/ogc-client';</pre
        >
      </CodeBlock>
      <MarkdownBlock :text="apiElement.description" />
    </div>
  </div>
</template>

<script>
import MarkdownBlock from '../presentation/MarkdownBlock';
import CodeBlock from '../presentation/CodeBlock';

export default {
  name: 'FunctionCard',
  components: { MarkdownBlock, CodeBlock },
  props: {
    apiElement: Object,
  },
};
</script>

<style scoped>
.card-header {
  color: rgb(38, 202, 81);
  background: rgba(38, 202, 81, 0.03);
}
</style>
