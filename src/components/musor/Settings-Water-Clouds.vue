<template>
  <section class="
    bg-slate-500/60 rounded-2xl
    w-full p-2
    flex flex-col justify-center
  ">
    <span class="text-xl font-bold text-center">Water & Clouds</span>

    <div class="my-2"> 
      <!-- Water Settings -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Water</h3>
        <label class="
          w-full px-2 py-2
          rounded-2xl 
          grid grid-cols-3 
          hover:bg-slate-700/50
          transition-all duration-50 ease-in-out
        ">
          <p>Enabled</p>
          <input 
            type="checkbox" 
            v-model="settings.water" 
            class="col-span-2 h-8 cursor-pointer bg-slate-500 rounded-2xl"
          />
        </label>
        
        <label class="
          w-full px-2 py-2
          rounded-2xl 
          grid grid-cols-3 
          hover:bg-slate-700/50
          transition-all duration-50 ease-in-out
        ">
          <p>Level</p>
          <input 
            type="range" 
            v-model.number="waterLevelRange" 
            min="0" 
            max="100" 
            step="1"
            class="h"
            @input="updateWaterLevel"
          />
          <input 
            type="number" 
            v-model.number="settings.waterHeight" 
            step="0.01"
            min="0"
            max="1"
            class="bg-slate-500 rounded-2xl px-2"
            @input="updateWaterLevelRange"
          />
        </label>
      </div>

      <!-- Clouds Settings -->
      <div>
        <h3 class="text-lg font-semibold mb-2">Clouds</h3>
        <label class="
          w-full px-2 py-2
          rounded-2xl 
          grid grid-cols-3 
          hover:bg-slate-700/50
          transition-all duration-50 ease-in-out
        ">
          <p>Enabled</p>
          <input 
            type="checkbox" 
            v-model="settings.clouds" 
            class="col-span-2 h-8 cursor-pointer bg-slate-500 rounded-2xl"
          />
        </label>
        
        <label class="
          w-full px-2 py-2
          rounded-2xl 
          grid grid-cols-3 
          hover:bg-slate-700/50
          transition-all duration-50 ease-in-out
        ">
          <p>Level</p>
          <input 
            type="range" 
            v-model.number="cloudLevelRange" 
            min="0" 
            max="100" 
            step="1"
            class="h"
            @input="updateCloudLevel"
          />
          <input 
            type="number" 
            v-model.number="settings.cloudHeight" 
            step="0.01"
            min="0"
            max="1"
            class="bg-slate-500 rounded-2xl px-2"
            @input="updateCloudLevelRange"
          />
        </label>
      </div>
    </div>

    <button 
      @click="handleApply"
      class="
        w-full px-4 py-2 rounded-2xl font-bold text-center mt-auto cursor-pointer
        bg-slate-700 hover:bg-slate-900 
        transition-all duration-50 ease-in-out
      "
    >Apply</button>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { getPlanetParameters } from '../../parameters/PlanetParameters'
import { getPlanetFactory } from '../../planet/PlanetFactory'

const settings = getPlanetParameters()

const waterLevelRange = ref(Math.round(settings.waterHeight * 100))
const cloudLevelRange = ref(Math.round(settings.cloudHeight * 100))

onMounted(() => {
  waterLevelRange.value = Math.round(settings.waterHeight * 100)
  cloudLevelRange.value = Math.round(settings.cloudHeight * 100)
})

function updateWaterLevel() {
  settings.waterHeight = waterLevelRange.value / 100
}

function updateWaterLevelRange() {
  waterLevelRange.value = Math.round(settings.waterHeight * 100)
}

function updateCloudLevel() {
  settings.cloudHeight = cloudLevelRange.value / 100
}

function updateCloudLevelRange() {
  cloudLevelRange.value = Math.round(settings.cloudHeight * 100)
}

function handleApply() {
  const planetFactory = getPlanetFactory()
  planetFactory.updateWaterHeight()
  planetFactory.updateCloudsHeight()
}

// Синхронизация при изменении settings
watch(() => settings.waterHeight, (newVal) => {
  waterLevelRange.value = Math.round(newVal * 100)
})

watch(() => settings.cloudHeight, (newVal) => {
  cloudLevelRange.value = Math.round(newVal * 100)
})
</script>
