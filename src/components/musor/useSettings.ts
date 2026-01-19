import { reactive } from 'vue'

/**
 * Тип для цветового маркера
 */
export type ColorMarker = {
  color: string;
  position: number; // Позиция от 0 (низ) до 1 (верх)
};

/**
 * Настройки воды
 */
export type WaterSettings = {
  color: string;     // Цвет воды
  level: number;     // Уровень воды от 0 (радиус 1) до 1 (радиус 2)
};

/**
 * Настройки облаков
 */
export type CloudsSettings = {
  color: string;     // Цвет облаков
  level: number;     // Уровень облаков от 0 (радиус 2) до 1 (радиус 3)
};

/**
 * Тип настроек генерации планеты
 */
export type PlanetSettings = {
  seed: number;
  amplitude: number;      // Амплитуда шума
  frequency: number;      // Частота шума (размер деталей)
  radius: number;         // Базовый радиус (используется только для создания геометрии)
  octaves: number;        // Количество октав шума
  persistence: number;    // Сохранение амплитуды между октавами
  lacunarity: number;     // Множитель частоты между октавами
  colors: ColorMarker[];  // Цветовые маркеры для раскраски по высоте
  water: WaterSettings;   // Настройки воды
  clouds: CloudsSettings; // Настройки облаков
};

// Singleton для hot reload - создается один раз, но при hot reload пересоздается
let settingsInstance: ReturnType<typeof reactive<PlanetSettings>> | null = null;

/**
 * Создает дефолтные настройки генерации планеты
 */
function createSettings(): PlanetSettings {
  return reactive({
    seed: 42,
    amplitude: 0.15,
    frequency: 2,
    radius: 1,
    octaves: 4,
    persistence: 0.55,
    lacunarity: 2.0,
    colors: [
      { color: '#ffffff', position: 1 },   // Снег (вершины)
      { color: '#8b6914', position: 0.8 }, // Горы/скалы
      { color: '#32cd32', position: 0.6 }, // Леса
      { color: '#8b6914', position: 0.3 }, // Равнины/земля
    ],
    water: {
      color: '#3b4cc0',
      level: 0.2,  // Уровень воды: 0 = радиус 1, 1 = радиус 2
    },
    clouds: {
      color: '#ffffff',
      level: 0.5,  // Уровень облаков: 0 = радиус 2, 1 = радиус 3
    }
  });
}

/**
 * Composable для управления настройками планеты
 * Использует singleton pattern для сохранения состояния при hot reload
 */
export default function useSettings() {
  // При hot reload модуль перезагружается, создаем новый экземпляр
  if (!settingsInstance) {
    settingsInstance = createSettings();
  }
  return { settings: settingsInstance }
}
