<template>
  <div>
    <p>{{ process.identifier }}</p>
    <InfoList :info="process"></InfoList>
    <Async v-if="processLoaded" :promise="processLoaded">
      <template v-slot:then="{ result: processFull }">
        <InfoList :info="getOtherInfo(processFull)"></InfoList>
        <p>Inputs</p>
        <InfoList :info="getInputs(processFull)"></InfoList>
        <p>Outputs</p>
        <InfoList :info="getOutputs(processFull)"></InfoList>
      </template>
    </Async>
  </div>
</template>

<style scoped></style>

<script>
import InfoList from '../presentation/InfoList.vue';
import Async from '../presentation/Async.vue';

export default {
  name: 'WpsProcessInfo',
  components: { Async, InfoList },
  props: {
    /** @type {{ new(): WpsProcessSummary}} */
    process: Object,
    /** @type {{ new(): WpsEndpoint}} */
    endpoint: Object,
  },
  data: () => ({
    /** @type {?{ new(): WpsProcessFull}} */
    processLoaded: null,
  }),
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
        parts.push(`- ${param.title}`);
      }
      return parts.join(' ');
    },
    getInputs(processFull) {
      return processFull.inputs.reduce(
        (prev, input) => ({
          ...prev,
          [input.identifier]: this.describeParam(input, true),
        }),
        {},
      );
    },
    getOutputs(processFull) {
      return processFull.outputs.reduce(
        (prev, output) => ({
          ...prev,
          [output.identifier]: this.describeParam(output, false),
        }),
        {},
      );
    },
    getOtherInfo(processFull) {
      return {
        'status supported': processFull.statusSupported,
        'store supported': processFull.storeSupported,
      };
    },
    describe() {
      this.processLoaded = this.endpoint.describeProcess(
        this.process.identifier,
      );
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
