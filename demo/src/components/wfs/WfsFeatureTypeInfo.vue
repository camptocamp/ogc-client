<template>
  <div>
    <p>{{ featureType.name }}</p>
    <div class="spacer-s"></div>
    <InfoList :info="featureTypeInfo"></InfoList>
    <div class="spacer-s"></div>
    <p>Properties</p>
    <div class="spacer-s"></div>
    <InfoList :info="featureProperties"></InfoList>
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
    endpointUrl: String,
  },
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
  },
};
</script>
