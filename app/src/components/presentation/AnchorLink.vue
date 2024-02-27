<script setup>
import { computed } from 'vue';

const { href } = defineProps(['href']);

const fullHref = computed(() => `#/api/${href}`);
const id = computed(() => `/api/${href}`);
</script>

<template>
  <div>
    <a :id="id" :href="fullHref">#</a>
  </div>
</template>

<style scoped>
div {
  position: relative;
  width: 0;
  height: 0;
}
a {
  position: absolute;
  left: -35px;
  top: -2px;
  font-size: 20px;
  font-weight: 500;
  color: rgb(147 147 147 / 0.5);
  text-decoration: none;
  width: 40px;
  text-align: center;
}
a:hover {
  color: rgb(147 147 147);
  text-decoration: underline;
}
</style>
