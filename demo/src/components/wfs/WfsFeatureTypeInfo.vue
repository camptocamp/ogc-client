<template>
  <div>
    <p>{{ featureType.name }}</p>
    <div class="spacer-s"></div>
    <InfoList :info="featureTypeInfo"></InfoList>
    <div class="spacer-s"></div>
    <p>Properties</p>
    <div class="spacer-s"></div>
    <InfoList :info="featureProperties"></InfoList>
    <div class="spacer-m"></div>
    <div v-if="featurePropsDetails === null && !loadingValues">
      <button type="button" @click="loadValues()">Load unique values</button>
    </div>
    <div v-if="loadingValues">Loading unique values...</div>
    <div v-if="featurePropsDetails !== null">
      <p>Unique values</p>
      <div class="spacer-s"></div>
      <InfoList :info="uniqueValues"></InfoList>
    </div>
  </div>
</template>

<style scoped></style>

<script>
import InfoList from '../presentation/InfoList';
export default {
  name: 'WfsFeatureTypeInfo',
  components: { InfoList },
  props: {
    /** @type {{ new(): WfsFeatureTypeFull}} */
    featureType: Object,
    /** @type {{ new(): WfsEndpoint}} */
    endpoint: Object,
  },
  data: () => ({
    loadingValues: false,
    /** @type {?{ new(): WfsFeatureTypePropsDetails}} */
    featurePropsDetails: null,
  }),
  computed: {
    featureTypeInfo() {
      return {
        ...('title' in this.featureType && { title: this.featureType.title }),
        ...('abstract' in this.featureType && {
          abstract: this.featureType.abstract,
        }),
        CRS: [this.featureType.defaultCrs, ...this.featureType.otherCrs].join(
          ', '
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
      };
    },
    featureProperties() {
      return {
        ...this.featureType.properties,
      };
    },
    uniqueValues() {
      if (this.featurePropsDetails === null) return {};
      return Object.keys(this.featurePropsDetails).reduce(
        (prev, curr) => ({
          ...prev,
          [curr]: this.featurePropsDetails[curr].uniqueValues
            .sort((valueA, valueB) => valueB.count - valueA.count)
            .filter((v, i) => i <= 8)
            .map((v, i) => (i < 8 ? `${v.value} (${v.count})` : '...'))
            .join(', '),
        }),
        {}
      );
    },
  },
  methods: {
    async loadValues() {
      this.loadingValues = true;
      this.featurePropsDetails = await this.endpoint.getFeatureTypePropDetails(
        this.featureType.name
      );
      this.loadingValues = false;
    },
  },
  watch: {
    featureType() {
      this.loadingValues = false;
      this.featurePropsDetails = null;
    },
  },
};
</script>
