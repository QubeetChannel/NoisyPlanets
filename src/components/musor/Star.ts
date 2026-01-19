import * as THREE from 'three'
import { isValidHexColor } from '../../scripts/isValidColor.ts'

type StarOptions = {
  position?: [number, number, number]
  starColor?: string
  lightColor?: string
  intensity?: number
  lookAt?: [number, number, number]
}


export function createStar({
  position = [0,0,0],
  starColor = '#FFFF00',
  lightColor = '#FFFFFF',
  intensity = 1,
  lookAt = [0,0,0],
}: StarOptions = {}) {
  if (!isValidHexColor(starColor)) { console.error(`NOISYPLANETS: "${starColor}" is not the correct color for Star! Please change the color`); starColor = '#FFFF00'; }  
  if (!isValidHexColor(lightColor)) { console.error(`NOISYPLANETS: "${lightColor}" is not the correct color for StarLight! Please change the color`); lightColor = '#FFFFFF'; }  

  const group = new THREE.Group();
  group.name = 'Star';
  
  const ambientLight = new THREE.AmbientLight(lightColor, intensity);

  const directionalLight = new THREE.DirectionalLight(lightColor, intensity);
  directionalLight.position.set(position[0],position[1],position[2]);
  directionalLight.lookAt(new THREE.Vector3(lookAt[0],lookAt[1],lookAt[2]));
  
  const starMesh = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(starColor).getHex() })
  );
  starMesh.position.set(position[0],position[1],position[2]);
  starMesh.lookAt(new THREE.Vector3(lookAt[0],lookAt[1],lookAt[2]));

  group.add(directionalLight, ambientLight, starMesh);

  return group;
}
