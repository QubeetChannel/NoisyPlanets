import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import mulberry32 from '../utils/mulberry32';
import { getPlanetParameters, type PlanetSettings } from '../parameters/PlanetParameters';
import { processInChunks } from '../utils/chunkedProcessing';

export class PlanetMesh {
  private planetMesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private cloudMesh: THREE.Mesh | null = null;
  private cloudBasePositions: Float32Array | null = null;
  private cloudPositions: THREE.BufferAttribute | null = null;
  private basePositions: Float32Array | null = null;
  private positions: THREE.BufferAttribute | null = null;

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
    const material = new THREE.MeshStandardMaterial();
    
    this.planetMesh = new THREE.Mesh(geometry, material);
    
    this.positions = geometry.attributes.position as THREE.BufferAttribute;
    this.basePositions = this.positions.array.slice() as Float32Array;
  }

  async updateVertices(seed: number): Promise<void> {
    const { positions, basePositions, planetMesh } = this;
    const settings = this.getSettings();
    
    if (!positions || !basePositions || !planetMesh) return;

    const geometry = planetMesh.geometry;
    const uniqueVertexCount = positions.count;

    for (let i = 0; i < basePositions.length; i++) {
      positions.array[i] = basePositions[i] ?? 0;
    }

    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const NoisePattern = new SimplexNoise({ random: mulberry32(seed) });
    const baseRadius = 1.5;

    if (uniqueVertexCount < 50000) {
      for (let i = 0; i < uniqueVertexCount; i++) {
        vertex.set(positions.getX(i), positions.getY(i), positions.getZ(i));
        normal.copy(vertex).normalize();

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
          
          currentFrequency *= settings.lacunarity;
          amplitude *= settings.persistence;
        }

        vertex.copy(normal).multiplyScalar(baseRadius + noiseValue);

        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
    } else {
      const indices = Array.from({ length: uniqueVertexCount }, (_, i) => i);

      await processInChunks(
        indices,
        (i) => {
          vertex.set(positions.getX(i), positions.getY(i), positions.getZ(i));
          normal.copy(vertex).normalize();

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
            
            currentFrequency *= settings.lacunarity;
            amplitude *= settings.persistence;
          }

          vertex.copy(normal).multiplyScalar(baseRadius + noiseValue);

          positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        },
        10000
      );
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    await this.updateColors();
  }

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
    
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    const heights: number[] = new Array(uniqueVertexCount);
    
    if (uniqueVertexCount < 50000) {
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

    const sortedColors = [...settings.colors].sort((a, b) => a.position - b.position);

    const uniqueColors = new Float32Array(uniqueVertexCount * 3);
    
    if (uniqueVertexCount < 50000) {
      for (let i = 0; i < uniqueVertexCount; i++) {
        const height = heights[i];
        if (height === undefined) continue;
        
        const normalizedHeight = (height - minHeight) / heightRange;
        
        let colorIndex = sortedColors.length - 1;
        for (let j = 0; j < sortedColors.length - 1; j++) {
          const nextColor = sortedColors[j + 1];
          if (nextColor && normalizedHeight <= nextColor.position) {
            colorIndex = j;
            break;
          }
        }

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
      const indices = Array.from({ length: uniqueVertexCount }, (_, i) => i);
      
      await processInChunks(
        indices,
        (i) => {
          const height = heights[i];
          if (height === undefined) return;
          
          const normalizedHeight = (height - minHeight) / heightRange;
          
          let colorIndex = sortedColors.length - 1;
          for (let j = 0; j < sortedColors.length - 1; j++) {
            const nextColor = sortedColors[j + 1];
            if (nextColor && normalizedHeight <= nextColor.position) {
              colorIndex = j;
              break;
            }
          }

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

    const colorAttribute = new THREE.BufferAttribute(uniqueColors, 3);
    
    if (geometry.attributes.color) {
      geometry.deleteAttribute('color');
    }
    
    geometry.setAttribute('color', colorAttribute);
    colorAttribute.needsUpdate = true;
    
    if (planetMesh.material instanceof THREE.MeshStandardMaterial) {
      planetMesh.material.vertexColors = true;
      planetMesh.material.needsUpdate = true;
    }
    
    geometry.computeVertexNormals();
    
    if (geometry.attributes.position) {
      geometry.attributes.position.needsUpdate = true;
    }
    
    planetMesh.updateMatrix();
    
    console.log('Colors applied successfully:', {
      vertexCount: uniqueVertexCount,
      colorCount: settings.colors.length,
      minHeight,
      maxHeight
    });
  }

  updateWaterHeight(): void {
    const settings = this.getSettings();
    
    if (!settings.water) {
      if (this.waterMesh) {
        this.waterMesh = null;
      }
      return;
    }
    
    const waterRadius = 1 + (settings.waterHeight * 1);
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

  updateCloudsHeight(): void {
    const settings = this.getSettings();
    
    if (!settings.clouds) {
      if (this.cloudMesh) {
        this.cloudMesh = null;
      }
      return;
    }
    
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
      
      const scale = baseCloudRadius / baseRadius;
      this.cloudMesh.scale.set(scale, scale, scale);
      
      this.cloudPositions = cloudGeometry.attributes.position as THREE.BufferAttribute;
      this.cloudBasePositions = this.cloudPositions.array.slice() as Float32Array;
      
      this.applyCloudColors(0);
    } else {
      const scale = baseCloudRadius / baseRadius;
      this.cloudMesh.scale.set(scale, scale, scale);
      
      if (this.cloudPositions) {
        this.applyCloudColors(0);
      }
    }
  }

  private applyCloudColors(time: number = 0): void {
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
    
    for (let i = 0; i < uniqueVertexCount; i++) {
      const baseX = this.cloudBasePositions[i * 3] ?? 0;
      const baseY = this.cloudBasePositions[i * 3 + 1] ?? 0;
      const baseZ = this.cloudBasePositions[i * 3 + 2] ?? 0;
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
    
    this.applyCloudColors(time);
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
