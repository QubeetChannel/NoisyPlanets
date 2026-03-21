import { PlanetMesh } from './PlanetMesh';
import { getPlanetParameters } from '../parameters/PlanetParameters';
import { nextFrame } from '../utils/chunkedProcessing';
import * as THREE from 'three';

// Глобальный экземпляр PlanetFactory (singleton)
let planetFactoryInstance: PlanetFactory | null = null;

/**
 * Фабрика для отрисовки планеты по параметрам из PlanetParameters и PlanetMesh
 */
export class PlanetFactory {
  private planetMesh: PlanetMesh;
  /** Scale геометрии планеты после последнего createMesh (не пересоздаём икосаэдр при смене только seed) */
  private planetGeometryScale: number | null = null;

  constructor() {
    this.planetMesh = new PlanetMesh();
  }

  /**
   * Создает базовую геометрию планеты (синхронно, быстро)
   */
  createBaseMesh(): void {
    this.planetMesh.createMesh();
    this.planetGeometryScale = getPlanetParameters().scale;
  }

  /**
   * Создает планету и применяет начальные настройки (асинхронно)
   * Пересоздает меш если его нет или если изменился Scale
   */
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

  /**
   * Получить меш планеты
   */
  getPlanetMesh(): THREE.Mesh | null {
    return this.planetMesh.getPlanetMesh();
  }

  /**
   * Получить меш воды
   */
  getWaterMesh(): THREE.Mesh | null {
    return this.planetMesh.getWaterMesh();
  }

  /**
   * Получить меш облаков
   */
  getCloudMesh(): THREE.Mesh | null {
    return this.planetMesh.getCloudMesh();
  }

  /**
   * Обновить геометрию планеты (применить шум) - асинхронно
   */
  async updateVertices(seed: number): Promise<void> {
    await this.planetMesh.updateVertices(seed);
  }

  /**
   * Обновить цвета планеты - асинхронно
   */
  async updateColors(): Promise<void> {
    await this.planetMesh.updateColors();
  }

  /**
   * Обновить высоту воды
   */
  updateWaterHeight(): void {
    this.planetMesh.updateWaterHeight();
  }

  /**
   * Обновить высоту облаков
   */
  async updateCloudsHeight(): Promise<void> {
    await this.planetMesh.updateCloudsHeight();
  }

  /**
   * Анимировать облака
   */
  animateClouds(time: number): void {
    this.planetMesh.animateClouds(time);
  }
}

/**
 * Получить глобальный экземпляр PlanetFactory
 */
export function getPlanetFactory(): PlanetFactory {
  if (!planetFactoryInstance) {
    planetFactoryInstance = new PlanetFactory();
  }
  return planetFactoryInstance;
}

/**
 * Установить глобальный экземпляр PlanetFactory
 */
export function setPlanetFactory(instance: PlanetFactory): void {
  planetFactoryInstance = instance;
}
