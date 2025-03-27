import * as THREE from 'three';

export class Player {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
        this.moveSpeed = 0.1;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true;
        this.size = new THREE.Vector3(0.6, 1.8, 0.6); // Player hitbox size
        
        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.canJump) {
                        this.velocity.y += 5;
                        this.canJump = false;
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        });
    }

    update() {
        if (this.controls.isLocked) {
            // Apply gravity
            this.velocity.y -= 0.1;

            // Get movement direction
            const direction = new THREE.Vector3();
            const frontVector = new THREE.Vector3();
            const sideVector = new THREE.Vector3();
            const rotation = this.camera.rotation;

            // Calculate front/back movement
            frontVector.setFromMatrixColumn(this.camera.matrix, 2);
            frontVector.y = 0;
            frontVector.normalize();

            // Calculate left/right movement
            sideVector.setFromMatrixColumn(this.camera.matrix, 0);
            sideVector.y = 0;
            sideVector.normalize();

            // Combine movements
            direction
                .subVectors(new THREE.Vector3(), frontVector)
                .multiplyScalar(Number(this.moveForward) - Number(this.moveBackward))
                .add(sideVector.multiplyScalar(Number(this.moveRight) - Number(this.moveLeft)))
                .normalize();

            // Create potential new position
            const newPosition = this.camera.position.clone();
            
            if (direction.length() > 0) {
                newPosition.addScaledVector(direction, this.moveSpeed);
            }

            // Check for collisions before applying movement
            if (!this.checkCollision(newPosition)) {
                this.camera.position.copy(newPosition);
            }

            // Apply vertical velocity with collision check
            const verticalMove = this.camera.position.clone();
            verticalMove.y += this.velocity.y * this.moveSpeed;
            
            if (!this.checkCollision(verticalMove)) {
                this.camera.position.y = verticalMove.y;
            } else {
                if (this.velocity.y < 0) {
                    this.canJump = true;
                }
                this.velocity.y = 0;
            }

            // Ground check
            if (this.camera.position.y <= 2) {
                this.velocity.y = 0;
                this.camera.position.y = 2;
                this.canJump = true;
            }
        }
    }

    checkCollision(position) {
        // Get nearby blocks to check
        const checkRadius = 2;
        const pos = position.clone();
        
        for (let x = Math.floor(pos.x - checkRadius); x <= Math.ceil(pos.x + checkRadius); x++) {
            for (let y = Math.floor(pos.y - checkRadius); y <= Math.ceil(pos.y + checkRadius); y++) {
                for (let z = Math.floor(pos.z - checkRadius); z <= Math.ceil(pos.z + checkRadius); z++) {
                    const key = `${x},${y},${z}`;
                    const block = window.game.blocks.get(key);
                    
                    if (block) {
                        // Simple AABB collision check
                        const blockMin = new THREE.Vector3(x - 0.5, y - 0.5, z - 0.5);
                        const blockMax = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
                        const playerMin = new THREE.Vector3(
                            pos.x - this.size.x / 2,
                            pos.y - this.size.y / 2,
                            pos.z - this.size.z / 2
                        );
                        const playerMax = new THREE.Vector3(
                            pos.x + this.size.x / 2,
                            pos.y + this.size.y / 2,
                            pos.z + this.size.z / 2
                        );

                        if (this.checkAABBCollision(blockMin, blockMax, playerMin, playerMax)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    checkAABBCollision(min1, max1, min2, max2) {
        return (min1.x <= max2.x && max1.x >= min2.x) &&
               (min1.y <= max2.y && max1.y >= min2.y) &&
               (min1.z <= max2.z && max1.z >= min2.z);
    }
} 