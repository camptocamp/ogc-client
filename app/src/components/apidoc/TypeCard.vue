<template>
  <br />
  <hr />
  <div class="card-body pb-0">
    <h3 class="mb-3" :id="`type-${apiElement.name.toLowerCase()}`">
      <code>{{ apiElement.name }}</code>
      <a
        class="header-anchor"
        :href="`#type-${apiElement.name.toLowerCase()}`"
        :aria-label="`Permalink to “${apiElement.name}”`"
      >
        ​
      </a>
    </h3>
    <CodeBlock v-if="apiElement.isAlias" :html="apiElement.alias"></CodeBlock>

    <table v-if="apiElement.isInterface && apiElement.properties.length > 0">
      <thead>
        <tr>
          <th>Property</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="property in apiElement.properties">
          <td>
            <code>{{ property.name }}</code>
          </td>
          <td><code v-html="property.signature"></code></td>
          <td>
            <MarkdownBlock
              v-if="property.descriptionHtml"
              class="mb-2 small"
              :html="property.descriptionHtml"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <MarkdownBlock class="small mt-2" :text="apiElement.descriptionHtml" />
  </div>
  <br />
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
