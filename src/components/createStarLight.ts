import * as THREE from 'three'
import { isValidHexColor } from '../scripts/isValidColor.ts'

type StarOptions = {
  intensity?: number
  color?: string
}


export function createStarLight({
  intensity = 1,
  color = '#FFFFFF',
}: StarOptions = {}) {
  if (!isValidHexColor(color)) {
    console.error(`NOISYPLANETS: "${color}" is not the correct color for StarLight! Please change the color`)
    color = '#FFFFFF';
  }  

  const group = new THREE.Group()
  group.name = 'star-light'

  const directionalLight = new THREE.DirectionalLight(color, intensity)
  directionalLight.position.set(3, 3, 3)

  const ambientLight = new THREE.AmbientLight(color, intensity)

  group.add(directionalLight, ambientLight)

  return group
}