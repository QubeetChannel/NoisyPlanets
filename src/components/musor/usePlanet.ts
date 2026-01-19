import * as THREE from 'three';
import { shallowRef } from 'vue';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import mulberry32 from '../../utils/mulberry32';
import useSettings from './useSettings.ts';

/**
 * Состояние планеты (singleton для hot reload)
 */
let planetState: {
  planet: ReturnType<typeof shallowRef<THREE.Mesh | null>>;
  waterSphere: ReturnType<typeof shallowRef<THREE.Mesh | null>>;
  cloudSphere: ReturnType<typeof shallowRef<THREE.Mesh | null>>;
  cloudBasePositions: Float32Array | null;
  cloudPositions: THREE.BufferAttribute | null;
  basePositions: Float32Array | null;
  positions: THREE.BufferAttribute | null;
} | null = null;

function getPlanetState() {
  if (!planetState) {
    planetState = {
      planet: shallowRef<THREE.Mesh | null>(null),
      waterSphere: shallowRef<THREE.Mesh | null>(null),
      cloudSphere: shallowRef<THREE.Mesh | null>(null),
      cloudBasePositions: null,
      cloudPositions: null,
      basePositions: null,
      positions: null,
    };
  }
  return planetState;
}

function getSettings() {
  return useSettings().settings;
}

/**
 * Создает базовую геометрию планеты (icosahedron)
 */
function createPlanet() {
  const state = getPlanetState();
  const settings = getSettings();
  const geometry = new THREE.IcosahedronGeometry(settings.radius, 64);
  const material = new THREE.MeshStandardMaterial();
  
  state.planet.value = new THREE.Mesh(geometry, material);
  
  state.positions = geometry.attributes.position as THREE.BufferAttribute;
  // Сохраняем только уникальные вершины (используем positions.count, который уже дает уникальные)
  state.basePositions = state.positions.array.slice() as Float32Array;
}

/**
 * Обновляет геометрию планеты, применяя шум с учетом seed
 * @param seed - Семя для генерации шума
 */
function updateGeometry(seed: number) {
  const state = getPlanetState();
  const { positions, basePositions, planet } = state;
  const settings = getSettings();
  
  if (!positions || !basePositions || !planet.value) return;

  const geometry = planet.value.geometry;
  const uniqueVertexCount = positions.count;

  // Восстанавливаем базовые позиции уникальных вершин
  for (let i = 0; i < basePositions.length; i++) {
    positions.array[i] = basePositions[i] ?? 0;
  }

  let vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();

  let NoisePattern = new SimplexNoise({ random: mulberry32(seed) });

  // Работаем только с уникальными вершинами (в раз 3-6 меньше, чем если бы проходили по всем)
  for (let i = 0; i < uniqueVertexCount; i++) {
    vertex.set(positions.getX(i), positions.getY(i), positions.getZ(i));
    normal.copy(vertex).normalize();

    // Генерация шума с октавами
    // settings.frequency используется для размера шума (масштаб деталей)
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
    const baseRadius = 1.5;
    vertex.copy(normal).multiplyScalar(baseRadius + noiseValue);

    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  
  // Обновляем цвета после изменения геометрии
  updateColors();
}

/**
 * Обновляет цвета вершин планеты на основе высоты и настроек цветовых маркеров
 */
function updateColors() {
  const state = getPlanetState();
  const { planet } = state;
  const settings = getSettings();
  
  if (!planet.value || !settings.colors || settings.colors.length === 0) return;

  const geometry = planet.value.geometry;
  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const uniqueVertexCount = positions.count;
  
  // Вычисляем высоты только для уникальных вершин
  let minHeight = Infinity;
  let maxHeight = -Infinity;
  const heights: number[] = new Array(uniqueVertexCount);
  
  for (let i = 0; i < uniqueVertexCount; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const height = Math.sqrt(x * x + y * y + z * z); // Быстрее чем distanceTo
    heights[i] = height;
    minHeight = Math.min(minHeight, height);
    maxHeight = Math.max(maxHeight, height);
  }

  const heightRange = maxHeight - minHeight;
  if (heightRange === 0) return;

  // Сортируем цвета по position (делаем один раз)
  const sortedColors = [...settings.colors].sort((a, b) => a.position - b.position);

  // Вычисляем цвета для уникальных вершин
  const uniqueColors = new Float32Array(uniqueVertexCount * 3);
  
  // Маппинг реального радиуса к position: minHeight (обычно ~1) = position 0, maxHeight (текущий максимум) = position 1
  for (let i = 0; i < uniqueVertexCount; i++) {
    const height = heights[i];
    if (height === undefined) continue;
    
    // Нормализуем высоту к диапазону [0, 1], где 0 = minHeight, 1 = maxHeight
    const normalizedHeight = (height - minHeight) / heightRange;
    
    // Находим интервал для цвета (бинарный поиск был бы быстрее, но для небольшого количества цветов линейный поиск проще)
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

  // Применяем цвета к уникальным вершинам (IcosahedronGeometry всегда индексированная)
  geometry.setAttribute('color', new THREE.BufferAttribute(uniqueColors, 3));
  
  if (planet.value.material instanceof THREE.MeshStandardMaterial) {
    planet.value.material.vertexColors = true;
  }
}

/**
 * Обновляет водную сферу на основе настроек воды
 * Уровень воды: 0 = радиус 1, 1 = радиус 2
 */
function updateWater() {
  const state = getPlanetState();
  const settings = getSettings();
  
  // Вычисляем радиус водной сферы: level 0 → радиус 1, level 1 → радиус 2
  const waterRadius = 1 + (settings.water.level * 1); // 1 + level * (2 - 1)
  
  if (!state.waterSphere.value) {
    const waterGeometry = new THREE.IcosahedronGeometry(settings.radius, 64);
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(settings.water.color).getHex(),
      side: THREE.DoubleSide,
    });
    
    state.waterSphere.value = new THREE.Mesh(waterGeometry, waterMaterial);
    state.waterSphere.value.name = 'WaterSphere';
    const scale = waterRadius / settings.radius;
    state.waterSphere.value.scale.set(scale, scale, scale);
  } else {
    const waterMaterial = state.waterSphere.value.material as THREE.MeshStandardMaterial;
    const scale = waterRadius / settings.radius;
    state.waterSphere.value.scale.set(scale, scale, scale);
    waterMaterial.color.set(new THREE.Color(settings.water.color).getHex());
  }
}

/**
 * Обновляет облачную сферу на основе настроек облаков
 * Облака - простая сфера, но полигоны окрашены по шуму (белые/прозрачные)
 * Уровень облаков: 0 = радиус 2, 1 = радиус 3
 */
function updateClouds() {
  const state = getPlanetState();
  const settings = getSettings();
  
  // Базовый радиус облаков: level 0 → радиус 2, level 1 → радиус 3
  const baseCloudRadius = 2 + (settings.clouds.level * 1); // 2 + level * (3 - 2)
  
  if (!state.cloudSphere.value) {
    const cloudGeometry = new THREE.IcosahedronGeometry(settings.radius, 64);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(settings.clouds.color).getHex(),
      transparent: true,
      vertexColors: true,
      side: THREE.DoubleSide,
    });
    
    state.cloudSphere.value = new THREE.Mesh(cloudGeometry, cloudMaterial);
    state.cloudSphere.value.name = 'CloudSphere';
    
    // Масштабируем сферу до нужного радиуса
    const scale = baseCloudRadius / settings.radius;
    state.cloudSphere.value.scale.set(scale, scale, scale);
    
    // Сохраняем позиции для генерации шума цветов
    state.cloudPositions = cloudGeometry.attributes.position as THREE.BufferAttribute;
    state.cloudBasePositions = state.cloudPositions.array.slice() as Float32Array;
    
    // Применяем шум к цветам облаков
    applyCloudColors(0); // Время 0 для начальной генерации
  } else {
    const cloudMaterial = state.cloudSphere.value.material as THREE.MeshStandardMaterial;
    cloudMaterial.color.set(new THREE.Color(settings.clouds.color).getHex());
    
    // Обновляем радиус сферы
    const scale = baseCloudRadius / settings.radius;
    state.cloudSphere.value.scale.set(scale, scale, scale);
    
    // Обновляем цвета облаков
    if (state.cloudPositions) {
      applyCloudColors(0);
    }
  }
}

/**
 * Применяет шум к цветам вершин облаков
 * Генерирует белые/прозрачные области на основе шума
 * @param time - Время для анимации (в секундах)
 */
function applyCloudColors(time: number = 0) {
  const state = getPlanetState();
  const settings = getSettings();
  
  if (!state.cloudSphere.value || !state.cloudPositions || !state.cloudBasePositions) return;
  
  const geometry = state.cloudSphere.value.geometry;
  const positions = state.cloudPositions;
  const uniqueVertexCount = positions.count;
  const vertex = new THREE.Vector3();
  
  // Используем seed для облаков
  const cloudSeed = settings.seed + 1000;
  const CloudNoisePattern = new SimplexNoise({ random: mulberry32(cloudSeed) });
  
  // Параметры шума для облаков
  const cloudFrequency = settings.frequency * 2.0; // Частота для облаков
  const cloudSpeed = 0.0001; // Скорость движения облаков
  const timeOffset = time * cloudSpeed;
  
  // Массив цветов для вершин (R, G, B для каждой вершины)
  const cloudColors = new Float32Array(uniqueVertexCount * 3);
  
  for (let i = 0; i < uniqueVertexCount; i++) {
    // Получаем позицию вершины (из базовых позиций, так как геометрия не меняется)
    const baseX = state.cloudBasePositions[i * 3] ?? 0;
    const baseY = state.cloudBasePositions[i * 3 + 1] ?? 0;
    const baseZ = state.cloudBasePositions[i * 3 + 2] ?? 0;
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
    // noise3d возвращает [-1, 1], преобразуем к [0, 1]
    const normalizedNoise = (noiseValue + 1) / 2;
    
    // Преобразуем шум в прозрачность: чем больше шум, тем непрозрачнее (белее)
    // Порог можно настроить - ниже порога = прозрачное, выше = белое
    const threshold = 0.3; // Ниже 0.3 - более прозрачное, выше - более белое
    const opacity = Math.max(0, Math.min(1, (normalizedNoise - threshold) / (1 - threshold)));
    
    // Цвет вершины: белый с прозрачностью (реализуем через яркость - 0 = прозрачное, 1 = белое)
    // В Three.js vertex colors работают так, что черный (0,0,0) = невидимый при умножении
    // Но лучше использовать яркость от 0 до 1, где 0 - черный (прозрачный эффект), 1 - белый
    const brightness = opacity;
    cloudColors[i * 3] = brightness;     // R
    cloudColors[i * 3 + 1] = brightness; // G
    cloudColors[i * 3 + 2] = brightness; // B
  }
  
  // Применяем цвета к геометрии
  geometry.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3));
  
  if (state.cloudSphere.value.material instanceof THREE.MeshStandardMaterial) {
    state.cloudSphere.value.material.vertexColors = true;
    state.cloudSphere.value.material.transparent = true;
    // Используем opacity материала для общей прозрачности
    state.cloudSphere.value.material.opacity = 0.8;
  }
}

/**
 * Анимирует облака, обновляя цвета вершин на основе времени
 * @param time - Время в секундах
 */
function animateClouds(time: number) {
  const state = getPlanetState();
  
  if (!state.cloudSphere.value || !state.cloudPositions || !state.cloudBasePositions) return;
  
  // Обновляем только цвета вершин (не геометрию)
  applyCloudColors(time);
}

/**
 * Composable для работы с планетой
 * Предоставляет методы для создания и обновления планеты
 */
export default function usePlanet() {
  const state = getPlanetState();
  return {
    planet: state.planet,
    waterSphere: state.waterSphere,
    cloudSphere: state.cloudSphere,
    createPlanet,
    updateGeometry,
    updateColors,
    updateWater,
    updateClouds,
    animateClouds,
  }
}
