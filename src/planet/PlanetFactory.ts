import { PlanetMesh } from './PlanetMesh';
import { getPlanetParameters } from '../parameters/PlanetParameters';
import * as THREE from 'three';

let planetFactoryInstance: PlanetFactory | null = null;

export class PlanetFactory {
  private planetMesh: PlanetMesh;

  constructor() {
    this.planetMesh = new PlanetMesh();
  }

  createBaseMesh(): void {
    this.planetMesh.createMesh();
  }

  async createPlanet(): Promise<void> {
    const settings = getPlanetParameters();
    
    const currentMesh = this.planetMesh.getPlanetMesh();
    if (!currentMesh) {
      this.planetMesh.createMesh();
    } else {
      this.planetMesh.createMesh();
    }
    
    await this.planetMesh.updateVertices(settings.seed);
    
    this.planetMesh.updateWaterHeight();
    this.planetMesh.updateCloudsHeight();
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

  updateCloudsHeight(): void {
    this.planetMesh.updateCloudsHeight();
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
