<template>
  <div ref="container" class="w-screen h-screen overflow-hidden"></div>
</template>

<script setup lang="ts">
  console.log('Файл Scene / загрузка div')
  import * as THREE from 'three'
  import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
  import { usePlanet } from '../composables/usePlanet.ts'

  const container = ref<HTMLDivElement | null>(null)
  const { planet, status } = usePlanet()

  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer

  function resize() {
    if (!container.value) return

    const width = container.value.clientWidth
    const height = container.value.clientHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  onMounted(() => {
    // Создание сцены
    scene = new THREE.Scene()

    // Камера
    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    camera.position.z = 3

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    container.value!.appendChild(renderer.domElement)

    // Свет
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(3, 3, 3)
    scene.add(light)

    // Resize
    resize()
    window.addEventListener('resize', resize)

    animate()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
  })

  watch(status, () => {
    if (status.value === 'ready' && planet.value) {
      scene.add(planet.value.mesh)
    }
  })

  function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }
</script>