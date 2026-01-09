import * as THREE from 'three';
import { shallowRef } from 'vue';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import mulberry32 from './Scripts/mulberry32.ts';
import useSettings from './useSettings.ts';

const { settings } = useSettings();
const planet = shallowRef<THREE.Mesh | null>(null)

let basePositions: Float32Array | null = null
let positions: THREE.BufferAttribute | null = null


function createPlanet() {
  const geometry = new THREE.IcosahedronGeometry(settings.radius, 30);
  const material = new THREE.MeshStandardMaterial();
  
  planet.value = new THREE.Mesh(geometry, material);
  
  positions = geometry.attributes.position as THREE.BufferAttribute;
  basePositions = positions.array.slice() as Float32Array;
}



// function updateGeometry(seed: number) {
//   if (!positions || !basePositions) return;

//   let vertex = new THREE.Vector3();
//   const normal = new THREE.Vector3();

//   let NoisePattern = new SimplexNoise({ random: mulberry32(seed) });

//   // const arr = positions.array;

//   for (let i = 0; i < positions.count; i++) {
//     vertex.set(positions.getX(i), positions.getY(i), positions.getZ(i));
//     normal.copy(vertex).normalize();

//     let noise = NoisePattern.noise3d(
//       vertex.x * settings.frequency, 
//       vertex.y * settings.frequency, 
//       vertex.z * settings.frequency
//     );

//     // const height = settings.radius + noise * settings.AMPLITUDE;

//     vertex.copy(normal).multiplyScalar(settings.radius + noise * settings.amplitude);

//     positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
//   }

//   positions.needsUpdate = true;
//   planet.value!.geometry.computeVertexNormals();
// }



// function updateColors(Colors: {color: string, position: number}) {
//   if (!positions || !basePositions) return;

  

//   const colors = new Float32Array(positions.count * 3);

//   const colorLow = new THREE.Color('#2a3b4c');   // низины
//   const colorHigh = new THREE.Color('lightgray');  // горы

//   const arr = positions.array;

//   for (let i = 0; i < arr.length; i++) {
//     const height = vertex.distanceTo(center)
//   }
// }



export default function usePlanet() {
  return {
    planet,
    createPlanet,
    // updateGeometry,
  }
}