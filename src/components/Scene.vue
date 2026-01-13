<template>
  <div ref="ThreeJScontainer" class="w-screen h-screen overflow-hidden"></div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { usePlanet } from '../composables/usePlanet'
import { SceneController } from '../scripts/SceneController'
import { createStarLight } from './createStarLight.ts'

const ThreeJScontainer = ref<HTMLDivElement | null>(null)
const { planet, status } = usePlanet()

let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let sceneController: SceneController

function resize() {
  if (!ThreeJScontainer.value) return

  const width = ThreeJScontainer.value.clientWidth
  const height = ThreeJScontainer.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

onMounted(() => {
  sceneController = new SceneController()

  // Scene
  sceneController.add(createStarLight({intensity: 2, color: '#FF0000'}))
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  ThreeJScontainer.value!.appendChild(renderer.domElement)
  
  // OrbitControls
  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.set(0, 0, 3)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true      // плавность
  controls.dampingFactor = 0.05
  controls.enablePan = false         // обычно для планет отключают
  controls.minDistance = 1.5
  controls.maxDistance = 6


  resize()
  window.addEventListener('resize', resize)

  animate()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)

  controls?.dispose()
  renderer?.dispose()
})

watch(status, () => {
  if (status.value === 'ready' && planet.value) {
    sceneController.add(planet.value.mesh)
  }
})

function animate() {
  requestAnimationFrame(animate)

  controls.update() // обязательно при enableDamping
  renderer.render(sceneController.scene, camera)
}
</script>