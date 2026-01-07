<script setup lang="ts">
  import * as THREE from 'three'
  import { ref, onMounted } from 'vue';
  import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
  import mulberry32 from '../Scripts/mulberry32.ts';
  
  const props = defineProps<{
    position?: [number, number, number],
    seed: number,
    frequency: number,
    amplitude: number,
  }>()

  const PlanetPosition: [number, number, number] = props.position ?? [0, 0, 0];


  const Planet = ref()
  const BasicPlanetGeometry = Planet.value?.geometry as THREE.SphereGeometry;

  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();

  const NoisePattern = new SimplexNoise({ random: mulberry32(props.seed) });

  const radius = 1;

  onMounted(() => {
    if (!Planet.value) return;
    
    let geometry = Planet.value.geometry as THREE.BufferGeometry;
    let positions = geometry.attributes.position as THREE.BufferAttribute;

    // создаём массив для цветов (r,g,b для каждой вершины)
    const colors = new Float32Array(positions.count * 3);

    const colorLow = new THREE.Color('#2a3b4c');   // низины
    const colorHigh = new THREE.Color('lightgray');  // горы

    for (let i = 0; i < positions.count; i++) {
      vertex.set(positions.getX(i), positions.getY(i), positions.getZ(i));

      normal.copy(vertex).normalize();

      let n = NoisePattern.noise3d(
        vertex.x * props.frequency + props.seed, 
        vertex.y * props.frequency + props.seed, 
        vertex.z * props.frequency + props.seed
      );

      const height = radius + n * props.amplitude;

      const t = (height - radius + props.amplitude) / 0.7; // нормализуем в [0,1]
      const color = colorLow.clone().lerp(colorHigh, t);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      vertex.copy(normal).multiplyScalar(radius + n * props.amplitude);

      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  })
</script>

<template>
  <TresMesh ref="Planet" :position="PlanetPosition">
    <TresIcosahedronGeometry :args="[1, 30]" />
    <TresMeshStandardMaterial :flat-shading="false" :vertex-colors="true"/>
  </TresMesh>
</template>