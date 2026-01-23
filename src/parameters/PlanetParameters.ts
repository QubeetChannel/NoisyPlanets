import { reactive } from 'vue'

/**
 * Тип для цветового маркера
 */
export type ColorMarker = {
  color: string;
  position: number; // Позиция от 0 (низ) до 1 (верх)
};

/**
 * Тип настроек генерации планеты
 */
export type PlanetSettings = {
  seed: number;
  scale: number;         // Размерность Икосаэдра для спавна планеты
  frequency: number;     // Частота шума (размер деталей)
  amplitude: number;     // Амплитуда шума
  octaves: number;       // Количество октав шума
  persistence: number;   // Сохранение амплитуды между октавами
  lacunarity: number;    // Множитель частоты между октавами
  water: boolean;        // Включена ли вода
  waterHeight: number;   // Уровень воды (0-1)
  clouds: boolean;       // Включены ли облака
  cloudHeight: number;   // Уровень облаков (0-1)
  colors: ColorMarker[]; // Цветовые маркеры для раскраски по высоте
};

// Singleton для hot reload - создается один раз, но при hot reload пересоздается
let settingsInstance: ReturnType<typeof reactive<PlanetSettings>> | null = null;

/**
 * Создает дефолтные настройки генерации планеты
 */
function createSettings(): PlanetSettings {
  return reactive({
    seed: 42,
    scale: 128,
    amplitude: 0.15,
    frequency: 2,
    octaves: 4,
    persistence: 0.55,
    lacunarity: 2.0,
    water: true,
    waterHeight: 0.5,  // Уровень воды: 0 = радиус 1, 1 = радиус 2
    clouds: false,      // Облака выключены по умолчанию
    cloudHeight: 0.5,  // Уровень облаков: 0 = радиус 2, 1 = радиус 3
    colors: [
      { color: '#ffffff', position: 1 },   // Снег (вершины)
      { color: '#8b6914', position: 0.8 }, // Горы/скалы
      { color: '#32cd32', position: 0.6 }, // Леса
      { color: '#8b6914', position: 0.3 }, // Равнины/земля
    ],
  });
}

/**
 * Получить настройки планеты
 * Использует singleton pattern для сохранения состояния при hot reload
 */
export function getPlanetParameters(): PlanetSettings {
  if (!settingsInstance) {
    settingsInstance = createSettings();
  }
  return settingsInstance;
}

/**
 * Экспорт для обратной совместимости (если нужно)
 */
export default function useSettings() {
  return { settings: getPlanetParameters() }
}
