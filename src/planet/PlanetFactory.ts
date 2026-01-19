import { PlanetMesh } from './PlanetMesh';
import { getPlanetParameters } from '../parameters/PlanetParameters';
import * as THREE from 'three';

// Глобальный экземпляр PlanetFactory (singleton)
let planetFactoryInstance: PlanetFactory | null = null;

/**
 * Фабрика для отрисовки планеты по параметрам из PlanetParameters и PlanetMesh
 */
export class PlanetFactory {
  private planetMesh: PlanetMesh;

  constructor() {
    this.planetMesh = new PlanetMesh();
  }

  /**
   * Создает базовую геометрию планеты (синхронно, быстро)
   */
  createBaseMesh(): void {
    this.planetMesh.createMesh();
  }

  /**
   * Создает планету и применяет начальные настройки (асинхронно)
   * Пересоздает меш если его нет или если изменился Scale
   */
  async createPlanet(): Promise<void> {
    const settings = getPlanetParameters();
    
    // Если меш еще не создан или нужно пересоздать из-за изменения Scale, создаем его
    const currentMesh = this.planetMesh.getPlanetMesh();
    if (!currentMesh) {
      this.planetMesh.createMesh();
    } else {
      // Проверяем, нужно ли пересоздать меш из-за изменения Scale
      // Для этого нужно пересоздать меш (Scale влияет на количество сегментов)
      this.planetMesh.createMesh();
    }
    
    // Применяем шум к вершинам (асинхронно для больших планет, синхронно для маленьких)
    await this.planetMesh.updateVertices(settings.seed);
    
    // Обновляем воду и облака
    this.planetMesh.updateWaterHeight();
    this.planetMesh.updateCloudsHeight();
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
  updateCloudsHeight(): void {
    this.planetMesh.updateCloudsHeight();
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
