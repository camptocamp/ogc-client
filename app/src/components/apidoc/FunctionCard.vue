<template>
  <div class="card-body pb-0">
    <h3 class="mb-3" :id="`function-${apiElement.name.toLowerCase()}`">
      {{ apiElement.name }}()
      <a
        class="header-anchor"
        :href="`#function-${apiElement.name.toLowerCase()}`"
        :aria-label="`Permalink to “${apiElement.name}”`"
      >
        ​
      </a>
    </h3>
    <MarkdownBlock :html="apiElement.importHtml"></MarkdownBlock>
    <CodeBlock :html="apiElement.signature"></CodeBlock>
    <MarkdownBlock :html="apiElement.descriptionHtml" />
  </div>
</template>

<script setup>
import MarkdownBlock from './MarkdownBlock.vue';
import CodeBlock from './CodeBlock.vue';

const props = defineProps(['apiElement', 'markdownRenderer']);
const apiElement = props.apiElement;
</script>

<style scoped>
.card-header {
  color: rgb(38, 202, 81);
  background: rgba(38, 202, 81, 0.03);
  letter-spacing: 2.5px;
  opacity: 0.6;
}
</style>
