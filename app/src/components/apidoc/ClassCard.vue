<template>
  <br />
  <hr />
  <div class="card-body">
    <h3 :id="`class-${apiElement.name.toLowerCase()}`">
      <code>{{ apiElement.name }}</code>
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
    <CodeBlock :html="apiElement.constructorSignature"></CodeBlock>
    <table v-if="apiElement.constructor?.parameters?.length > 0">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="parameter in apiElement.constructor.parameters">
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
    <MarkdownBlock
      v-if="apiElement.constructorDescriptionHtml"
      :html="apiElement.constructorDescriptionHtml"
    />

    <h4 v-if="apiElement.extends?.length > 0">🌱️ Extends</h4>
    <template v-for="extended in apiElement.extends" style="display: contents">
      <CodeBlock :html="extended.signature"></CodeBlock>
    </template>

    <h4 v-if="apiElement.properties?.length > 0">💡 Accessors</h4>
    <table v-if="apiElement.properties?.length > 0">
      <thead>
        <tr>
          <th>Accessor</th>
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

    <h4 v-if="apiElement.methods?.length > 0">⚡️ Methods</h4>
    <template v-for="method in apiElement.methods" style="display: contents">
      <br />
      <h5>
        <code>{{ method.name }}()</code>
      </h5>
      <CodeBlock :html="method.signature"></CodeBlock>
      <table v-if="method.parameters?.length > 0">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="parameter in method.parameters">
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
      <table v-if="!!method.returns">
        <thead>
          <tr>
            <th>Return type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code v-html="method.returns"></code></td>
            <td>
              <MarkdownBlock
                v-if="method.returnsDescriptionHtml"
                class="mb-2 small"
                :html="method.returnsDescriptionHtml"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <MarkdownBlock
        v-if="method.descriptionHtml"
        :html="method.descriptionHtml"
      />
    </template>
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
