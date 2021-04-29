<template>
  <div>
    <div v-for="item in items">{{ item.title }}</div>
  </div>
</template>

<style scoped></style>

<script>
export default {
  name: 'ItemsTree',
  props: {
    items: Array,
  },
};
</script>
