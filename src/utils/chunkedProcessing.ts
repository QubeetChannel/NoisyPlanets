export function processInChunks<T>(
  items: T[],
  processor: (item: T, index: number) => void,
  _chunkSize: number = 10000,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve) => {
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
    const maxTimePerFrame = 16;

    function processChunk() {
      const chunkStartTime = performance.now();
      
      while (index < total) {
        const item = items[index];
        if (item !== undefined) {
          processor(item, index);
        }
        index++;
        
        if ((performance.now() - chunkStartTime) > maxTimePerFrame) {
          break;
        }
      }
      
      if (onProgress) {
        onProgress(index / total);
      }
      
      if (index < total) {
        requestAnimationFrame(processChunk);
      } else {
        resolve();
      }
    }
    
    requestAnimationFrame(processChunk);
  });
}

export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
