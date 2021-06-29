<template>
  <div>
    <p>{{ featureType.name }}</p>
    <div class="spacer-s"></div>
    <InfoList :info="featureTypeInfo"></InfoList>
  </div>
</template>

<style scoped></style>

<script>
import InfoList from '../presentation/InfoList';
export default {
  name: 'WfsFeatureTypeInfo',
  components: { InfoList },
  props: {
    /** @type {{ new(): WfsFeatureType}} */
    featureType: Object,
    endpointUrl: String,
  },
  computed: {
    featureTypeInfo() {
      return {
        ...(this.featureType.title && { title: this.featureType.title }),
        ...(this.featureType.abstract && {
          abstract: this.featureType.abstract,
        }),
        CRS: [this.featureType.defaultCrs, ...this.featureType.otherCrs].join(
          ', '
        ),
      };
    },
  },
};
</script>
