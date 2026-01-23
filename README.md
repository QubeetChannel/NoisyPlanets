# Noisy Planets

Web application for procedural generation of 3D planets using noise algorithms. Allows creating unique planets with customizable terrain, colors, and water.

## Description

Noisy Planets is an interactive application for generating three-dimensional planets based on procedural noise. Users can adjust various generation parameters (seed, frequency, amplitude, octaves, etc.), manage color markers for height-based planet coloring, and configure water level.

## Technologies

### Core Technologies:
- **Vue 3** - Progressive JavaScript framework for building user interfaces
- **TypeScript** - Typed superset of JavaScript
- **Vite** - Fast build tool and development server
- **Three.js** - 3D graphics library for web browsers
- **Simplex Noise** - Algorithm for procedural noise generation
- **Tailwind CSS** - Utility-first CSS framework

### Additional Libraries:
- **OrbitControls** (from Three.js) - Camera control with mouse interaction

## Features

### Planet Generation
- Procedural terrain generation based on Simplex Noise
- Configurable noise parameters:
  - **Seed** - Initial value for generation (0-9999)
  - **Scale** - Icosahedron subdivision level (32-256)
  - **Frequency** - Noise frequency, determines detail size
  - **Amplitude** - Noise amplitude, controls terrain height
  - **Octaves** - Number of noise layers for fractal detail
  - **Persistence** - Amplitude retention between octaves
  - **Lacunarity** - Frequency multiplier between octaves

### Color Management
- Color marker system (1 to 10 markers)
- Each marker has a color (HEX) and position (0-1)
- Automatic color interpolation between markers
- Height-based planet coloring
- Drag & drop for marker position adjustment

### Water
- Adjustable water level (0-1, mapped to radius 1-2)

### Performance
- Asynchronous processing for large planets (over 50,000 vertices)
- Synchronous processing for small planets for maximum speed
- Chunked computation to prevent UI blocking
- Optimization using unique vertices only

## Installation and Setup

### Requirements
- Node.js (LTS version recommended)
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port specified by Vite).

### Production Build
```bash
npm run build
```

Built files will be in the `dist/` folder.

### Preview Production Build
```bash
npm run preview
```

## How It Works

### Data Flow
1. `PlanetParameters.ts` stores all planet settings
2. UI components edit settings through reactive properties
3. `PlanetMesh.ts` reads settings and updates 3D meshes
4. `Scene.vue` displays the result through Three.js

### Planet Generation Process
1. Base icosahedron geometry is created
2. Noise is applied to vertices
3. Vertices are colored based on height
4. Water is created as a separate sphere with configurable parameters

### Optimization
- Working only with unique vertices to reduce computations
- Base positions are saved and restored before applying noise
- Geometry is reused, only attributes (positions, colors) are updated
- Asynchronous processing for large planets prevents UI blocking

## Controls

- **Rotate Camera**: Hold left mouse button and move
- **Zoom In/Out**: Mouse wheel
- **Generate Planet**: Change parameters and click "Generate"
- **Apply Colors**: Configure color markers and click "Apply Colors"
- **Manage Water**: Use the water settings panel

## License

This project is licensed under the MIT License.