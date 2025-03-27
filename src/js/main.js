import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { createNoise2D } from 'simplex-noise';
import { Player } from './Player';

class MinecraftGame {
    constructor() {
        // Make game instance globally available
        window.game = this;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.player = null;
        this.blocks = new Map();
        this.textureLoader = new THREE.TextureLoader();
        this.blockTextures = {};
        this.noise2D = createNoise2D();
        
        this.loadTextures();
        this.init();
    }

    loadTextures() {
        const createTexture = (color, borderColor = null, pattern = null) => {
            const canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 16;
            const ctx = canvas.getContext('2d');
            
            // Fill background
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 16, 16);
            
            // Add pattern if specified
            if (pattern === 'wood') {
                ctx.fillStyle = '#4a3728';
                ctx.fillRect(2, 0, 2, 16);
                ctx.fillRect(9, 0, 2, 16);
            } else if (pattern === 'leaves') {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                for (let i = 0; i < 8; i++) {
                    const x = Math.random() * 16;
                    const y = Math.random() * 16;
                    ctx.fillRect(x, y, 2, 2);
                }
            } else {
                // Add noise for texture
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                for (let i = 0; i < 32; i++) {
                    const x = Math.random() * 16;
                    const y = Math.random() * 16;
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            // Add border if specified
            if (borderColor) {
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(0, 0, 16, 16);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            return texture;
        };

        this.blockTextures = {
            dirt: createTexture('#8B4513'),
            grass_side: createTexture('#8B4513', '#228B22'),
            grass_top: createTexture('#228B22'),
            stone: createTexture('#808080'),
            sand: createTexture('#F4A460'),
            water: (() => {
                const texture = createTexture('#0077BE');
                texture.transparent = true;
                return texture;
            })(),
            snow: createTexture('#FFFFFF'),
            wood: createTexture('#8B4513', null, 'wood'),
            leaves: createTexture('#228B22', null, 'leaves')
        };
    }

    getBiome(x, z) {
        const scale = 0.02;
        const temperature = this.noise2D(x * scale, z * scale);
        const moisture = this.noise2D((x + 1000) * scale, (z + 1000) * scale);
        
        if (temperature < -0.3) return 'snow';
        if (temperature > 0.3 && moisture < -0.2) return 'desert';
        if (moisture > 0.3) return 'forest';
        return 'plains';
    }

    getBlockMaterial(height, y, biome) {
        // Water
        if (y < 0) {
            return new THREE.MeshPhongMaterial({
                map: this.blockTextures.water,
                transparent: true,
                opacity: 0.6
            });
        }

        // Snow biome
        if (biome === 'snow' && y === height) {
            return new THREE.MeshPhongMaterial({ map: this.blockTextures.snow });
        }

        // Desert biome
        if (biome === 'desert' && y >= height - 3) {
            return new THREE.MeshPhongMaterial({ map: this.blockTextures.sand });
        }

        // Surface blocks
        if (y === height) {
            return [
                new THREE.MeshPhongMaterial({ map: this.blockTextures.grass_side }), // right
                new THREE.MeshPhongMaterial({ map: this.blockTextures.grass_side }), // left
                new THREE.MeshPhongMaterial({ map: this.blockTextures.grass_top }), // top
                new THREE.MeshPhongMaterial({ map: this.blockTextures.dirt }), // bottom
                new THREE.MeshPhongMaterial({ map: this.blockTextures.grass_side }), // front
                new THREE.MeshPhongMaterial({ map: this.blockTextures.grass_side }) // back
            ];
        }

        // Dirt layer
        if (y >= height - 3) {
            return new THREE.MeshPhongMaterial({ map: this.blockTextures.dirt });
        }

        // Stone
        return new THREE.MeshPhongMaterial({ map: this.blockTextures.stone });
    }

    createTree(x, y, z) {
        const height = 5 + Math.floor(Math.random() * 3);
        
        // Create trunk
        for (let i = 0; i < height; i++) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshPhongMaterial({ map: this.blockTextures.wood });
            const block = new THREE.Mesh(geometry, material);
            block.position.set(x, y + i, z);
            block.castShadow = true;
            block.receiveShadow = true;
            this.scene.add(block);
            this.blocks.set(`${x},${y + i},${z}`, block);
        }

        // Create leaves
        for (let ox = -2; ox <= 2; ox++) {
            for (let oy = -2; oy <= 2; oy++) {
                for (let oz = -2; oz <= 2; oz++) {
                    if (Math.abs(ox) + Math.abs(oy) + Math.abs(oz) <= 3) {
                        const leafY = y + height - 2 + oy;
                        const geometry = new THREE.BoxGeometry(1, 1, 1);
                        const material = new THREE.MeshPhongMaterial({
                            map: this.blockTextures.leaves,
                            transparent: true,
                            alphaTest: 0.5
                        });
                        const block = new THREE.Mesh(geometry, material);
                        block.position.set(x + ox, leafY, z + oz);
                        block.castShadow = true;
                        block.receiveShadow = true;
                        this.scene.add(block);
                        this.blocks.set(`${x + ox},${leafY},${z + oz}`, block);
                    }
                }
            }
        }
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 20, 0);
        
        // Setup controls
        this.controls = new PointerLockControls(this.camera, document.body);
        
        // Setup player
        this.player = new Player(this.camera, this.controls);
        
        // Add event listeners
        document.addEventListener('click', () => {
            this.controls.lock();
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(100, 100, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Add sky
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);

        // Generate world
        this.generateTerrain();

        // Start game loop
        this.animate();
    }

    generateTerrain() {
        const size = 50;
        const waterLevel = -2;

        for (let x = -size; x < size; x++) {
            for (let z = -size; z < size; z++) {
                const biome = this.getBiome(x, z);
                
                // Generate base terrain height
                const baseHeight = this.noise2D(x * 0.05, z * 0.05) * 10;
                const roughness = this.noise2D((x + 1000) * 0.1, (z + 1000) * 0.1) * 5;
                let height = Math.floor(baseHeight + roughness);

                // Adjust height based on biome
                if (biome === 'snow') height += 5;
                if (biome === 'desert') height = Math.min(height, 3);

                // Generate terrain column
                for (let y = waterLevel; y <= height; y++) {
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const material = this.getBlockMaterial(height, y, biome);
                    const block = new THREE.Mesh(geometry, material);
                    
                    block.position.set(x, y, z);
                    block.castShadow = true;
                    block.receiveShadow = true;
                    this.scene.add(block);
                    
                    const key = `${x},${y},${z}`;
                    this.blocks.set(key, block);
                }

                // Add trees in forest biome
                if (biome === 'forest' && height > waterLevel) {
                    if (Math.random() < 0.05) { // 5% chance for a tree
                        this.createTree(x, height + 1, z);
                    }
                }
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update player
        if (this.player) {
            this.player.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
const game = new MinecraftGame(); 