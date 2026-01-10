<template>
  <Scene />
</template>

<script setup lang="ts">
  console.log('Файл Planet / загрузка Scene')
  import { onMounted } from 'vue'
  import Scene from './Scene.vue'
  import { usePlanet } from '../composables/usePlanet.ts'

  const { initPlanet } = usePlanet()

  onMounted(() => {
    initPlanet()
  })
</script>
