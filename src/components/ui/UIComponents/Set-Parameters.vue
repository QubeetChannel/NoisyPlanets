<template>
  <section class="
    bg-slate-500/60 rounded-2xl
    w-full p-2
    flex flex-col justify-center
  ">
    <span class="text-xl font-bold text-center">Parameters</span>

    <div class="my-2"> 
      <label class="
        w-full px-2 py-2
        rounded-2xl 
        grid grid-cols-3 
        hover:bg-slate-700/50
        transition-all duration-50 ease-in-out
      "><p>Seed</p>
        <input 
          type="number" 
          v-model.number="settings.seed" 
          min="0"
          max="9999"
          class="col-span-2 bg-slate-500 rounded-2xl px-2"
        />
      </label>

      <label class="
        w-full px-2 py-2
        rounded-2xl 
        grid grid-cols-3 
        hover:bg-slate-700/50
        transition-all duration-50 ease-in-out
      "><p>Scale</p>
        <input 
          type="range" 
          v-model.number="scaleRange" 
          min="32" 
          max="256" 
          step="1"
          class="h"
          @input="updateScale"
        />
        <input 
          type="number" 
          v-model.number="settings.scale" 
          min="32"
          max="256"
          step="1"
          class="bg-slate-500 rounded-2xl px-2"
          @input="updateScaleRange"
        />
      </label>
    
      <label class="
        w-full px-2 py-2
        rounded-2xl 
        grid grid-cols-3 
        hover:bg-slate-700/50
        transition-all duration-50 ease-in-out
      "><p>Frequency</p>
        <input 
          type="range" 
          v-model.number="frequencyRange" 
          min="1" 
          max="20" 
          step="0.1"
          class="h"
          @input="updateFrequency"
        />
        <input 
          type="number" 
          v-model.number="settings.frequency" 
          min="1"
          max="3"
          step="0.1"
          class="bg-slate-500 rounded-2xl px-2"
          @input="updateFrequencyRange"
        />
      </label>
    
      <label class="
        w-full px-2 py-2
        rounded-2xl 
        grid grid-cols-3 
        hover:bg-slate-700/50 transition-all duration-50 ease-in-out
      "><p>Amplitude</p>
        <input 
          type="range" 
          v-model.number="amplitudeRange" 
          min="10" 
          max="80"
          step="1"
          @input="updateAmplitude"
        />
        <input 
          type="number" 
          v-model.number="settings.amplitude" 
          step="0.01"
          min="0.1"
          max="0.8"
          class="bg-slate-500 rounded-2xl px-2"
          @input="updateAmplitudeRange"
        />
      </label>

      <label class="
        w-full px-2 py-2
        rounded-2xl 
        grid grid-cols-3 
        hover:bg-slate-700/50
        transition-all duration-50 ease-in-out
      "><p>Octaves</p>
        <input 
          type="range" 
          v-model.number="octavesRange" 
          min="1" 
          max="6" 
          step="1"
          class="h"
          @input="updateOctaves"
        />
        <input 
          type="number" 
          v-model.number="settings.octaves" 
          min="1"
          max="6"
          step="1"
          class="bg-slate-500 rounded-2xl px-2"
          @input="updateOctavesRange"
        />
      </label>

      <label class="
        w-full px-2 py-2
        rounded-2xl 
        grid grid-cols-3 
        hover:bg-slate-700/50
        transition-all duration-50 ease-in-out
      "><p>Persistence</p>
        <input 
          type="range" 
          v-model.number="persistenceRange" 
          min="30" 
          max="70" 
          step="1"
          class="h"
          @input="updatePersistence"
        />
        <input 
          type="number" 
          v-model.number="settings.persistence" 
          step="0.01"
          min="0.3"
          max="0.7"
          class="bg-slate-500 rounded-2xl px-2"
          @input="updatePersistenceRange"
        />
      </label>

      <label class="
        w-full px-2 py-2
        rounded-2xl 
        grid grid-cols-3 
        hover:bg-slate-700/50
        transition-all duration-50 ease-in-out
      "><p>Lacunarity</p>
        <input 
          type="range" 
          v-model.number="lacunarityRange" 
          min="150" 
          max="300" 
          step="5"
          class="h"
          @input="updateLacunarity"
        />
        <input 
          type="number" 
          v-model.number="settings.lacunarity" 
          step="0.05"
          min="1.5"
          max="3.0"
          class="bg-slate-500 rounded-2xl px-2"
          @input="updateLacunarityRange"
        />
      </label>

      <label class="
        w-full px-2 py-2
        rounded-2xl 
        grid grid-cols-3 
        hover:bg-slate-700/50
        transition-all duration-50 ease-in-out
      "><p>Water Height</p>
        <input 
          type="range" 
          v-model.number="waterHeightRange" 
          min="0" 
          max="100" 
          step="1"
          class="h"
          @input="updateWaterHeight"
        />
        <input 
          type="number" 
          v-model.number="settings.waterHeight" 
          step="0.01"
          min="0"
          max="1"
          class="bg-slate-500 rounded-2xl px-2"
          @input="updateWaterHeightRange"
        />
      </label>
    </div>

    <button 
      @click="handleGenerate"
      :disabled="isGenerating"
      class="
        w-full px-4 py-2 rounded-2xl font-bold text-center mt-auto cursor-pointer
        bg-slate-700 hover:bg-slate-900 
        transition-all duration-50 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >{{ isGenerating ? 'Generating...' : 'Generate' }}</button>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { getPlanetParameters } from '../../../parameters/PlanetParameters'
import { getPlanetFactory } from '../../../planet/PlanetFactory'

const settings = getPlanetParameters()

const frequencyRange = ref(settings.frequency)
const amplitudeRange = ref(Math.round(settings.amplitude * 100))
const octavesRange = ref(settings.octaves)
const persistenceRange = ref(Math.round(settings.persistence * 100))
const lacunarityRange = ref(Math.round(settings.lacunarity * 100))
const scaleRange = ref(settings.scale)
const waterHeightRange = ref(Math.round(settings.waterHeight * 100))

onMounted(() => {
  frequencyRange.value = settings.frequency
  amplitudeRange.value = Math.round(settings.amplitude * 100)
  octavesRange.value = settings.octaves
  persistenceRange.value = Math.round(settings.persistence * 100)
  lacunarityRange.value = Math.round(settings.lacunarity * 100)
  scaleRange.value = settings.scale
  waterHeightRange.value = Math.round(settings.waterHeight * 100)
})

function updateFrequency() {
  settings.frequency = frequencyRange.value
}

function updateFrequencyRange() {
  frequencyRange.value = Math.max(1, Math.min(20, settings.frequency))
}

function updateAmplitude() {
  settings.amplitude = amplitudeRange.value / 100
}

function updateAmplitudeRange() {
  amplitudeRange.value = Math.round(settings.amplitude * 100)
}

function updateOctaves() {
  settings.octaves = octavesRange.value
}

function updateOctavesRange() {
  octavesRange.value = settings.octaves
}

function updatePersistence() {
  settings.persistence = persistenceRange.value / 100
}

function updatePersistenceRange() {
  persistenceRange.value = Math.round(settings.persistence * 100)
}

function updateLacunarity() {
  settings.lacunarity = lacunarityRange.value / 100
}

function updateLacunarityRange() {
  lacunarityRange.value = Math.round(settings.lacunarity * 100)
}

function updateScale() {
  settings.scale = scaleRange.value
}

function updateScaleRange() {
  scaleRange.value = Math.max(32, Math.min(256, settings.scale))
}

function updateWaterHeight() {
  settings.waterHeight = waterHeightRange.value / 100
  const planetFactory = getPlanetFactory()
  planetFactory.updateWaterHeight()
}

function updateWaterHeightRange() {
  waterHeightRange.value = Math.round(settings.waterHeight * 100)
  const planetFactory = getPlanetFactory()
  planetFactory.updateWaterHeight()
}

const props = defineProps<{
  isGenerating?: boolean
}>()

const emit = defineEmits<{
  (e: 'generate'): void
}>()

function handleGenerate() {
  if (props.isGenerating) return
  emit('generate')
}

watch(() => settings.frequency, (newVal) => {
  frequencyRange.value = Math.max(2, Math.min(20, newVal))
})

watch(() => settings.amplitude, (newVal) => {
  amplitudeRange.value = Math.round(newVal * 100)
})

watch(() => settings.octaves, (newVal) => {
  octavesRange.value = newVal
})

watch(() => settings.persistence, (newVal) => {
  persistenceRange.value = Math.round(newVal * 100)
})

watch(() => settings.lacunarity, (newVal) => {
  lacunarityRange.value = Math.round(newVal * 100)
})

watch(() => settings.scale, (newVal) => {
  scaleRange.value = Math.max(32, Math.min(256, newVal))
  if (scaleRange.value !== newVal) {
    scaleRange.value = newVal
  }
})

watch(() => settings.waterHeight, (newVal) => {
  waterHeightRange.value = Math.round(newVal * 100)
})
</script>
