<template>
  <div>
    <slot v-bind:item="item"> tree item </slot>
    <div v-if="hasChildren" style="margin-left: 1rem">
      <div v-for="item in children">
        <div class="spacer-s"></div>
        <TreeItem :item="item">
          <template v-slot="{ item }">
            <!-- reuse the slot content for children items -->
            <slot v-bind:item="item"></slot>
          </template>
        </TreeItem>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

<script>
export default {
  name: 'TreeItem',
  props: {
    /** @type {{new (): TreeItem}} */
    item: Object,
  },
  computed: {
    hasChildren() {
      return 'children' in this.item;
    },
    children() {
      return this.item.children;
    },
  },
};
</script>
