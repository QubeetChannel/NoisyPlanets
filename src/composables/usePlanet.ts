import { ref, markRaw } from 'vue'
import { createPlanet } from '../planet/PlanetFactory.ts'
import type { PlanetObject } from '../planet/PlanetObject.ts'

type PlanetStatus = 'idle' | 'initializing' | 'ready'

const planet = ref<PlanetObject | null>(null)
const status = ref<PlanetStatus>('idle')

export function usePlanet() {
  function initPlanet() {
    status.value = 'initializing'
    planet.value = markRaw(createPlanet())
    status.value = 'ready'
  }

  return {
    planet,
    status,
    initPlanet,
  }
}