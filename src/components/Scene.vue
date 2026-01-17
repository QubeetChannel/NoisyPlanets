<template>
  <div ref="ThreeJScontainer"></div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { usePlanet } from '../composables/usePlanet'
import { SceneController } from '../scripts/SceneController'
import { createStar } from './Star.ts'
import { createCamera } from './Camera.ts'

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

  sceneController.add(new THREE.GridHelper(10, 10));
  sceneController.add(new THREE.AxesHelper(6));

  sceneController.add(createStar({position:[5,3,-5], intensity: 2, starColor: '#FFFF00'}))

  renderer = new THREE.WebGLRenderer({ antialias: true })
  ThreeJScontainer.value!.appendChild(renderer.domElement)
  
  const { camera: createdCamera, controls: createdControls } = createCamera(renderer.domElement, {})
  camera = createdCamera
  controls = createdControls

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
    sceneController.add(planet.value.mesh);
  }
})

function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(sceneController.scene, camera);
}
</script>