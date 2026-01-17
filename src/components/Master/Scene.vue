<script setup lang="ts">
  import Camera from './SceneObjects/Camera.vue';
  import Sun from './SceneObjects/Sun.vue';
  import Planet from './SceneObjects/Planet.vue';
</script>

<template>
  <Sun :position="[-70,0,-50]"/>

  <Camera />

  <Planet />


  <!-- <TresAxesHelper /> -->
  <TresGridHelper />
</template>