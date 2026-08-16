<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  message: string;
}>();
</script>

<template>
  <div class="danger custom-block">
    <p
      class="custom-block-title custom-block-title-default"
      style="font-weight: bold"
    >
      An error happened
    </p>
    <p>{{ props.message }}</p>
  </div>
</template>

<style scoped></style>
