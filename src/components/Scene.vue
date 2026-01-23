<template>
  <div ref="ThreeJScontainer"></div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount, ref, shallowRef, markRaw, watch } from 'vue'
import { PlanetFactory, setPlanetFactory, getPlanetFactory } from '../planet/PlanetFactory'
import { SceneController } from '../scripts/SceneController'
import { createStar } from '../star/StarFactory'
import { createCamera } from '../camera/CameraFactory'
import { getPlanetParameters } from '../parameters/PlanetParameters'

const ThreeJScontainer = ref<HTMLDivElement | null>(null)
const settings = getPlanetParameters()

let animationFrameId: number | null = null
let startTime = Date.now()

let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let sceneController: SceneController
let planetFactory: PlanetFactory | null = null

// Используем shallowRef для объектов Three.js, чтобы избежать proxy
const planetMesh = shallowRef<THREE.Mesh | null>(null)
const waterMesh = shallowRef<THREE.Mesh | null>(null)
const cloudMesh = shallowRef<THREE.Mesh | null>(null)

function resize() {
  if (!ThreeJScontainer.value) return

  const width = ThreeJScontainer.value.clientWidth
  const height = ThreeJScontainer.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

onMounted(async () => {
  sceneController = new SceneController()

  // Помечаем объекты Three.js как нереактивные перед добавлением
  const gridHelper = markRaw(new THREE.GridHelper(10, 10))
  const axesHelper = markRaw(new THREE.AxesHelper(6))
  const star = markRaw(createStar({position:[5,3,-5], intensity: 2, starColor: '#FFFF00'}))
  
  sceneController.add(gridHelper)
  sceneController.add(axesHelper)
  sceneController.add(star)

  // Инициализируем renderer и camera сразу, чтобы сцена появилась
  renderer = new THREE.WebGLRenderer({ antialias: true })
  ThreeJScontainer.value!.appendChild(renderer.domElement)
  
  const { camera: createdCamera, controls: createdControls } = createCamera(renderer.domElement, {})
  camera = createdCamera
  controls = createdControls

  resize()
  window.addEventListener('resize', resize)

  // Запускаем анимацию сразу
  animate()

  // Создаем планету асинхронно в фоне
  planetFactory = new PlanetFactory()
  setPlanetFactory(planetFactory) // Устанавливаем глобальный экземпляр
  
  // Создаем базовую геометрию быстро (синхронно) и показываем сразу
  planetFactory.createBaseMesh()
  
  // Добавляем базовую геометрию сразу (без шума), чтобы планета была видна
  const planet = planetFactory.getPlanetMesh()
  if (planet) {
    planetMesh.value = markRaw(planet)
    sceneController.add(planetMesh.value)
  }
  
  // Применяем шум и цвета асинхронно в фоне (не блокирует UI)
  planetFactory.createPlanet().then(() => {
    updatePlanetMeshes();
  })
  
  // Слушаем обновления планеты через глобальный экземпляр
  // Переопределяем методы для автоматического обновления сцены
  const originalCreatePlanet = planetFactory.createPlanet.bind(planetFactory);
  planetFactory.createPlanet = async function() {
    await originalCreatePlanet();
    updatePlanetMeshes();
  };
  
  const originalUpdateColors = planetFactory.updateColors.bind(planetFactory);
  planetFactory.updateColors = async function() {
    await originalUpdateColors();
    updatePlanetMeshes();
  };
  
  // Обновляем глобальный экземпляр (он должен быть тем же, что мы только что установили)
  // Но на всякий случай переопределяем методы и для глобального экземпляра
  const globalFactory = getPlanetFactory();
  if (globalFactory) {
    const globalOriginalCreatePlanet = globalFactory.createPlanet.bind(globalFactory);
    globalFactory.createPlanet = async function() {
      await globalOriginalCreatePlanet();
      updatePlanetMeshes();
    };
    
    const globalOriginalUpdateColors = globalFactory.updateColors.bind(globalFactory);
    globalFactory.updateColors = async function() {
      await globalOriginalUpdateColors();
      updatePlanetMeshes();
    };
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  
  // Отменяем анимацию при размонтировании
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }

  controls?.dispose()
  renderer?.dispose()
})

watch(planetMesh, (newPlanet) => {
  if (newPlanet && sceneController) {
    if (!sceneController.scene.children.includes(newPlanet)) {
      sceneController.add(newPlanet)
    }
  }
}, { immediate: true })

watch(waterMesh, (newWaterMesh) => {
  if (!sceneController) return;
  
  if (newWaterMesh) {
    if (!sceneController.scene.children.includes(newWaterMesh)) {
      sceneController.add(newWaterMesh)
    }
  } else {
    const existing = sceneController.scene.children.find(child => child.name === 'WaterMesh')
    if (existing) {
      sceneController.scene.remove(existing)
    }
  }
}, { immediate: true })

watch(cloudMesh, (newCloudMesh) => {
  if (!sceneController) return;
  
  if (newCloudMesh) {
    if (!sceneController.scene.children.includes(newCloudMesh)) {
      sceneController.add(newCloudMesh)
    }
  } else {
    const existing = sceneController.scene.children.find(child => child.name === 'CloudMesh')
    if (existing) {
      sceneController.scene.remove(existing)
    }
  }
}, { immediate: true })

// Функция для обновления мешей в сцене после изменения планеты
function updatePlanetMeshes() {
  if (!planetFactory || !sceneController) return;
  
  const planet = planetFactory.getPlanetMesh();
  const water = planetFactory.getWaterMesh();
  const cloud = planetFactory.getCloudMesh();
  
  // Обновляем меш планеты
  if (planet) {
    // Если меш изменился, обновляем ссылку
    if (planet !== planetMesh.value) {
      if (planetMesh.value) {
        sceneController.remove(planetMesh.value);
      }
      planetMesh.value = markRaw(planet);
      sceneController.add(planetMesh.value);
    } else {
      // Если меш тот же, но геометрия обновилась, принудительно обновляем
      if (planet.geometry) {
        const positionAttr = planet.geometry.attributes.position;
        if (positionAttr) {
          positionAttr.needsUpdate = true;
        }
        const colorAttr = planet.geometry.attributes.color;
        if (colorAttr) {
          colorAttr.needsUpdate = true;
        }
        planet.geometry.computeVertexNormals();
      }
    }
  }
  
  // Обновляем меш воды
  if (water) {
    if (water !== waterMesh.value) {
      if (waterMesh.value) {
        sceneController.remove(waterMesh.value);
      }
      waterMesh.value = markRaw(water);
      sceneController.add(waterMesh.value);
    }
  } else if (waterMesh.value) {
    sceneController.remove(waterMesh.value);
    waterMesh.value = null;
  }
  
  // Обновляем меш облаков
  if (cloud) {
    if (cloud !== cloudMesh.value) {
      if (cloudMesh.value) {
        sceneController.remove(cloudMesh.value);
      }
      cloudMesh.value = markRaw(cloud);
      sceneController.add(cloudMesh.value);
    }
  } else if (cloudMesh.value) {
    sceneController.remove(cloudMesh.value);
    cloudMesh.value = null;
  }
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);

  // Анимация облаков
  if (planetFactory && settings.clouds && cloudMesh.value) {
    const currentTime = (Date.now() - startTime) / 1000;
    planetFactory.animateClouds(currentTime);
  }

  controls.update();
  renderer.render(sceneController.scene, camera);
}
</script>
