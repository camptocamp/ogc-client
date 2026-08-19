<template>
  <dl style="font-size: 14px">
    <template v-for="prop in propList">
      <dt style="display: flex; flex-direction: row; gap: 0.5rem">
        <span>{{ prop.title }}</span>
        <div
          style="
            flex-grow: 1;
            border-top: 2px solid rgb(136 136 136 / 0.42);
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
  font-weight: bold;
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
