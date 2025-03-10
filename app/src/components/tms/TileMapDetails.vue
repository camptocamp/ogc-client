<template>
  <div class="card my-3">
    <div class="card-header">
      <h5 class="card-title">{{ tileMap.title }}</h5>
    </div>
    <div class="card-body">
      <p v-if="tileMap.abstract" class="card-text">
        {{ tileMap.abstract }}
      </p>
      <ul class="list-group list-group-flush">
        <li class="list-group-item"><strong>SRS:</strong> {{ tileMap.srs }}</li>
        <li class="list-group-item" v-if="tileMap.origin">
          <strong>Origin:</strong>
          x: {{ tileMap.origin.x }}, y: {{ tileMap.origin.y }}
        </li>
        <li class="list-group-item" v-if="tileMap.tileFormat">
          <strong>Tile Format:</strong>
          {{ tileMap.tileFormat.mimeType }} ({{ tileMap.tileFormat.width }} ×
          {{ tileMap.tileFormat.height }}), extension:
          {{ tileMap.tileFormat.extension }}
        </li>
        <li
          class="list-group-item"
          v-if="tileMap.tileSets && tileMap.tileSets.tileSets.length"
        >
          <strong>Tile Sets:</strong>
          <div
            v-for="ts in tileMap.tileSets.tileSets"
            :key="ts.order"
            class="small mb-1"
          >
            Order: {{ ts.order }}, Href: {{ ts.href }}, Units per pixel:
            {{ ts.unitsPerPixel }}
          </div>
        </li>
        <li
          class="list-group-item"
          v-if="tileMap.metadata && tileMap.metadata.length"
        >
          <strong>Metadata:</strong>
          <div
            v-for="meta in tileMap.metadata"
            :key="meta.href"
            class="small mb-1"
          >
            Type: {{ meta.type }}, Mime: {{ meta.mimeType }}, Href:
            {{ meta.href }}
          </div>
        </li>
        <li class="list-group-item" v-if="tileMap.attribution">
          <strong>Attribution:</strong> {{ tileMap.attribution.title }}
          <div v-if="tileMap.attribution.logo" class="mt-2">
            <img
              :src="tileMap.attribution.logo.href"
              :alt="tileMap.attribution.title"
              style="max-width: 100px"
            />
          </div>
        </li>
        <li
          class="list-group-item"
          v-if="tileMap.keywords && tileMap.keywords.length"
        >
          <strong>Keywords:</strong>
          <span
            v-for="(keyword, i) in tileMap.keywords"
            :key="i"
            class="badge bg-secondary me-1"
          >
            {{ keyword }}
          </span>
        </li>
        <li class="list-group-item" v-if="tileMap.webMapContext">
          <strong>Web Map Context:</strong> {{ tileMap.webMapContext }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TileMapDetails',
  props: {
    tileMap: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped>
.card {
  border-radius: 0.5rem;
}
.card-header {
  background-color: #f8f9fa;
}
.badge {
  font-size: 0.9rem;
}
</style>
