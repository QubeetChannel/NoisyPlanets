<script setup lang="ts">
  import { ref } from 'vue';
  import Parameters from './Settings-Parameters.vue';
  import Colors from './Settings-Colors.vue';

  type ColorLayer = {
    color: string
    position: number
}
  // const ColorLнyers = ref([
  //   { color: '#ffffff', position: 1 },
  //   { color: '#666666', position: .75 },
  //   { color: '#32cd32', position: .55 },
  //   { color: '#ffe600', position: .25 },
  //   { color: '#3b4cc0', position: 0 },
  // ]);

  const ColorLayers = ref<ColorLayer[]>([
    { color: '#ffffff', position: 1 },
    { color: '#ffffff', position: .75 },
    { color: '#ffffff', position: .55 },
    { color: '#ffffff', position: .25 },
    { color: '#000000', position: 0 },
  ]);

  const PlanetParameters = ref({
    seed: 50,
    frequency: 50,
    amplitude: 50,
  });

  console.log(ColorLayers)
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div class="
      bg-slate-500/30 rounded-2xl
      w-[300px] p-4 text-white
      flex flex-col items-center justify-center gap-4
    ">
    
      <section class="
        bg-slate-500/60 rounded-2xl
        w-full p-3
        text-2xl font-bold
        flex justify-center
      ">Settings</section>

      <Parameters />
      <Colors v-model:colorLayers="ColorLayers"/>
    </div>
  </div>
</template>