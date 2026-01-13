import * as THREE from 'three'
import { isValidHexColor } from '../scripts/isValidColor.ts'

type StarOptions = {
  position?: [number, number, number]
  color?: string
  intensity?: number
  lookAt?: [number, number, number]
}


export function createSun({
  position = [0,0,0],
  color = '#FFFFFF',
  intensity = 1,
  lookAt = [0,0,0],
}: StarOptions = {}) {
  if (!isValidHexColor(color)) { console.error(`NOISYPLANETS: "${color}" is not the correct color for StarLight! Please change the color`); color = '#FFFFFF'; }  

  const group = new THREE.Group();
  group.name = 'Sun-Light';
  
  const ambientLight = new THREE.AmbientLight(color, intensity);

  const directionalLight = new THREE.DirectionalLight(color, intensity);
  directionalLight.position.set(position[0],position[1],position[2]);
  directionalLight.lookAt(new THREE.Vector3(lookAt[0],lookAt[1],lookAt[2]));
  
  const starMesh = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    new THREE.MeshStandardMaterial({ color: 0xFFFF00 })
  );
  starMesh.position.set(position[0],position[1],position[2]);
  starMesh.lookAt(new THREE.Vector3(lookAt[0],lookAt[1],lookAt[2]));

  group.add(directionalLight, ambientLight, starMesh);

  return group;
}