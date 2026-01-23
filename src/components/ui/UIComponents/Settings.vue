<script setup lang="ts">
  import { ref } from 'vue';
  import SetTitle from './Set-Title.vue';
  import SetParameters from './Set-Parameters.vue';
  import SetColors from './Set-Colors.vue';
  import { getPlanetFactory } from '../../../planet/PlanetFactory';

  const isGenerating = ref(false)

  async function handleGeneratePlanet() {
    if (isGenerating.value) return
    isGenerating.value = true
    try {
      const planetFactory = getPlanetFactory();
      await planetFactory.createPlanet();
    } finally {
      isGenerating.value = false
    }
  }

  async function handleApplyColors() {
    try {
      const planetFactory = getPlanetFactory();
      const planetMesh = planetFactory.getPlanetMesh();
      
      if (!planetMesh) {
        console.warn('handleApplyColors: planet mesh not available, creating planet first...');
        await handleGeneratePlanet();
        return;
      }
      
      await planetFactory.updateColors();
    } catch (error) {
      console.error('Error applying colors:', error);
    }
  }
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div class="
      bg-slate-500/30 rounded-2xl
      w-[300px] p-4 text-white
      flex flex-col items-center justify-center gap-4
    ">
      <SetTitle />
      <SetParameters @generate="handleGeneratePlanet" :is-generating="isGenerating" />
      <SetColors @apply="handleApplyColors" />
    </div>
  </div>
</template>
