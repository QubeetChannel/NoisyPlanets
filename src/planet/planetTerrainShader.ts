import * as THREE from 'three';
import type { ColorMarker, PlanetSettings } from '../parameters/PlanetParameters';

const MAX_COLOR_STOPS = 16;

/** Теоретический диапазон радиуса при |simplex| ≤ 1 на каждой октаве (octaves ограничены как в шейдере). */
export function theoreticalPlanetHeightRange(settings: PlanetSettings): { min: number; max: number } {
  const baseRadius = 1.5;
  const oct = Math.min(16, Math.max(0, Math.floor(settings.octaves)));
  let ampSum = 0;
  let a = settings.amplitude;
  for (let o = 0; o < oct; o++) {
    ampSum += a;
    a *= settings.persistence;
  }
  return { min: baseRadius - ampSum, max: baseRadius + ampSum };
}

const VERTEX_HEADER = /* glsl */ `
uniform int uTerrainPerm[512];
uniform float uTerrainBaseRadius;
uniform float uTerrainFrequency;
uniform float uTerrainAmplitude;
uniform float uTerrainLacunarity;
uniform float uTerrainPersistence;
uniform int uTerrainOctaves;

varying float vPlanetRadius;

int terrainPermAt(int idx) {
  int w = int(mod(float(idx), 512.0));
  return uTerrainPerm[w];
}

vec3 terrainGrad3(int gi) {
  if (gi == 0) return vec3(1.0, 1.0, 0.0);
  if (gi == 1) return vec3(-1.0, 1.0, 0.0);
  if (gi == 2) return vec3(1.0, -1.0, 0.0);
  if (gi == 3) return vec3(-1.0, -1.0, 0.0);
  if (gi == 4) return vec3(1.0, 0.0, 1.0);
  if (gi == 5) return vec3(-1.0, 0.0, 1.0);
  if (gi == 6) return vec3(1.0, 0.0, -1.0);
  if (gi == 7) return vec3(-1.0, 0.0, -1.0);
  if (gi == 8) return vec3(0.0, 1.0, 1.0);
  if (gi == 9) return vec3(0.0, -1.0, 1.0);
  if (gi == 10) return vec3(0.0, 1.0, -1.0);
  return vec3(0.0, -1.0, -1.0);
}

float terrainDot3(vec3 g, float x, float y, float z) {
  return g.x * x + g.y * y + g.z * z;
}

float terrainSimplex3(vec3 vin) {
  float xin = vin.x;
  float yin = vin.y;
  float zin = vin.z;
  float F3 = 1.0 / 3.0;
  float s = (xin + yin + zin) * F3;
  float i = floor(xin + s);
  float j = floor(yin + s);
  float k = floor(zin + s);
  float G3 = 1.0 / 6.0;
  float t = (i + j + k) * G3;
  float X0 = i - t;
  float Y0 = j - t;
  float Z0 = k - t;
  float x0 = xin - X0;
  float y0 = yin - Y0;
  float z0 = zin - Z0;

  float i1, j1, k1;
  float i2, j2, k2;
  if (x0 >= y0) {
    if (y0 >= z0) { i1 = 1.0; j1 = 0.0; k1 = 0.0; i2 = 1.0; j2 = 1.0; k2 = 0.0; }
    else if (x0 >= z0) { i1 = 1.0; j1 = 0.0; k1 = 0.0; i2 = 1.0; j2 = 0.0; k2 = 1.0; }
    else { i1 = 0.0; j1 = 0.0; k1 = 1.0; i2 = 1.0; j2 = 0.0; k2 = 1.0; }
  } else {
    if (y0 < z0) { i1 = 0.0; j1 = 0.0; k1 = 1.0; i2 = 0.0; j2 = 1.0; k2 = 1.0; }
    else if (x0 < z0) { i1 = 0.0; j1 = 1.0; k1 = 0.0; i2 = 0.0; j2 = 1.0; k2 = 1.0; }
    else { i1 = 0.0; j1 = 1.0; k1 = 0.0; i2 = 1.0; j2 = 1.0; k2 = 0.0; }
  }

  float x1 = x0 - i1 + G3;
  float y1 = y0 - j1 + G3;
  float z1 = z0 - k1 + G3;
  float x2 = x0 - i2 + 2.0 * G3;
  float y2 = y0 - j2 + 2.0 * G3;
  float z2 = z0 - k2 + 2.0 * G3;
  float x3 = x0 - 1.0 + 3.0 * G3;
  float y3 = y0 - 1.0 + 3.0 * G3;
  float z3 = z0 - 1.0 + 3.0 * G3;

  int ii = int(mod(i, 256.0));
  int jj = int(mod(j, 256.0));
  int kk = int(mod(k, 256.0));

  int gi0 = terrainPermAt(ii + terrainPermAt(jj + terrainPermAt(kk))) % 12;
  int gi1 = terrainPermAt(ii + int(i1) + terrainPermAt(jj + int(j1) + terrainPermAt(kk + int(k1)))) % 12;
  int gi2 = terrainPermAt(ii + int(i2) + terrainPermAt(jj + int(j2) + terrainPermAt(kk + int(k2)))) % 12;
  int gi3 = terrainPermAt(ii + 1 + terrainPermAt(jj + 1 + terrainPermAt(kk + 1))) % 12;

  float n0, n1, n2, n3;
  float t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 < 0.0) n0 = 0.0;
  else { t0 *= t0; n0 = t0 * t0 * terrainDot3(terrainGrad3(gi0), x0, y0, z0); }

  float t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 < 0.0) n1 = 0.0;
  else { t1 *= t1; n1 = t1 * t1 * terrainDot3(terrainGrad3(gi1), x1, y1, z1); }

  float t2n = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2n < 0.0) n2 = 0.0;
  else { t2n *= t2n; n2 = t2n * t2n * terrainDot3(terrainGrad3(gi2), x2, y2, z2); }

  float t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 < 0.0) n3 = 0.0;
  else { t3 *= t3; n3 = t3 * t3 * terrainDot3(terrainGrad3(gi3), x3, y3, z3); }

  return 32.0 * (n0 + n1 + n2 + n3);
}

float terrainFbm(vec3 dir) {
  float f = uTerrainFrequency;
  float a = uTerrainAmplitude;
  float sum = 0.0;
  for (int o = 0; o < 16; o++) {
    if (o >= uTerrainOctaves) break;
    sum += terrainSimplex3(dir * f) * a;
    f *= uTerrainLacunarity;
    a *= uTerrainPersistence;
  }
  return sum;
}
`;

const FRAGMENT_HEADER = /* glsl */ `
varying float vPlanetRadius;

uniform vec3 uPlanetColors[${MAX_COLOR_STOPS}];
uniform float uPlanetStops[${MAX_COLOR_STOPS}];
uniform int uPlanetColorCount;
uniform float uPlanetHMin;
uniform float uPlanetHMax;

vec3 planetTerrainColorFromHeight(float radius) {
  float span = uPlanetHMax - uPlanetHMin;
  float nt = span > 1e-6 ? (radius - uPlanetHMin) / span : 0.5;
  nt = clamp(nt, 0.0, 1.0);
  int last = uPlanetColorCount - 1;
  if (uPlanetColorCount <= 0) return vec3(1.0);
  if (uPlanetColorCount == 1) return uPlanetColors[0];
  int idx = last;
  for (int j = 0; j < ${MAX_COLOR_STOPS}; j++) {
    if (j >= uPlanetColorCount - 1) break;
    if (nt <= uPlanetStops[j + 1]) {
      idx = j;
      break;
    }
  }
  if (idx >= last) return uPlanetColors[last];
  float p0 = uPlanetStops[idx];
  float p1 = uPlanetStops[idx + 1];
  if (abs(p1 - p0) < 1e-6) return uPlanetColors[idx];
  float uu = clamp((nt - p0) / (p1 - p0), 0.0, 1.0);
  return mix(uPlanetColors[idx], uPlanetColors[idx + 1], uu);
}
`;

const VERTEX_REPLACE_BLOCK = /* glsl */ `
#include <beginnormal_vertex>
#include <morphnormal_vertex>
#include <skinbase_vertex>
#include <skinnormal_vertex>
vec3 pn = normalize( position );
float h0 = terrainFbm( pn );
vec3 pp0 = pn * ( uTerrainBaseRadius + h0 );
float pe = 0.002;
vec3 pt1 = cross( pn, vec3( 0.0, 1.0, 0.0 ) );
if ( dot( pt1, pt1 ) < 1e-8 ) pt1 = cross( pn, vec3( 1.0, 0.0, 0.0 ) );
pt1 = normalize( pt1 );
vec3 pt2 = cross( pn, pt1 );
vec3 pn1 = normalize( pn + pt1 * pe );
vec3 pn2 = normalize( pn + pt2 * pe );
float h1 = terrainFbm( pn1 );
float h2 = terrainFbm( pn2 );
vec3 pp1 = pn1 * ( uTerrainBaseRadius + h1 );
vec3 pp2 = pn2 * ( uTerrainBaseRadius + h2 );
objectNormal = normalize( cross( pp1 - pp0, pp2 - pp0 ) );
#include <defaultnormal_vertex>
#include <normal_vertex>
vec3 transformed = pp0;
vPlanetRadius = length( transformed );
`;

const VERTEX_NORMAL_TO_BEGIN_REGEX = /#include <beginnormal_vertex>[\s\S]*?#include <begin_vertex>/;

function sortedColorMarkers(colors: ColorMarker[]): ColorMarker[] {
  return [...colors].sort((a, b) => a.position - b.position);
}

function fillColorUniformArrays(
  sorted: ColorMarker[],
  colorsOut: THREE.Vector3[],
  stopsOut: number[]
): number {
  const tmp = new THREE.Color();
  const n = Math.min(sorted.length, MAX_COLOR_STOPS);
  for (let i = 0; i < MAX_COLOR_STOPS; i++) {
    if (i < n) {
      const m = sorted[i]!;
      tmp.set(m.color);
      colorsOut[i]!.set(tmp.r, tmp.g, tmp.b);
      stopsOut[i] = m.position;
    } else {
      colorsOut[i]!.set(1, 1, 1);
      stopsOut[i] = 0;
    }
  }
  return n;
}

export type PlanetTerrainUniformHolder = {
  uTerrainPerm: { value: Int32Array };
  uTerrainBaseRadius: { value: number };
  uTerrainFrequency: { value: number };
  uTerrainAmplitude: { value: number };
  uTerrainLacunarity: { value: number };
  uTerrainPersistence: { value: number };
  uTerrainOctaves: { value: number };
  uPlanetColors: { value: THREE.Vector3[] };
  uPlanetStops: { value: number[] };
  uPlanetColorCount: { value: number };
  uPlanetHMin: { value: number };
  uPlanetHMax: { value: number };
};

export function createPlanetTerrainUniforms(): PlanetTerrainUniformHolder {
  const colorsArr = Array.from({ length: MAX_COLOR_STOPS }, () => new THREE.Vector3(1, 1, 1));
  const stopsArr = new Array<number>(MAX_COLOR_STOPS).fill(0);
  return {
    uTerrainPerm: { value: new Int32Array(512) },
    uTerrainBaseRadius: { value: 1.5 },
    uTerrainFrequency: { value: 2 },
    uTerrainAmplitude: { value: 0.15 },
    uTerrainLacunarity: { value: 2 },
    uTerrainPersistence: { value: 0.55 },
    uTerrainOctaves: { value: 4 },
    uPlanetColors: { value: colorsArr },
    uPlanetStops: { value: stopsArr },
    uPlanetColorCount: { value: 0 },
    uPlanetHMin: { value: 1 },
    uPlanetHMax: { value: 2 },
  };
}

/**
 * Встраивает simplex + fbm (вершина) и раскраску по высоте (фрагмент) в MeshStandardMaterial.
 */
export function installPlanetTerrainShader(
  material: THREE.MeshStandardMaterial,
  uniforms: PlanetTerrainUniformHolder
): void {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_HEADER}`)
      .replace(VERTEX_NORMAL_TO_BEGIN_REGEX, VERTEX_REPLACE_BLOCK);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_HEADER}`)
      .replace('#include <color_fragment>', 'diffuseColor.rgb *= planetTerrainColorFromHeight( vPlanetRadius );');
  };

  material.userData.planetTerrainUniforms = uniforms;
}

/** Обновляет uniform’ы шума и градиента высот (таблица perm как у SimplexNoise из three.js). */
export function syncPlanetTerrainNoiseUniforms(
  uniforms: PlanetTerrainUniformHolder,
  settings: PlanetSettings,
  perm512: Int32Array
): void {
  uniforms.uTerrainPerm.value = perm512;
  uniforms.uTerrainBaseRadius.value = 1.5;
  uniforms.uTerrainFrequency.value = settings.frequency;
  uniforms.uTerrainAmplitude.value = settings.amplitude;
  uniforms.uTerrainLacunarity.value = settings.lacunarity;
  uniforms.uTerrainPersistence.value = settings.persistence;
  uniforms.uTerrainOctaves.value = Math.min(16, Math.max(0, Math.floor(settings.octaves)));

  const { min, max } = theoreticalPlanetHeightRange(settings);
  uniforms.uPlanetHMin.value = min;
  uniforms.uPlanetHMax.value = max;
}

export function syncPlanetTerrainColorUniforms(
  uniforms: PlanetTerrainUniformHolder,
  settings: PlanetSettings
): void {
  const sorted = sortedColorMarkers(settings.colors);
  uniforms.uPlanetColorCount.value = fillColorUniformArrays(
    sorted,
    uniforms.uPlanetColors.value,
    uniforms.uPlanetStops.value
  );
  const { min, max } = theoreticalPlanetHeightRange(settings);
  uniforms.uPlanetHMin.value = min;
  uniforms.uPlanetHMax.value = max;
}
