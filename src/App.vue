<script setup lang="ts">
  import { TresCanvas } from '@tresjs/core';
  import Scene from './components/Scene.vue';
  import UI from './components/UI.vue';
</script>

<template>
  <UI />


  <TresCanvas clear-color="#00042e" window-size>
    <!-- <Scene /> -->
  </TresCanvas>
</template>