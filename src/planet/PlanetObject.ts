import * as THREE from 'three'

export class PlanetObject {
  mesh: THREE.Mesh
  initialized = false

  constructor(mesh: THREE.Mesh) {
    this.mesh = mesh
    this.initialized = true
  }

  dispose() {
    this.mesh.geometry.dispose()
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(m => m.dispose())
    } else {
      this.mesh.material.dispose()
    }
  }
}