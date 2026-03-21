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

    const mesh = this.planetMesh.getPlanetMesh();
    const needNewGeometry = !mesh || this.planetGeometryScale !== settings.scale;

    if (needNewGeometry) {
      if (mesh && this.planetGeometryScale !== null && this.planetGeometryScale !== settings.scale) {
        this.planetMesh.disposeWaterAndCloudMeshes();
      }
      await nextFrame();
      this.planetMesh.createMesh();
      this.planetGeometryScale = settings.scale;
    }

    await this.planetMesh.updateVertices(settings.seed);

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

  async updateCloudsHeight(): Promise<void> {
    await this.planetMesh.updateCloudsHeight();
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
