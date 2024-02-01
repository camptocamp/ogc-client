<template>
  <dl class="small">
    <template v-for="prop in propList">
      <dt class="d-flex flex-row" style="gap: 0.5rem">
        <span>{{ prop.title }}</span>
        <div
          class="flex-grow-1"
          style="
            border-top: 2px solid #e0e0e0;
            margin-top: 0.7em;
            min-width: 6px;
          "
        ></div>
      </dt>
      <dd>
        <span v-if="typeof prop.description === 'string'">{{
          prop.description
        }}</span>
        <InfoList v-else :info="prop.description"></InfoList>
      </dd>
    </template>
  </dl>
</template>

<style scoped>
dl {
  display: grid;
  grid-template-columns: 0fr auto;
  grid-gap: 0.5rem 1rem;
}
dt {
  grid-column: 1;
}
dd {
  grid-column: 2;
}
</style>

<script>
export default {
  name: 'InfoList',
  props: {
    info: Object,
  },
  computed: {
    propList() {
      return Object.keys(this.info).map((key) => ({
        title: `${key.substring(0, 1).toUpperCase()}${key.substring(1)}`,
        description:
          this.info[key] instanceof Object
            ? this.info[key]
            : `${this.info[key]}`,
      }));
    },
  },
};
</script>
