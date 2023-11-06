<template>
  <div class="card mb-4">
    <div class="card-header text-uppercase small border-bottom-0 py-1 px-3">
      function
    </div>
    <div class="card-body pb-0">
      <h5 class="mb-3">
        <code v-html="signature"></code>
      </h5>
      <CodeBlock lang="js" class="mb-3">
        <pre>
import { {{ apiElement.name }} } from '@camptocamp/ogc-client';</pre
        >
      </CodeBlock>
      <div class="row pb-2">
        <div
          class="col-3 text-uppercase text-secondary fw-bold pt-1"
          style="font-size: 0.8em"
        >
          🌱 returns
        </div>
        <div class="col">
          <code v-html="returned"></code>
        </div>
      </div>
      <MarkdownBlock class="small mt-2" :text="apiElement.description" />
    </div>
  </div>
</template>

<script>
import MarkdownBlock from '../presentation/MarkdownBlock.vue';
import CodeBlock from '../presentation/CodeBlock.vue';
import { formatFunctionToString, formatTypeToString } from '../../api-utils';
import * as marked from 'marked';

export default {
  name: 'FunctionCard',
  components: { MarkdownBlock, CodeBlock },
  props: {
    apiElement: Object,
  },
  computed: {
    signature() {
      return marked.parseInline(formatFunctionToString(this.apiElement));
    },
    returned() {
      return marked.parseInline(formatTypeToString(this.apiElement.return));
    },
  },
};
</script>

<style scoped>
.card-header {
  color: rgb(38, 202, 81);
  background: rgba(38, 202, 81, 0.03);
  letter-spacing: 2.5px;
  opacity: 0.6;
}
</style>
