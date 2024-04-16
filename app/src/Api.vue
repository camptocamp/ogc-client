<template>
  <div>
    <template v-for="c in classes">
      <ClassCard :api-element="c" />
    </template>
    <template v-for="f in functions">
      <FunctionCard :api-element="f" />
    </template>
    <template v-for="t in types">
      <TypeCard :api-element="t" />
    </template>
  </div>
</template>

<script setup>
import ClassCard from '@/components/api/ClassCard.vue';
import FunctionCard from '@/components/api/FunctionCard.vue';
import API from '@/data/api.js';
import { onMounted } from 'vue';
import TypeCard from '@/components/api/TypeCard.vue';

onMounted(() => {
  hljs.highlightAll();
});

const classes = API.children.filter(
  (item) => item.kind & 128 /* ReflectionKind.Class */
);
const functions = API.children.filter(
  (item) => item.kind & 64 /* ReflectionKind.Function */
);
const types = API.children.filter(
  (item) =>
    item.kind & 256 /* ReflectionKind.Interface */ ||
    item.kind & 2097152 /* ReflectionKind.TypeAlias */
);
</script>

<style scoped></style>
