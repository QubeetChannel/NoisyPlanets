<template>
  <Scene class="w-screen h-screen overflow-hidden fixed"/>

  <!-- <UI /> -->
</template>

<script setup lang="ts">
  console.log('Файл Planet / загрузка Scene')
  import { onMounted } from 'vue'
  import Scene from './components/Scene.vue'
  import { usePlanet } from './composables/usePlanet.ts'
  import UI from './components/Master/UI.vue'

  const { initPlanet } = usePlanet()

  onMounted(() => {
    initPlanet()
  })
</script>