import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import mulberry32 from '../utils/mulberry32';
import { getPlanetParameters, type PlanetSettings } from '../parameters/PlanetParameters';
import { processInChunks, nextFrame } from '../utils/chunkedProcessing';

/**
 * Класс для управления мешем планеты
 */
export class PlanetMesh {
  private planetMesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private cloudMesh: THREE.Mesh | null = null;
  private uniquePlanetVertices: Float32Array | null = null;
  private cloudBasePositions: Float32Array | null = null;
  private cloudPositions: THREE.BufferAttribute | null = null;
  private basePositions: Float32Array | null = null;
  private positions: THREE.BufferAttribute | null = null;

  /**
   * Получить настройки планеты
   */
  private getSettings(): PlanetSettings {
    return getPlanetParameters();
  }

  /**
   * Создает мэш икосаэдра планеты, воды, облаков с параметрами (1, PlanetParameters.Scale)
   * Сохраняет базовые позиции вершин в UniquePlanetVertices для оптимизации
   * Если меш уже существует, он будет пересоздан с новыми параметрами
   */
  createMesh(): void {
    const settings = this.getSettings();
    
    // Удаляем старый меш если он существует (для освобождения памяти)
    if (this.planetMesh) {
      if (this.planetMesh.geometry) {
        this.planetMesh.geometry.dispose();
      }
      if (this.planetMesh.material instanceof THREE.Material) {
        this.planetMesh.material.dispose();
      }
    }
    
    const geometry = new THREE.IcosahedronGeometry(1, settings.scale);
    const material = new THREE.MeshStandardMaterial();
    
    this.planetMesh = new THREE.Mesh(geometry, material);
    
    this.positions = geometry.attributes.position as THREE.BufferAttribute;
    // Сохраняем только уникальные вершины
    this.basePositions = this.positions.array.slice() as Float32Array;
    this.uniquePlanetVertices = this.basePositions;
  }

  /**
   * Изменяет положение вершин PlanetMesh на основе шума (асинхронно для больших планет, синхронно для маленьких)
   * Принимает seed (number) для генерации детерминированного шума
   * Применяет SimplexNoise с октавами к каждой вершине, используя параметры из PlanetParameters
   * Использует UniquePlanetVertices как базовые позиции, восстанавливает их перед применением шума
   * Обработка происходит по частям для больших планет, синхронно для маленьких
   */
  async updateVertices(seed: number): Promise<void> {
    const { positions, basePositions, planetMesh } = this;
    const settings = this.getSettings();
    
    if (!positions || !basePositions || !planetMesh) return;

    const geometry = planetMesh.geometry;
    const uniqueVertexCount = positions.count;

    // Восстанавливаем базовые позиции уникальных вершин
    for (let i = 0; i < basePositions.length; i++) {
      positions.array[i] = basePositions[i] ?? 0;
    }

    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const NoisePattern = new SimplexNoise({ random: mulberry32(seed) });
    const baseRadius = 1.5;

    // Для планет до 50000 вершин обрабатываем синхронно для максимальной скорости
    if (uniqueVertexCount < 50000) {
      for (let i = 0; i < uniqueVertexCount; i++) {
        vertex.set(positions.getX(i), positions.getY(i), positions.getZ(i));
        normal.copy(vertex).normalize();

        // Генерация шума с октавами
        let noiseValue = 0;
        let amplitude = settings.amplitude;
        let currentFrequency = settings.frequency;

        for (let octave = 0; octave < settings.octaves; octave++) {
          const octaveNoise = NoisePattern.noise3d(
            vertex.x * currentFrequency, 
            vertex.y * currentFrequency, 
            vertex.z * currentFrequency
          );
          
          noiseValue += octaveNoise * amplitude;
          
          // Для следующей октавы увеличиваем частоту и уменьшаем амплитуду
          currentFrequency *= settings.lacunarity;
          amplitude *= settings.persistence;
        }

        // Размер планеты фиксирован: средний радиус 1.5 (базовый радиус + шум)
        vertex.copy(normal).multiplyScalar(baseRadius + noiseValue);

        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
    } else {
      // Для больших планет обрабатываем по частям
      const indices = Array.from({ length: uniqueVertexCount }, (_, i) => i);

      await processInChunks(
        indices,
        (i) => {
          vertex.set(positions.getX(i), positions.getY(i), positions.getZ(i));
          normal.copy(vertex).normalize();

          // Генерация шума с октавами
          let noiseValue = 0;
          let amplitude = settings.amplitude;
          let currentFrequency = settings.frequency;

          for (let octave = 0; octave < settings.octaves; octave++) {
            const octaveNoise = NoisePattern.noise3d(
              vertex.x * currentFrequency, 
              vertex.y * currentFrequency, 
              vertex.z * currentFrequency
            );
            
            noiseValue += octaveNoise * amplitude;
            
            // Для следующей октавы увеличиваем частоту и уменьшаем амплитуду
            currentFrequency *= settings.lacunarity;
            amplitude *= settings.persistence;
          }

          // Размер планеты фиксирован: средний радиус 1.5 (базовый радиус + шум)
          vertex.copy(normal).multiplyScalar(baseRadius + noiseValue);

          positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        },
        10000
      );
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Обновляем цвета после изменения геометрии
    await this.updateColors();
  }

  /**
   * Изменяет цвет полигонов в соответствии с Colors[] (асинхронно для больших планет, синхронно для маленьких)
   * Вычисляет min/max высоту вершин после применения шума
   * Нормализует высоты к [0, 1] и маппит их к Colors[].position
   * Применяет интерполяцию цветов между соседними маркерами
   */
  async updateColors(): Promise<void> {
    const { planetMesh } = this;
    const settings = this.getSettings();
    
    if (!planetMesh) {
      console.warn('PlanetMesh.updateColors: planetMesh not available');
      return;
    }
    
    if (!settings.colors || settings.colors.length === 0) {
      console.warn('PlanetMesh.updateColors: colors not available');
      return;
    }

    const geometry = planetMesh.geometry;
    if (!geometry) {
      console.warn('PlanetMesh.updateColors: geometry not available');
      return;
    }
    
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    if (!positions) {
      console.warn('PlanetMesh.updateColors: positions not available');
      return;
    }
    
    const uniqueVertexCount = positions.count;
    if (uniqueVertexCount === 0) {
      console.warn('PlanetMesh.updateColors: no vertices available');
      return;
    }
    
    // Вычисляем высоты только для уникальных вершин (первый проход)
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    const heights: number[] = new Array(uniqueVertexCount);
    
    // Для планет до 50000 вершин обрабатываем синхронно для максимальной скорости
    if (uniqueVertexCount < 50000) {
      // Вычисляем высоты синхронно
      for (let i = 0; i < uniqueVertexCount; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const height = Math.sqrt(x * x + y * y + z * z);
        heights[i] = height;
        minHeight = Math.min(minHeight, height);
        maxHeight = Math.max(maxHeight, height);
      }
    } else {
      // Для больших планет обрабатываем по частям
      const indices = Array.from({ length: uniqueVertexCount }, (_, i) => i);
      
      await processInChunks(
        indices,
        (i) => {
          const x = positions.getX(i);
          const y = positions.getY(i);
          const z = positions.getZ(i);
          const height = Math.sqrt(x * x + y * y + z * z);
          heights[i] = height;
          minHeight = Math.min(minHeight, height);
          maxHeight = Math.max(maxHeight, height);
        },
        10000
      );
    }

    const heightRange = maxHeight - minHeight;
    if (heightRange === 0) return;

    // Сортируем цвета по position
    const sortedColors = [...settings.colors].sort((a, b) => a.position - b.position);

    // Вычисляем цвета для уникальных вершин
    const uniqueColors = new Float32Array(uniqueVertexCount * 3);
    
    // Для планет до 50000 вершин обрабатываем синхронно для максимальной скорости
    if (uniqueVertexCount < 50000) {
      // Вычисляем цвета синхронно
      for (let i = 0; i < uniqueVertexCount; i++) {
        const height = heights[i];
        if (height === undefined) continue;
        
        // Нормализуем высоту к диапазону [0, 1]
        const normalizedHeight = (height - minHeight) / heightRange;
        
        // Находим интервал для цвета
        let colorIndex = sortedColors.length - 1;
        for (let j = 0; j < sortedColors.length - 1; j++) {
          const nextColor = sortedColors[j + 1];
          if (nextColor && normalizedHeight <= nextColor.position) {
            colorIndex = j;
            break;
          }
        }

        // Интерполяция между цветами
        let color: THREE.Color;
        const currentColor = sortedColors[colorIndex];
        const nextColor = sortedColors[colorIndex + 1];
        
        if (colorIndex < sortedColors.length - 1 && nextColor && currentColor && nextColor.position !== currentColor.position) {
          const colorA = new THREE.Color(currentColor.color);
          const colorB = new THREE.Color(nextColor.color);
          const t = (normalizedHeight - currentColor.position) / 
                    (nextColor.position - currentColor.position);
          color = new THREE.Color().lerpColors(colorA, colorB, Math.max(0, Math.min(1, t)));
        } else {
          color = new THREE.Color(currentColor?.color || '#ffffff');
        }

        uniqueColors[i * 3] = color.r;
        uniqueColors[i * 3 + 1] = color.g;
        uniqueColors[i * 3 + 2] = color.b;
      }
    } else {
      // Для больших планет обрабатываем по частям
      const indices = Array.from({ length: uniqueVertexCount }, (_, i) => i);
      
      await processInChunks(
        indices,
        (i) => {
          const height = heights[i];
          if (height === undefined) return;
          
          // Нормализуем высоту к диапазону [0, 1]
          const normalizedHeight = (height - minHeight) / heightRange;
          
          // Находим интервал для цвета
          let colorIndex = sortedColors.length - 1;
          for (let j = 0; j < sortedColors.length - 1; j++) {
            const nextColor = sortedColors[j + 1];
            if (nextColor && normalizedHeight <= nextColor.position) {
              colorIndex = j;
              break;
            }
          }

          // Интерполяция между цветами
          let color: THREE.Color;
          const currentColor = sortedColors[colorIndex];
          const nextColor = sortedColors[colorIndex + 1];
          
          if (colorIndex < sortedColors.length - 1 && nextColor && currentColor && nextColor.position !== currentColor.position) {
            const colorA = new THREE.Color(currentColor.color);
            const colorB = new THREE.Color(nextColor.color);
            const t = (normalizedHeight - currentColor.position) / 
                      (nextColor.position - currentColor.position);
            color = new THREE.Color().lerpColors(colorA, colorB, Math.max(0, Math.min(1, t)));
          } else {
            color = new THREE.Color(currentColor?.color || '#ffffff');
          }

          uniqueColors[i * 3] = color.r;
          uniqueColors[i * 3 + 1] = color.g;
          uniqueColors[i * 3 + 2] = color.b;
        },
        10000
      );
    }

    // Применяем цвета к уникальным вершинам
    const colorAttribute = new THREE.BufferAttribute(uniqueColors, 3);
    
    // Удаляем старый атрибут цвета если он существует
    if (geometry.attributes.color) {
      geometry.deleteAttribute('color');
    }
    
    geometry.setAttribute('color', colorAttribute);
    colorAttribute.needsUpdate = true;
    
    if (planetMesh.material instanceof THREE.MeshStandardMaterial) {
      planetMesh.material.vertexColors = true;
      planetMesh.material.needsUpdate = true;
    }
    
    // Принудительно обновляем геометрию
    geometry.computeVertexNormals();
    
    // Помечаем атрибуты для обновления
    if (geometry.attributes.position) {
      geometry.attributes.position.needsUpdate = true;
    }
    
    // Помечаем меш для обновления
    planetMesh.updateMatrix();
    
    console.log('Colors applied successfully:', {
      vertexCount: uniqueVertexCount,
      colorCount: settings.colors.length,
      minHeight,
      maxHeight
    });
  }

  /**
   * Изменяет высоту уровня воды
   * Маппит PlanetParameters.WaterHeight (0-1) на радиус (1-2)
   * Обновляет scale водной сферы и цвет материала
   */
  updateWaterHeight(): void {
    const settings = this.getSettings();
    
    if (!settings.water) {
      // Если вода выключена, удаляем меш
      if (this.waterMesh) {
        this.waterMesh = null;
      }
      return;
    }
    
    // Вычисляем радиус водной сферы: level 0 → радиус 1, level 1 → радиус 2
    const waterRadius = 1 + (settings.waterHeight * 1);
    const baseRadius = 1;
    
    if (!this.waterMesh) {
      const waterGeometry = new THREE.IcosahedronGeometry(baseRadius, settings.scale);
      const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x3b4cc0, // Цвет воды по умолчанию
        side: THREE.DoubleSide,
      });
      
      this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
      this.waterMesh.name = 'WaterMesh';
      const scale = waterRadius / baseRadius;
      this.waterMesh.scale.set(scale, scale, scale);
    } else {
      const scale = waterRadius / baseRadius;
      this.waterMesh.scale.set(scale, scale, scale);
    }
  }

  /**
   * Изменяет высоту облаков
   * Маппит PlanetParameters.CloudHeight (0-1) на радиус (2-3)
   * Обновляет scale облачной сферы
   */
  updateCloudsHeight(): void {
    const settings = this.getSettings();
    
    if (!settings.clouds) {
      // Если облака выключены, удаляем меш
      if (this.cloudMesh) {
        this.cloudMesh = null;
      }
      return;
    }
    
    // Базовый радиус облаков: level 0 → радиус 2, level 1 → радиус 3
    const baseCloudRadius = 2 + (settings.cloudHeight * 1);
    const baseRadius = 1;
    
    if (!this.cloudMesh) {
      const cloudGeometry = new THREE.IcosahedronGeometry(baseRadius, settings.scale);
      const cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        vertexColors: true,
        side: THREE.DoubleSide,
      });
      
      this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
      this.cloudMesh.name = 'CloudMesh';
      
      // Масштабируем сферу до нужного радиуса
      const scale = baseCloudRadius / baseRadius;
      this.cloudMesh.scale.set(scale, scale, scale);
      
      // Сохраняем позиции для генерации шума цветов
      this.cloudPositions = cloudGeometry.attributes.position as THREE.BufferAttribute;
      this.cloudBasePositions = this.cloudPositions.array.slice() as Float32Array;
      
      // Применяем шум к цветам облаков
      this.applyCloudColors(0);
    } else {
      // Обновляем радиус сферы
      const scale = baseCloudRadius / baseRadius;
      this.cloudMesh.scale.set(scale, scale, scale);
      
      // Обновляем цвета облаков
      if (this.cloudPositions) {
        this.applyCloudColors(0);
      }
    }
  }

  /**
   * Применяет шум к цветам вершин облаков для создания белых/прозрачных областей
   * Принимает time (number, опционально) для анимации облаков
   * Генерирует шум для каждой вершины CloudMesh на основе её позиции и времени
   * Преобразует значение шума в яркость цвета (0-1), где 0 = прозрачное, 1 = белое
   * Применяет цвета через vertexColors к геометрии облаков
   */
  private applyCloudColors(time: number = 0): void {
    const settings = this.getSettings();
    
    if (!this.cloudMesh || !this.cloudPositions || !this.cloudBasePositions) return;
    
    const geometry = this.cloudMesh.geometry;
    const positions = this.cloudPositions;
    const uniqueVertexCount = positions.count;
    const vertex = new THREE.Vector3();
    
    // Используем seed для облаков
    const cloudSeed = settings.seed + 1000;
    const CloudNoisePattern = new SimplexNoise({ random: mulberry32(cloudSeed) });
    
    // Параметры шума для облаков
    const cloudFrequency = settings.frequency * 2.0;
    const cloudSpeed = 0.0001;
    const timeOffset = time * cloudSpeed;
    
    // Массив цветов для вершин
    const cloudColors = new Float32Array(uniqueVertexCount * 3);
    
    for (let i = 0; i < uniqueVertexCount; i++) {
      const baseX = this.cloudBasePositions[i * 3] ?? 0;
      const baseY = this.cloudBasePositions[i * 3 + 1] ?? 0;
      const baseZ = this.cloudBasePositions[i * 3 + 2] ?? 0;
      vertex.set(baseX, baseY, baseZ);
      
      // Генерируем шум для определения прозрачности
      let noiseValue = 0;
      let amplitude = 1.0;
      let currentFrequency = cloudFrequency;
      
      // 2-3 октавы шума для более плавного вида
      for (let octave = 0; octave < 3; octave++) {
        const octaveNoise = CloudNoisePattern.noise3d(
          vertex.x * currentFrequency + timeOffset, 
          vertex.y * currentFrequency + timeOffset, 
          vertex.z * currentFrequency + timeOffset
        );
        
        noiseValue += octaveNoise * amplitude;
        currentFrequency *= 2.0;
        amplitude *= 0.5;
      }
      
      // Нормализуем шум к [0, 1]
      const normalizedNoise = (noiseValue + 1) / 2;
      
      // Преобразуем шум в прозрачность
      const threshold = 0.3;
      const opacity = Math.max(0, Math.min(1, (normalizedNoise - threshold) / (1 - threshold)));
      
      const brightness = opacity;
      cloudColors[i * 3] = brightness;
      cloudColors[i * 3 + 1] = brightness;
      cloudColors[i * 3 + 2] = brightness;
    }
    
    // Применяем цвета к геометрии
    geometry.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3));
    
    if (this.cloudMesh.material instanceof THREE.MeshStandardMaterial) {
      this.cloudMesh.material.vertexColors = true;
      this.cloudMesh.material.transparent = true;
      this.cloudMesh.material.opacity = 0.8;
    }
  }

  /**
   * Анимирует облака, обновляя цвета вершин на основе времени
   * Принимает time (number) - время в секундах с момента запуска
   * Вызывает applyCloudColors() с текущим временем для создания эффекта движения облаков
   */
  animateClouds(time: number): void {
    if (!this.cloudMesh || !this.cloudPositions || !this.cloudBasePositions) return;
    
    // Обновляем только цвета вершин (не геометрию)
    this.applyCloudColors(time);
  }

  // Геттеры для доступа к мешам
  getPlanetMesh(): THREE.Mesh | null {
    return this.planetMesh;
  }

  getWaterMesh(): THREE.Mesh | null {
    return this.waterMesh;
  }

  getCloudMesh(): THREE.Mesh | null {
    return this.cloudMesh;
  }
}
