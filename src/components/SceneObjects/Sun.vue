<script setup lang="ts">
  const props = defineProps<{ position?: [number, number, number] }>();
  const SunPosition: [number, number, number] = props.position ?? [0, 0, 0];
</script>

<template>
  <TresMesh ref="Sun" :position="SunPosition">
    <TresSphereGeometry :args="[10, 8, 16]" />
    <TresMeshBasicMaterial color="#ffff00"/>
  </TresMesh>

  <TresAmbientLight :intensity="2" :position="SunPosition"/>
  <!-- <TresDirectionalLight :intensity="1.5" :position="SunPosition" :look-at="[0,0,0]" /> -->
</template> 