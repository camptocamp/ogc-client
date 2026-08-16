<template>
  <div
    style="
      background-color: rgb(33, 37, 41);
      border-radius: 3.2px;
      color: white;
      padding: 8px;
      font-size: 0.8em;
    "
  >
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

<style scoped>
:deep(a) {
  color: white;
}
</style>

<script>
import TreeItem from './TreeItem.vue';

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
