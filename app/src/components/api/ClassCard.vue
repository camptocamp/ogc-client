<template>
  <div class="card mb-4">
    <div class="card-header text-uppercase fs-6">
      <span class="me-3 fs-5">●</span>class
    </div>
    <div class="card-body">
      <h5>
        <code>{{ apiElement.name }}</code>
      </h5>
      <MarkdownBlock :text="apiElement.description" />
    </div>
  </div>
</template>

<script>
import MarkdownBlock from '../presentation/MarkdownBlock';
export default {
  name: 'ClassCard',
  components: { MarkdownBlock },
  props: {
    apiElement: Object,
  },
};
</script>

<style scoped>
.card-header {
  color: rgb(234, 108, 0);
  background: rgba(234, 108, 0, 0.03);
}
</style>
