<template>
  <div>
    <p>{{ featureType.name }}</p>
    <InfoList :info="featureTypeInfo"></InfoList>
    <p>Properties</p>
    <InfoList :info="featureProperties"></InfoList>

    <div v-if="!loadPromise">
      <button type="button" @click="loadValues()">Load unique values</button>
    </div>

    <Async v-if="loadPromise" :promise="loadPromise">
      <template v-slot:then="{ result: featurePropsDetails }">
        <p>Unique values</p>
        <InfoList :info="getUniqueValues(featurePropsDetails)"></InfoList>
      </template>
    </Async>
  </div>
</template>

<style scoped></style>

<script>
import InfoList from '../presentation/InfoList.vue';
import Async from '../presentation/Async.vue';

export default {
  name: 'WfsFeatureTypeInfo',
  components: { Async, InfoList },
  props: {
    /** @type {{ new(): WfsFeatureTypeFull}} */
    featureType: Object,
    /** @type {{ new(): WfsEndpoint}} */
    endpoint: Object,
  },
  data: () => ({
    loadPromise: null,
  }),
  computed: {
    featureTypeInfo() {
      return {
        ...('title' in this.featureType && { title: this.featureType.title }),
        ...('abstract' in this.featureType && {
          abstract: this.featureType.abstract,
        }),
        CRS: [this.featureType.defaultCrs, ...this.featureType.otherCrs].join(
          ', ',
        ),
        ...('objectCount' in this.featureType && {
          'object count': this.featureType.objectCount,
        }),
        ...('geometryName' in this.featureType && {
          'geometry name': this.featureType.geometryName,
        }),
        ...('geometryType' in this.featureType && {
          'geometry type': this.featureType.geometryType,
        }),
        ...('keywords' in this.featureType && {
          keywords: this.featureType.keywords,
        }),
      };
    },
    featureProperties() {
      return {
        ...this.featureType.properties,
      };
    },
  },
  methods: {
    loadValues() {
      this.loadPromise = this.endpoint.getFeatureTypePropDetails(
        this.featureType.name,
      );
    },
    getUniqueValues(featurePropsDetails) {
      return Object.keys(featurePropsDetails).reduce(
        (prev, curr) => ({
          ...prev,
          [curr]: featurePropsDetails[curr].uniqueValues
            .sort((valueA, valueB) => valueB.count - valueA.count)
            .filter((v, i) => i <= 8)
            .map((v, i) => (i < 8 ? `${v.value} (${v.count})` : '...'))
            .join(', '),
        }),
        {},
      );
    },
  },
  watch: {
    featureType() {
      this.loadPromise = null;
    },
  },
};
</script>
