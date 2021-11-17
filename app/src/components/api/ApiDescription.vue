<template>
  <div>
    <template v-for="exported in API.exports">
      <ClassCard v-if="exported.type === 'Class'" :api-element="exported" />
      <FunctionCard
        v-if="exported.type === 'Function'"
        :api-element="exported"
      />
    </template>
  </div>
</template>

<script>
import API from '../../data/api';
import ClassCard from './ClassCard';
import FunctionCard from './FunctionCard';

export default {
  name: 'ApiDescription',
  components: { FunctionCard, ClassCard },
  data: () => ({
    API,
  }),
};
</script>

<style scoped></style>
