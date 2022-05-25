<template>
  <div class="bg-dark small text-white p-2 rounded-1">
    <div v-for="treeItem in items">
      <TreeItem :item="treeItem">
        <template v-slot="{ item }">
          <!-- use the slot content for items -->
          <slot v-bind:item="item"></slot>
        </template>
      </TreeItem>
    </div>
  </div>
</template>

<style scoped></style>

<script>
import TreeItem from './TreeItem';
/**
 * @typedef {Object} TreeItem
 * @property {TreeItem[]} [children]
 */

export default {
  name: 'ItemsTree',
  components: { TreeItem },
  props: {
    /** @type {{new (): TreeItem[]}} */
    items: Array,
  },
  mounted() {},
};
</script>
