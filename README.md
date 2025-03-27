# Minecraft Clone in Three.js

A basic Minecraft-style game built with Three.js, featuring procedural terrain generation, biomes, and basic player controls.

## Features

### World Generation
- Procedurally generated terrain using Simplex noise
- Multiple biomes:
  - Plains: Default grassland biome
  - Forest: Tree-covered areas
  - Desert: Sandy terrain with lower elevation
  - Snow: Higher elevation with snow-covered peaks
- Dynamic terrain features:
  - Mountains and valleys
  - Lakes and oceans
  - Trees in forest biomes
  - Layered terrain (grass/snow → dirt → stone)

### Block Types
- Grass blocks with different textures for top and sides
- Dirt blocks
- Stone blocks
- Sand blocks in desert biomes
- Snow blocks in snow biomes
- Water blocks (semi-transparent)
- Wood blocks (tree trunks)
- Leaf blocks (semi-transparent)

### Player Controls
- WASD / Arrow keys for movement
- Mouse for looking around
- Space bar for jumping
- Click to lock/unlock mouse pointer
- Collision detection with blocks

### Graphics
- Procedurally generated textures
- Dynamic shadows
- Sky dome
- Pixelated Minecraft-style look
- Anti-aliasing support

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd craft
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Dependencies

- Three.js: 3D graphics library
- Simplex Noise: Terrain generation
- Vite: Development server and build tool

## Development

The project structure:
```
craft/
├── src/
│   ├── js/
│   │   ├── main.js     # Game initialization and world generation
│   │   └── Player.js   # Player controls and physics
│   └── styles/
│       └── style.css   # Basic styling
├── index.html
├── package.json
└── vite.config.js
```

## Controls

- **W/↑**: Move forward
- **S/↓**: Move backward
- **A/←**: Strafe left
- **D/→**: Strafe right
- **Space**: Jump
- **Mouse**: Look around
- **Click**: Lock mouse pointer
- **Esc**: Unlock mouse pointer

## Future Improvements

- Block breaking and placing
- Inventory system
- More block types
- Day/night cycle
- Basic crafting system
- Simple mobs
- Multiplayer support
- Save/load world

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 