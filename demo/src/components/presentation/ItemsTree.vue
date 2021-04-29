<template>
  <div>
    <div v-for="item in items">
      <span>{{ item.title }}</span
      >&nbsp;
      <span class="text-light">({{ item.name }})</span>
      <br />
      <span class="text-s text-light">{{ item.abstract }}</span>
      <br />
      <div class="spacer-s"></div>
    </div>
  </div>
</template>

<style scoped></style>

<script>
/**
 * @typedef {Object} TreeItem
 * @property {string[]} path
 */

export default {
  name: 'ItemsTree',
  props: {
    /** @type {{new (): TreeItem[]}} */
    items: Array,
  },
  mounted() {},
};
</script>
