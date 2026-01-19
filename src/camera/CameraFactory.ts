import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

type CameraOptions = {
  startPosition?: [number, number, number]
  lookAt?: [number, number, number]
  fov?: number
  aspect?: number
  near?: number
  far?: number
  enableDamping?: boolean
  dampingFactor?: number
  enablePan?: boolean
  minDistance?: number
  maxDistance?: number
}

type CameraResult = {
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
}

export function createCamera(
  domElement: HTMLElement,
  {
    startPosition = [0, 0, 3],
    lookAt = [0, 0, 0],
    fov = 60,
    aspect = 1,
    near = 0.1,
    far = 100,
    enableDamping = true,
    dampingFactor = 0.05,
    enablePan = false,
    minDistance = 1.5,
    maxDistance = 6,
  }: CameraOptions = {}
): CameraResult {
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
  camera.position.set(startPosition[0], startPosition[1], startPosition[2])
  camera.lookAt(new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2]))

  const controls = new OrbitControls(camera, domElement)
  controls.enableDamping = enableDamping
  controls.dampingFactor = dampingFactor
  controls.enablePan = enablePan
  controls.minDistance = minDistance
  controls.maxDistance = maxDistance

  return { camera, controls }
}
