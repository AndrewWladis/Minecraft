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
        
        this.init();
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
                const material = new THREE.MeshPhongMaterial({ 
                    color: this.getBlockColor(y),
                    shadowSide: THREE.FrontSide
                });
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

    getBlockColor(height) {
        if (height < 0) return 0x3366ff; // Water
        if (height === 0) return 0xc2b280; // Sand
        if (height < 3) return 0x567d46; // Grass
        if (height < 6) return 0x8b4513; // Dirt
        return 0x808080; // Stone
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