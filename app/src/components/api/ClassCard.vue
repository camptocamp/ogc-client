<template>
  <div class="card mb-4">
    <AnchorLink :href="apiElement.name"></AnchorLink>
    <div class="card-header text-uppercase small border-bottom-0 py-1 px-3">
      class
    </div>
    <div class="card-body pb-0">
      <h5 class="mb-3">
        <code v-html="className"></code>
      </h5>
      <CodeBlock lang="js" class="mb-3">
        <pre>
import { {{ apiElement.name }} } from '@camptocamp/ogc-client';</pre
        >
      </CodeBlock>
      <div class="row">
        <div
          class="col-3 text-uppercase text-secondary fw-bold pt-1"
          style="font-size: 0.8em"
        >
          📦 constructor
        </div>
        <div class="col">
          <code class="mb-2" v-html="constructorSignature"></code>
          <MarkdownBlock
            v-if="getDescription(constructorElement)"
            class="mb-2 small"
            :text="getDescription(constructorElement)"
          />
        </div>
      </div>
      <div class="row" v-for="property in properties">
        <div
          class="col-3 text-uppercase text-secondary fw-bold pt-1"
          style="font-size: 0.8em"
        >
          💡 property
        </div>
        <div class="col">
          <code class="mb-2" v-html="formatProperty(property)"></code>
          <MarkdownBlock
            v-if="getDescription(property)"
            class="mb-2 small"
            :text="getDescription(property)"
          />
        </div>
      </div>
      <div class="row" v-for="method in methods">
        <div
          class="col-3 text-uppercase text-secondary fw-bold pt-1"
          style="font-size: 0.8em"
        >
          ⚡ method
        </div>
        <div class="col">
          <code class="mb-2" v-html="formatMethod(method)"></code>
          <div class="row pb-2">
            <div
              class="col-3 text-uppercase text-secondary fw-bold pt-1"
              style="font-size: 0.8em"
            >
              🌱️ returns
            </div>
            <div class="col">
              <code v-html="formatMethodReturned(method)"></code>
            </div>
          </div>
          <MarkdownBlock
            v-if="getDescription(method)"
            class="mb-2 small"
            :text="getDescription(method)"
          />
        </div>
      </div>
      <MarkdownBlock
        class="mb-3 mt-2 small"
        :text="getDescription(apiElement)"
      />
    </div>
  </div>
</template>

<script setup>
import MarkdownBlock from '../presentation/MarkdownBlock.vue';
import CodeBlock from '../presentation/CodeBlock.vue';
import * as marked from 'marked';
import {
  formatClassToString,
  formatConstructorToString,
  formatFunctionToString,
  formatTypeToString,
  getDescription,
} from '../../api-utils';
import { computed } from 'vue';
import AnchorLink from '@/components/presentation/AnchorLink.vue';

const props = defineProps(['apiElement']);

const apiElement = props.apiElement;
const constructorElement = computed(() =>
  apiElement.children.find((item) => item.name === 'constructor')
);
const properties = computed(() =>
  apiElement.children.filter(
    (item) => item.kind & 262144 /* ReflectionKind.Accessor */
  )
);
const methods = computed(() =>
  apiElement.children.filter(
    (item) => item.kind & 2048 /* ReflectionKind.Method */
  )
);

function formatMethod(method) {
  return marked.parseInline(formatFunctionToString(method));
}
function formatMethodReturned(method) {
  return marked.parseInline(formatTypeToString(method?.signatures?.[0]?.type));
}
function formatProperty(property) {
  return marked.parseInline(
    `${property.name}: ${formatTypeToString(property.getSignature.type)}`
  );
}
const className = computed(() =>
  marked.parseInline(formatClassToString(apiElement))
);
const constructorSignature = computed(() =>
  marked.parseInline(
    formatConstructorToString(apiElement, constructorElement.value)
  )
);
</script>

<style scoped>
.card-header {
  color: rgb(234, 108, 0);
  background: rgba(234, 108, 0, 0.03);
  letter-spacing: 2.5px;
  opacity: 0.6;
}
</style>
