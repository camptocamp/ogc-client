<template>
  <div class="card-body pb-0">
    <h3 class="mb-3" :id="`type-${apiElement.name.toLowerCase()}`">
      {{ apiElement.name }}
      <a
        class="header-anchor"
        :href="`#type-${apiElement.name.toLowerCase()}`"
        :aria-label="`Permalink to “${apiElement.name}”`"
      >
        ​
      </a>
    </h3>
    <CodeBlock v-if="apiElement.isAlias" :html="apiElement.alias"></CodeBlock>
    <h4 v-if="apiElement.properties.length > 0">Properties</h4>
    <template
      v-if="apiElement.isInterface"
      v-for="property in apiElement.properties"
    >
      <p>
        <small class="badge-property">🌱️ PROPERTY</small>
        <code>{{ property.name }}</code>
      </p>
      <CodeBlock :html="property.signature"></CodeBlock>
      <MarkdownBlock
        v-if="property.descriptionHtml"
        class="mb-2 small"
        :html="property.descriptionHtml"
      />
    </template>
    <MarkdownBlock class="small mt-2" :text="apiElement.descriptionHtml" />
  </div>
</template>

<script setup>
import MarkdownBlock from './MarkdownBlock.vue';
import CodeBlock from './CodeBlock.vue';

const props = defineProps(['apiElement', 'markdownRenderer']);
const apiElement = props.apiElement;
</script>

<style scoped>
.badge-property {
  border: 1px solid var(--vp-c-yellow-2);
  border-radius: 4px;
  color: var(--vp-c-yellow-2);
  padding: 2px 3px;
  margin-right: 4px;
}
</style>
