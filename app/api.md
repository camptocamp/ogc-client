---
outline: deep
---

<script setup>
import { data } from './api.data.js';
import ClassCard from "./src/components/apidoc/ClassCard.vue";
import FunctionCard from "./src/components/apidoc/FunctionCard.vue";
import TypeCard from "./src/components/apidoc/TypeCard.vue";
</script>

# API Reference

## Classes

<ClassCard v-for="c in data.classes" :api-element="c"></ClassCard>

## Functions

<FunctionCard v-for="f in data.functions" :api-element="f"></FunctionCard>

## Types

<TypeCard v-for="t in data.types" :api-element="t"></TypeCard>
