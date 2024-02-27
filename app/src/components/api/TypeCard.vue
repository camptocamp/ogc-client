<template>
  <div class="card mb-4">
    <AnchorLink :href="apiElement.name"></AnchorLink>
    <div class="card-header text-uppercase small border-bottom-0 py-1 px-3">
      type
    </div>
    <div class="card-body pb-0">
      <h5 class="mb-3">
        <code v-html="apiElement.name"></code>
      </h5>
      <div class="row" v-if="isAlias">
        <div class="col">
          <code class="mb-2" v-html="formatType(apiElement.type)"></code>
        </div>
      </div>
      <div class="row" v-if="isInterface" v-for="property in properties">
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
      <MarkdownBlock class="small mt-2" :text="getDescription(apiElement)" />
    </div>
  </div>
</template>

<script setup>
import MarkdownBlock from '../presentation/MarkdownBlock.vue';
import { formatTypeToString, getDescription } from '../../api-utils';
import { computed } from 'vue';
import * as marked from 'marked';
import AnchorLink from '@/components/presentation/AnchorLink.vue';

const props = defineProps(['apiElement']);
const apiElement = props.apiElement;

const isInterface = computed(
  () =>
    apiElement.kind & 256 /* ReflectionKind.Interface */ ||
    apiElement.kind & 65536 /* ReflectionKind.TypeLiteral */ ||
    (apiElement.kind & 2097152 /* ReflectionKind.TypeAlias */ &&
      apiElement.type.type === 'reflection' &&
      apiElement.type.declaration)
);
const isAlias = computed(
  () =>
    apiElement.kind & 2097152 /* ReflectionKind.TypeAlias */ &&
    !isInterface.value
);

const properties = computed(() => {
  const children =
    (apiElement.kind & 2097152) > 0
      ? apiElement.type.declaration.children
      : apiElement.children;
  return children.filter(
    (item) => item.kind & 1024 /* ReflectionKind.Property */
  );
});
function formatProperty(property) {
  return marked.parseInline(
    `${property.name}: ${formatTypeToString(property.type)}`
  );
}
function formatType(typeEl) {
  return marked.parseInline(formatTypeToString(typeEl));
}
</script>

<style scoped>
.card-header {
  color: rgb(38 62 202);
  background: rgb(51 38 202 / 3%);
  letter-spacing: 2.5px;
  opacity: 0.6;
}
</style>
