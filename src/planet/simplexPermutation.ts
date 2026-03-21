import mulberry32 from '../utils/mulberry32';

/**
 * Таблица perm[512] как в three/addons/math/SimplexNoise.js (для совпадения с CPU-шумом).
 */
export function getSimplexPerm512(seed: number): Int32Array {
  const rng = mulberry32(seed);
  const p = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    p[i] = Math.floor(rng() * 256);
  }
  const perm = new Int32Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255]!;
  }
  return perm;
}
