<template>
  <div class="card-body">
    <h3 :id="`class-${apiElement.name.toLowerCase()}`">
      {{ apiElement.name }}
      <a
        class="header-anchor"
        :href="`#class-${apiElement.name.toLowerCase()}`"
        :aria-label="`Permalink to “${apiElement.name}”`"
      >
        ​
      </a>
    </h3>
    <MarkdownBlock :html="apiElement.importHtml"></MarkdownBlock>
    <MarkdownBlock :html="apiElement.descriptionHtml" />

    <h4>📦 Constructor</h4>
    <p>
      <CodeBlock :html="apiElement.constructorSignature"></CodeBlock>
      <MarkdownBlock
        v-if="apiElement.constructorDescriptionHtml"
        :html="apiElement.constructorDescriptionHtml"
      />
    </p>

    <template
      v-for="property in apiElement.properties"
      style="display: contents"
    >
      <p>
        <small class="badge-accessor">🌱️ ACCESSOR</small>
        <code>{{ property.name }}</code>
      </p>
      <CodeBlock :html="property.signature"></CodeBlock>
      <MarkdownBlock
        v-if="property.descriptionHtml"
        :html="property.descriptionHtml"
      />
    </template>

    <template v-for="method in apiElement.methods" style="display: contents">
      <p>
        <small class="badge-method">⚡️ METHOD</small>
        <code>{{ method.name }}()</code>
      </p>
      <CodeBlock :html="method.signature"></CodeBlock>
      <MarkdownBlock
        v-if="method.descriptionHtml"
        :html="method.descriptionHtml"
      />
    </template>
  </div>
</template>

<script setup>
import MarkdownBlock from './MarkdownBlock.vue';
import CodeBlock from './CodeBlock.vue';

const props = defineProps(['apiElement', 'markdownRenderer']);

const apiElement = props.apiElement;
</script>

<style scoped>
.badge-method {
  border: 1px solid var(--vp-c-purple-2);
  border-radius: 4px;
  color: var(--vp-c-purple-2);
  padding: 2px 3px;
  margin-right: 4px;
}
.badge-accessor {
  border: 1px solid var(--vp-c-yellow-2);
  border-radius: 4px;
  color: var(--vp-c-yellow-2);
  padding: 2px 3px;
  margin-right: 4px;
}
</style>
