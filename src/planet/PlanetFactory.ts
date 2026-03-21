import { PlanetMesh } from './PlanetMesh';
import { getPlanetParameters } from '../parameters/PlanetParameters';
import { nextFrame } from '../utils/chunkedProcessing';
import * as THREE from 'three';

let planetFactoryInstance: PlanetFactory | null = null;

export class PlanetFactory {
  private planetMesh: PlanetMesh;
  /** Scale геометрии планеты после последнего createMesh (не пересоздаём икосаэдр при смене только seed) */
  private planetGeometryScale: number | null = null;

  constructor() {
    this.planetMesh = new PlanetMesh();
  }

  createBaseMesh(): void {
    this.planetMesh.createMesh();
    this.planetGeometryScale = getPlanetParameters().scale;
  }

  async createPlanet(): Promise<void> {
    const settings = getPlanetParameters();
<<<<<<< HEAD

    const mesh = this.planetMesh.getPlanetMesh();
    const needNewGeometry = !mesh || this.planetGeometryScale !== settings.scale;

    if (needNewGeometry) {
      if (mesh && this.planetGeometryScale !== null && this.planetGeometryScale !== settings.scale) {
        this.planetMesh.disposeWaterAndCloudMeshes();
      }
      await nextFrame();
=======
    
    const currentMesh = this.planetMesh.getPlanetMesh();
    if (!currentMesh) {
      this.planetMesh.createMesh();
    } else {
>>>>>>> 92ea9f39a9320ccc693c8e0a2482edd794163619
      this.planetMesh.createMesh();
      this.planetGeometryScale = settings.scale;
    }
<<<<<<< HEAD

    await this.planetMesh.updateVertices(settings.seed);

=======
    
    await this.planetMesh.updateVertices(settings.seed);
    
>>>>>>> 92ea9f39a9320ccc693c8e0a2482edd794163619
    this.planetMesh.updateWaterHeight();
    await this.planetMesh.updateCloudsHeight();
  }

  getPlanetMesh(): THREE.Mesh | null {
    return this.planetMesh.getPlanetMesh();
  }

  getWaterMesh(): THREE.Mesh | null {
    return this.planetMesh.getWaterMesh();
  }

  getCloudMesh(): THREE.Mesh | null {
    return this.planetMesh.getCloudMesh();
  }

  async updateVertices(seed: number): Promise<void> {
    await this.planetMesh.updateVertices(seed);
  }

  async updateColors(): Promise<void> {
    await this.planetMesh.updateColors();
  }

  updateWaterHeight(): void {
    this.planetMesh.updateWaterHeight();
  }

<<<<<<< HEAD
  /**
   * Обновить высоту облаков
   */
  async updateCloudsHeight(): Promise<void> {
    await this.planetMesh.updateCloudsHeight();
=======
  updateCloudsHeight(): void {
    this.planetMesh.updateCloudsHeight();
>>>>>>> 92ea9f39a9320ccc693c8e0a2482edd794163619
  }

  animateClouds(time: number): void {
    this.planetMesh.animateClouds(time);
  }
}

export function getPlanetFactory(): PlanetFactory {
  if (!planetFactoryInstance) {
    planetFactoryInstance = new PlanetFactory();
  }
  return planetFactoryInstance;
}

export function setPlanetFactory(instance: PlanetFactory): void {
  planetFactoryInstance = instance;
}
