import * as THREE from 'three'

export function createOrbitCamera() {
  const group = new THREE.Group()
  group.name = 'orbit-camera'

  // const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  // dirLight.position.set(3, 3, 3)

  // const ambient = new THREE.AmbientLight(0xffffff, 0.4)

  // group.add(dirLight, ambient)





  
  return group
}