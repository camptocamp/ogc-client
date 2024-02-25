<template>
  <div>
    <template v-for="c in classes">
      <ClassCard :api-element="c" />
    </template>
    <template v-for="f in functions">
      <FunctionCard :api-element="f" />
    </template>
  </div>
</template>

<script setup>
import ClassCard from '@/components/api/ClassCard.vue';
import FunctionCard from '@/components/api/FunctionCard.vue';
import API from '@/data/api.json';
import { onMounted } from 'vue';

onMounted(() => {
  hljs.highlightAll();
});

const classes = API.children.filter((item) => item.kind === 128);
const functions = API.children.filter((item) => item.kind === 64);
</script>

<style scoped></style>
