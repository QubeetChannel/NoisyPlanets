/**
 * Утилита для разбиения тяжелых вычислений на чанки
 * Позволяет не блокировать UI во время обработки
 */

/**
 * Обрабатывает массив данных по частям, не блокируя UI
 * Использует более эффективный подход: обрабатывает большие чанки и дает передышку только когда нужно
 * @param items - массив элементов для обработки
 * @param processor - функция обработки одного элемента
 * @param chunkSize - размер чанка (сколько элементов обработать за один кадр)
 * @param onProgress - опциональный callback для отслеживания прогресса
 * @returns Promise, который резолвится когда все элементы обработаны
 */
export function processInChunks<T>(
  items: T[],
  processor: (item: T, index: number) => void,
  _chunkSize: number = 10000,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    // Для небольших массивов обрабатываем синхронно для скорости
    if (items.length < 50000) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item !== undefined) {
          processor(item, i);
        }
      }
      if (onProgress) {
        onProgress(1);
      }
      resolve();
      return;
    }

    let index = 0;
    const total = items.length;
    const maxTimePerFrame = 16; // Максимальное время обработки за кадр (мс) - увеличили для скорости

    function processChunk() {
      const chunkStartTime = performance.now();
      
      // Обрабатываем большой чанк, но следим за временем
      while (index < total) {
        const item = items[index];
        if (item !== undefined) {
          processor(item, index);
        }
        index++;
        
        // Если прошло слишком много времени, делаем паузу
        if ((performance.now() - chunkStartTime) > maxTimePerFrame) {
          break;
        }
      }
      
      if (onProgress) {
        onProgress(index / total);
      }
      
      if (index < total) {
        // Продолжаем обработку в следующем кадре
        requestAnimationFrame(processChunk);
      } else {
        // Все обработано
        resolve();
      }
    }
    
    // Начинаем обработку
    requestAnimationFrame(processChunk);
  });
}

/**
 * Выполняет функцию в следующем кадре анимации
 */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * Выполняет функцию после небольшой задержки
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
