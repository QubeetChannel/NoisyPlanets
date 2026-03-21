import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import mulberry32 from '../utils/mulberry32';
import { getPlanetParameters, type PlanetSettings } from '../parameters/PlanetParameters';
import { getSimplexPerm512 } from './simplexPermutation';
import {
  createPlanetTerrainUniforms,
  installPlanetTerrainShader,
  syncPlanetTerrainColorUniforms,
  syncPlanetTerrainNoiseUniforms,
  theoreticalPlanetHeightRange,
  type PlanetTerrainUniformHolder,
} from './planetTerrainShader';
import { processInChunks } from '../utils/chunkedProcessing';

export class PlanetMesh {
  private planetMesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private cloudMesh: THREE.Mesh | null = null;
  private cloudBasePositions: Float32Array | null = null;
  private cloudPositions: THREE.BufferAttribute | null = null;
  private basePositions: Float32Array | null = null;
  private positions: THREE.BufferAttribute | null = null;
  private planetTerrainUniforms: PlanetTerrainUniformHolder | null = null;

  private getSettings(): PlanetSettings {
    return getPlanetParameters();
  }

  createMesh(): void {
    const settings = this.getSettings();

    if (this.planetMesh) {
      if (this.planetMesh.geometry) {
        this.planetMesh.geometry.dispose();
      }
      if (this.planetMesh.material instanceof THREE.Material) {
        this.planetMesh.material.dispose();
      }
    }

    const geometry = new THREE.IcosahedronGeometry(1, settings.scale);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: false,
    });
    this.planetTerrainUniforms = createPlanetTerrainUniforms();
    installPlanetTerrainShader(material, this.planetTerrainUniforms);
    const perm = getSimplexPerm512(settings.seed);
    syncPlanetTerrainNoiseUniforms(this.planetTerrainUniforms, settings, perm);
    syncPlanetTerrainColorUniforms(this.planetTerrainUniforms, settings);

    this.planetMesh = new THREE.Mesh(geometry, material);

    this.positions = geometry.attributes.position as THREE.BufferAttribute;
    this.basePositions = this.positions.array.slice() as Float32Array;

    const maxR = theoreticalPlanetHeightRange(settings).max;
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), maxR * 1.05);
  }

  disposeWaterAndCloudMeshes(): void {
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      if (this.waterMesh.material instanceof THREE.Material) {
        this.waterMesh.material.dispose();
      }
      this.waterMesh = null;
    }
    if (this.cloudMesh) {
      this.cloudMesh.geometry.dispose();
      if (this.cloudMesh.material instanceof THREE.Material) {
        this.cloudMesh.material.dispose();
      }
      this.cloudMesh = null;
    }
    this.cloudPositions = null;
    this.cloudBasePositions = null;
  }

  async updateVertices(seed: number): Promise<void> {
    const { positions, basePositions, planetMesh, planetTerrainUniforms } = this;
    const settings = this.getSettings();

    if (!positions || !basePositions || !planetMesh || !planetTerrainUniforms) return;

    const perm = getSimplexPerm512(seed);
    syncPlanetTerrainNoiseUniforms(planetTerrainUniforms, settings, perm);
    syncPlanetTerrainColorUniforms(planetTerrainUniforms, settings);
  }

  async updateColors(): Promise<void> {
    const { planetMesh, planetTerrainUniforms } = this;
    const settings = this.getSettings();

    if (!planetMesh || !planetTerrainUniforms) {
      console.warn('PlanetMesh.updateColors: planetMesh or uniforms not available');
      return;
    }

    if (!settings.colors || settings.colors.length === 0) {
      console.warn('PlanetMesh.updateColors: colors not available');
      return;
    }

    const geometry = planetMesh.geometry;
    if (geometry.attributes.color) {
      geometry.deleteAttribute('color');
    }

    syncPlanetTerrainColorUniforms(planetTerrainUniforms, settings);

    if (planetMesh.material instanceof THREE.MeshStandardMaterial) {
      planetMesh.material.vertexColors = false;
    }
  }

  updateWaterHeight(): void {
    const settings = this.getSettings();

    if (!settings.water) {
      if (this.waterMesh) {
        this.waterMesh = null;
      }
      return;
    }

    const waterRadius = 1 + settings.waterHeight * 1;
    const baseRadius = 1;

    if (!this.waterMesh) {
      const waterGeometry = new THREE.IcosahedronGeometry(baseRadius, settings.scale);
      const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x3b4cc0,
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

  async updateCloudsHeight(): Promise<void> {
    const settings = this.getSettings();

    if (!settings.clouds) {
      if (this.cloudMesh) {
        this.cloudMesh = null;
      }
      return;
    }

    const baseCloudRadius = 2 + settings.cloudHeight * 1;
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

      const scale = baseCloudRadius / baseRadius;
      this.cloudMesh.scale.set(scale, scale, scale);

      this.cloudPositions = cloudGeometry.attributes.position as THREE.BufferAttribute;
      this.cloudBasePositions = this.cloudPositions.array.slice() as Float32Array;

      await this.applyCloudColors(0);
    } else {
      const scale = baseCloudRadius / baseRadius;
      this.cloudMesh.scale.set(scale, scale, scale);

      if (this.cloudPositions) {
        await this.applyCloudColors(0);
      }
    }
  }

  private async applyCloudColors(time: number = 0): Promise<void> {
    const settings = this.getSettings();

    if (!this.cloudMesh || !this.cloudPositions || !this.cloudBasePositions) return;

    const geometry = this.cloudMesh.geometry;
    const positions = this.cloudPositions;
    const uniqueVertexCount = positions.count;
    const vertex = new THREE.Vector3();

    const cloudSeed = settings.seed + 1000;
    const CloudNoisePattern = new SimplexNoise({ random: mulberry32(cloudSeed) });

    const cloudFrequency = settings.frequency * 2.0;
    const cloudSpeed = 0.0001;
    const timeOffset = time * cloudSpeed;

    const cloudColors = new Float32Array(uniqueVertexCount * 3);
    const base = this.cloudBasePositions;

    const fillVertex = (i: number) => {
      const baseX = base[i * 3] ?? 0;
      const baseY = base[i * 3 + 1] ?? 0;
      const baseZ = base[i * 3 + 2] ?? 0;
      vertex.set(baseX, baseY, baseZ);

      let noiseValue = 0;
      let amplitude = 1.0;
      let currentFrequency = cloudFrequency;

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

      const normalizedNoise = (noiseValue + 1) / 2;
      const threshold = 0.3;
      const opacity = Math.max(0, Math.min(1, (normalizedNoise - threshold) / (1 - threshold)));
      const brightness = opacity;
      cloudColors[i * 3] = brightness;
      cloudColors[i * 3 + 1] = brightness;
      cloudColors[i * 3 + 2] = brightness;
    };

    if (uniqueVertexCount < 50000) {
      for (let i = 0; i < uniqueVertexCount; i++) fillVertex(i);
    } else {
      const indices = Array.from({ length: uniqueVertexCount }, (_, i) => i);
      await processInChunks(indices, (i) => fillVertex(i), 8000);
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3));

    if (this.cloudMesh.material instanceof THREE.MeshStandardMaterial) {
      this.cloudMesh.material.vertexColors = true;
      this.cloudMesh.material.transparent = true;
      this.cloudMesh.material.opacity = 0.8;
    }
  }

  animateClouds(time: number): void {
    if (!this.cloudMesh || !this.cloudPositions || !this.cloudBasePositions) return;

    void this.applyCloudColors(time);
  }

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
