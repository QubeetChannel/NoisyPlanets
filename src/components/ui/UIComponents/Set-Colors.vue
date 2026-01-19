<template>
  <section class="
    bg-slate-500/60 rounded-2xl
    w-full p-2 min-h-[400px]
    flex flex-col
  ">
    <span class="text-xl font-bold text-center">Colors</span>

    <div class="my-2 grid grid-cols-[5fr_1fr]"> 
      <div class="col-span-2 grid grid-cols-[2fr_80px_28px_40px] text-center font-bold mb-1">
        <span>Layer</span>
        <span>HTML</span>
        <span class="col-start-4">Bar</span>
      </div>

      <!-- LEFT -->
      <div class="w-full flex flex-col">
        <div v-for="(item, i) in ColorLayers" class="grid grid-cols-[2fr_80px_28px]">
          <input type="color" v-model="item.color" class="h-8 cursor-grab w-full"/>

          <div class="bg-slate-500 w-[80px] px-2">{{ item.color }}</div>
          <button @click="removeColor(i)" class="
            font-bold text-center rounded-2xl w-7 h-7 cursor-pointer
            hover:bg-slate-700/50 hover:text-red-500
            transition-all duration-50 ease-in-out
          ">X</button>
        </div>

        <button @click="addColor" class="
          w-full px-4 py-1 rounded-2xl font-bold text-center cursor-pointer
          bg-slate-700 hover:bg-slate-900 
          transition-all duration-50 ease-in-out
        " :style="{ display: `${ColorLayers.length >= 10 ? 'none' : 'block'}`}">Add layer</button>
      </div>

      <!-- RIGHT -->
      <div class="flex flex-col items-center">
        <div ref="bar" class="relative w-10 min-h-80 h-full border-x-3 border-y-5 border-black">

          <!-- GradientBar -->
          <div class="absolute inset-0" :style="{ background: gradientStyle }"></div>

          <!-- Markers -->
          <div v-for="(item, i) in ColorLayers"
            class="absolute w-11 h-2 p-0.5 cursor-grab border-x-5 border-y-3 border-black"
            :style="{ backgroundColor:item.color, bottom:`${item.position*100}%`, transform:'translateX(-5px) translateY(50%)' }"
            @pointerdown="startDrag(i, $event)"
          ></div>

        </div>
      </div>
    </div>

    <button 
      @click="emit('apply')"
      class="
        w-full px-4 py-2 rounded-2xl mt-auto cursor-pointer
        bg-slate-700 hover:bg-slate-900 
        font-bold text-center
        transition-all duration-50 ease-in-out
      "
    >Apply colors</button>
  </section>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import getRandomColor from '../../../utils/getRandomColor'
  import { getPlanetParameters } from '../../../parameters/PlanetParameters'

  type ColorLayer = {
    color: string
    position: number
  }

  const settings = getPlanetParameters()

  const emit = defineEmits<{
    (e: 'apply'): void
  }>()

  /* computed v-model */
  const ColorLayers = computed<ColorLayer[]>({
    get: () => settings.colors,
    set: value => {
      settings.colors = value
    }
  })

  /* refs */
  const bar = ref<HTMLElement | null>(null)
  const draggingIndex = ref<number | null>(null)

  /* gradient */
  const gradientStyle = computed(() => {
    const stops = [...ColorLayers.value]
      .sort((a, b) => a.position - b.position)
      .map(l => `${l.color} ${l.position * 100}%`)
      .join(', ')

    return `linear-gradient(to top, ${stops})`
  })

  /* drag */
  function startDrag(index: number, e: PointerEvent) {
    draggingIndex.value = index
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    window.addEventListener('pointermove', onDrag)
    window.addEventListener('pointerup', stopDrag)
  }

  function onDrag(e: PointerEvent) {
    if (draggingIndex.value === null || !bar.value) return

    const rect = bar.value.getBoundingClientRect()
    let y = e.clientY - rect.top
    y = Math.max(0, Math.min(rect.height, y))

    const next = [...ColorLayers.value]
    next[draggingIndex.value] = {
      ...next[draggingIndex.value],
      position: 1 - y / rect.height
    }

    ColorLayers.value = next
  }

  function stopDrag() {
    draggingIndex.value = null
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', stopDrag)
  }

  /* add / remove */
  function addColor() {
    if (ColorLayers.value.length >= 10) return

    ColorLayers.value = [
      ...ColorLayers.value,
      {
        color: getRandomColor(),
        position: ColorLayers.value.length / 10
      }
    ]
  }

  function removeColor(index: number) {
    const next = [...ColorLayers.value]
    next.splice(index, 1)
    ColorLayers.value = next
  }
</script>
