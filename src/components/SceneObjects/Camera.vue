<script setup lang="ts">
  import { OrbitControls } from '@tresjs/cientos';
</script>

<template>
  <TresPerspectiveCamera :position="[3, 1, 0]" :look-at="[0, 0, 0]" />
  <OrbitControls />
</template>