import * as THREE from 'three'
import { PlanetObject } from './PlanetObject.ts'

export function createPlanet(): PlanetObject {
  const geometry = new THREE.IcosahedronGeometry(1, 30)
  const material = new THREE.MeshStandardMaterial({
    color: 0x44aa88,
    wireframe: true
  })

  const mesh = new THREE.Mesh(geometry, material)
  return new PlanetObject(mesh)
}