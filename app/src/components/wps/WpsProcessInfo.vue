<template>
  <div>
    <p>{{ process.identifier }}</p>
    <InfoList :info="processInfo"></InfoList>
    <div v-if="loading">Loading process description...</div>
    <template v-if="full">
      <p>Inputs</p>
      <InfoList :info="inputs"></InfoList>
      <p>Outputs</p>
      <InfoList :info="outputs"></InfoList>
    </template>
  </div>
</template>

<style scoped></style>

<script>
import InfoList from '../presentation/InfoList.vue';

export default {
  name: 'WpsProcessInfo',
  components: { InfoList },
  props: {
    /** @type {{ new(): WpsProcessSummary}} */
    process: Object,
    /** @type {{ new(): WpsEndpoint}} */
    endpoint: Object,
  },
  data: () => ({
    loading: false,
    /** @type {?{ new(): WpsProcessFull}} */
    full: null,
  }),
  computed: {
    processInfo() {
      return {
        ...(this.process.title && { title: this.process.title }),
        ...(this.process.abstract && { abstract: this.process.abstract }),
        ...(this.process.processVersion && {
          version: this.process.processVersion,
        }),
        ...(this.full && {
          'status supported': this.full.statusSupported,
          'store supported': this.full.storeSupported,
        }),
      };
    },
    inputs() {
      if (!this.full) return {};
      return this.full.inputs.reduce(
        (prev, input) => ({
          ...prev,
          [input.identifier]: this.describeParam(input, true),
        }),
        {}
      );
    },
    outputs() {
      if (!this.full) return {};
      return this.full.outputs.reduce(
        (prev, output) => ({
          ...prev,
          [output.identifier]: this.describeParam(output, false),
        }),
        {}
      );
    },
  },
  methods: {
    describeParam(param, isInput) {
      const parts = [param.type];
      if (isInput) {
        parts.push(`[${param.minOccurs}..${param.maxOccurs}]`);
      }
      if (param.literalData?.dataType) {
        parts.push(param.literalData.dataType);
      }
      if (param.literalData?.allowedValues?.length) {
        parts.push(`values: ${param.literalData.allowedValues.join(', ')}`);
      }
      if (param.complexData?.default?.mimeType) {
        parts.push(param.complexData.default.mimeType);
      }
      if (param.title) {
        parts.push(`— ${param.title}`);
      }
      return parts.join(' ');
    },
    async describe() {
      this.loading = true;
      this.full = null;
      try {
        this.full = await this.endpoint.describeProcess(
          this.process.identifier
        );
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.describe();
  },
  watch: {
    process() {
      this.describe();
    },
  },
};
</script>
