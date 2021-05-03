<template>
  <div class="bg-dark text-white text-s padding-s">
    <div v-for="treeItem in items">
      <TreeItem :item="treeItem">
        <template v-slot="{ item }">
          <!-- use the slot content for items -->
          <slot v-bind:item="item"></slot>
        </template>
      </TreeItem>
      <div class="spacer-s"></div>
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
