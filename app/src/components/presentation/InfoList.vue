<template>
  <dl class="small">
    <template v-for="prop in propList">
      <dt>{{ prop.title }}</dt>
      <dd>{{ prop.description }}</dd>
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
        title: `${key.substr(0, 1).toUpperCase()}${key.substr(1)}`,
        description: `${this.info[key]}`,
      }));
    },
  },
};
</script>
