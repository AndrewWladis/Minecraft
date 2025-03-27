import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
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
        
        this.loadTextures();
        this.init();
    }

    loadTextures() {
        // Create basic textures using data URLs
        const createTexture = (color, borderColor = null) => {
            const canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 16;
            const ctx = canvas.getContext('2d');
            
            // Fill background
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 16, 16);
            
            // Add noise for texture
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < 32; i++) {
                const x = Math.random() * 16;
                const y = Math.random() * 16;
                ctx.fillRect(x, y, 1, 1);
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

        // Create textures for each block type
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
            })()
        };
    }

    getBlockMaterial(height) {
        if (height < 0) {
            // Water block
            return new THREE.MeshPhongMaterial({
                map: this.blockTextures.water,
                transparent: true,
                opacity: 0.6
            });
        }
        if (height === 0) {
            // Sand block
            return new THREE.MeshPhongMaterial({
                map: this.blockTextures.sand
            });
        }
        if (height < 3) {
            // Grass block with different textures for top, sides, and bottom
            return [
                new THREE.MeshPhongMaterial({ map: this.blockTextures.grass_side }), // right
                new THREE.MeshPhongMaterial({ map: this.blockTextures.grass_side }), // left
                new THREE.MeshPhongMaterial({ map: this.blockTextures.grass_top }), // top
                new THREE.MeshPhongMaterial({ map: this.blockTextures.dirt }), // bottom
                new THREE.MeshPhongMaterial({ map: this.blockTextures.grass_side }), // front
                new THREE.MeshPhongMaterial({ map: this.blockTextures.grass_side }) // back
            ];
        }
        if (height < 6) {
            // Dirt block
            return new THREE.MeshPhongMaterial({
                map: this.blockTextures.dirt
            });
        }
        // Stone block
        return new THREE.MeshPhongMaterial({
            map: this.blockTextures.stone
        });
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
        const size = 50; // Size of the world
        const height = 10; // Maximum height of terrain

        // Create ground plane
        for (let x = -size; x < size; x++) {
            for (let z = -size; z < size; z++) {
                // Simple height generation using Perlin-like noise
                const y = Math.floor(
                    (Math.sin(x * 0.1) * Math.cos(z * 0.1) + 
                    Math.sin(x * 0.05) * Math.cos(z * 0.05)) * height
                );
                
                // Create block
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = this.getBlockMaterial(y);
                const block = new THREE.Mesh(geometry, material);
                
                block.position.set(x, y, z);
                block.castShadow = true;
                block.receiveShadow = true;
                this.scene.add(block);
                
                // Store block reference
                const key = `${x},${y},${z}`;
                this.blocks.set(key, block);
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