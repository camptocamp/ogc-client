<template>
  <div class="card mb-4">
    <div class="card-header text-uppercase fs-6">
      <span class="me-3 fs-4">●</span>function
    </div>
    <div class="card-body">
      <h5>
        <code
          >{{ apiElement.name }}() <span class="fs-5">⇢</span>
          {{ apiElement.return.type }}</code
        >
      </h5>
      <MarkdownBlock :text="apiElement.description" />
    </div>
  </div>
</template>

<script>
import MarkdownBlock from '../presentation/MarkdownBlock';

export default {
  name: 'FunctionCard',
  components: { MarkdownBlock },
  props: {
    apiElement: Object,
  },
};
</script>

<style scoped>
.card-header {
  color: rgb(38, 202, 81);
  background: rgba(38, 202, 81, 0.03);
}
</style>
