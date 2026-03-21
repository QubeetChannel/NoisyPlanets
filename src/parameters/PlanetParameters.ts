import { reactive } from 'vue'

export type ColorMarker = {
  color: string;
  position: number;
};

export type PlanetSettings = {
  seed: number;
  scale: number;
  frequency: number;
  amplitude: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  water: boolean;
  waterHeight: number;
  clouds: boolean;
  cloudHeight: number;
  colors: ColorMarker[];
};

let settingsInstance: ReturnType<typeof reactive<PlanetSettings>> | null = null;

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
    waterHeight: 0.5,
    clouds: false,
    cloudHeight: 0.5,
    colors: [
      { color: '#ffffff', position: 1 },
      { color: '#8b6914', position: 0.8 },
      { color: '#32cd32', position: 0.6 },
      { color: '#8b6914', position: 0.3 },
    ],
  });
}

export function getPlanetParameters(): PlanetSettings {
  if (!settingsInstance) {
    settingsInstance = createSettings();
  }
  return settingsInstance;
}

export default function useSettings() {
  return { settings: getPlanetParameters() }
}
