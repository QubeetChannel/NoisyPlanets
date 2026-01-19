<template>
  <Scene class="w-screen h-screen overflow-hidden fixed"/>
  <UI />
</template>

<script setup lang="ts">
  console.log('Файл Planet / загрузка Scene')
  import Scene from './components/Scene.vue'
  import UI from './components/ui/UI.vue'
</script>