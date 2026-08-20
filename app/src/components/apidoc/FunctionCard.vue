<template>
  <br />
  <hr />
  <div class="card-body pb-0">
    <h3 class="mb-3" :id="`function-${apiElement.name.toLowerCase()}`">
      <code>{{ apiElement.name }}()</code>
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
    <table v-if="apiElement.parameters?.length > 0">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="parameter in apiElement.parameters">
          <td>
            <code>{{ parameter.name }}</code>
          </td>
          <td><code v-html="parameter.signature"></code></td>
          <td>
            <MarkdownBlock
              v-if="parameter.descriptionHtml"
              class="mb-2 small"
              :html="parameter.descriptionHtml"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <table v-if="!!apiElement.returns">
      <thead>
        <tr>
          <th>Return type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code v-html="apiElement.returns"></code></td>
          <td>
            <MarkdownBlock
              v-if="apiElement.returnsDescriptionHtml"
              class="mb-2 small"
              :html="apiElement.returnsDescriptionHtml"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <MarkdownBlock :html="apiElement.descriptionHtml" />
  </div>
  <br />
</template>

<script setup>
import MarkdownBlock from './MarkdownBlock.vue';
import CodeBlock from './CodeBlock.vue';

const props = defineProps(['apiElement', 'markdownRenderer']);
const apiElement = props.apiElement;
</script>

<style scoped></style>
