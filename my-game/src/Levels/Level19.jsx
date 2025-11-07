import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level19Scene extends BaseScene {
  constructor() {
    super("Level19");
    this.backgroundKey = "background19";
    this.groundPlatformHeight = null; // Disable automatic ground platform
    this.platformColor = 0x212121; // Dark color for this level
    this.levelWidth = GAME_WIDTH; // Single screen width for this level
    this.doorX = GAME_WIDTH - 250; // Door near the end
  }

  loadLevelAssets() {
    // Load Level 19 specific background
    this.load.image("background19", "/background 1/orig_big19.png");
    // Load spike image
    this.load.image("spike", "/Spike.png");

    // Load up and down movement spritesheets
    this.load.spritesheet("MoveUp", "/walk_Up.png", {
      frameWidth: 48,
      frameHeight: 64,
    });
    this.load.spritesheet("MoveDown", "/walk_Down.png", {
      frameWidth: 48,
      frameHeight: 64,
    });
  }

  create() {
    super.create();

    // Spawn player on the right bottom platform (safely away from spikes)
    this.player.x = GAME_WIDTH - 130;
    this.player.y = GAME_HEIGHT - 180;

    // Add S key for downward movement
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    // Create animations for up and down movement (similar to BaseScene)
    if (!this.anims.exists("moveup")) {
      this.anims.create({
        key: "moveup",
        frames: this.anims.generateFrameNumbers("MoveUp", { start: 0, end: 7 }),
        frameRate: 20,
        repeat: -1,
      });
    }

    if (!this.anims.exists("movedown")) {
      this.anims.create({
        key: "movedown",
        frames: this.anims.generateFrameNumbers("MoveDown", { start: 0, end: 7 }),
        frameRate: 20,
        repeat: -1,
      });
    }

    // Move door to the top platform
    const topPlatformY = GAME_HEIGHT - 150 / 2 - 420;
    this.door.x = GAME_WIDTH - 250;
    this.door.y = topPlatformY - 250 / 2;

    // Add collision detection for all spike colliders after player is created
    if (this.allSpikeColliders) {
      this.allSpikeColliders.forEach(collider => {
        this.physics.add.overlap(this.player, collider, this.handleSpikeCollision, null, this);
      });
    }

    // Also add collision detection for middle platform spike colliders
    if (this.middlePlatformSpikeColliders) {
      this.middlePlatformSpikeColliders.forEach(collider => {
        this.physics.add.overlap(this.player, collider, this.handleSpikeCollision, null, this);
      });
    }

    // Track if middle platform animation has been triggered
    this.middlePlatformTriggered = false;
  }

  update() {
    // Override update to add vertical movement and disable jumping
    if (this.levelComplete) {
      return;
    }

    const speed = 300;

    // Disable gravity for this level to allow free movement
    this.player.body.setAllowGravity(false);

    let isMovingHorizontal = false;
    let isMovingVertical = false;

    // Horizontal movement - arrow keys or WASD
    if (this.cursors.left.isDown || this.aKey.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      isMovingHorizontal = true;
    } else if (this.cursors.right.isDown || this.dKey.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      isMovingHorizontal = true;
    } else {
      this.player.setVelocityX(0);
    }

    // Vertical movement - W/S or Up/Down arrow keys
    if (this.cursors.up.isDown || this.wKey.isDown) {
      this.player.setVelocityY(-speed);
      isMovingVertical = true;

      // Play moveup animation only when moving vertically without horizontal movement
      if (!isMovingHorizontal && this.player.anims.currentAnim.key !== "moveup") {
        this.player.play("moveup");
      }
    } else if (this.cursors.down.isDown || this.sKey.isDown) {
      this.player.setVelocityY(speed);
      isMovingVertical = true;

      // Play movedown animation only when moving vertically without horizontal movement
      if (!isMovingHorizontal && this.player.anims.currentAnim.key !== "movedown") {
        this.player.play("movedown");
      }
    } else {
      this.player.setVelocityY(0);
    }

    // Play run animation when moving horizontally (takes priority over vertical)
    if (isMovingHorizontal && this.player.anims.currentAnim.key !== "run") {
      this.player.play("run");
    }

    // Idle animation when not moving at all
    if (!isMovingHorizontal && !isMovingVertical && this.player.anims.currentAnim.key !== "idle") {
      this.player.play("idle");
    }

    // Check if player has crossed the first left platform with spikes
    // This is the platform at attachedPlatformX (first one on left side)
    if (!this.middlePlatformTriggered && this.player.x < this.firstLeftPlatformX) {
      this.middlePlatformTriggered = true;

      // Start moving the middle platform (with all spikes) upward slowly
      // The middle platform is stored as this.middlePlatformRect
      this.tweens.add({
        targets: this.middlePlatformRect,
        y: 50, // Stop a bit before the top of screen
        duration: 3000, // 3 seconds
        ease: 'Linear',
        onUpdate: () => {
          // Update physics body position
          if (this.middlePlatformRect.body) {
            this.middlePlatformRect.body.updateFromGameObject();
          }

          // Update all spike positions to follow the platform
          if (this.middlePlatformSpikes) {
            const deltaY = this.middlePlatformRect.y - this.middlePlatformOriginalY;
            const deltaX = this.middlePlatformRect.x - this.middlePlatformOriginalX;

            this.middlePlatformSpikes.forEach((spike, index) => {
              spike.x = this.middlePlatformSpikeOriginalPositions[index].x + deltaX;
              spike.y = this.middlePlatformSpikeOriginalPositions[index].y + deltaY;
            });

            this.middlePlatformSpikeColliders.forEach((collider, index) => {
              collider.x = this.middlePlatformSpikeColliderOriginalPositions[index].x + deltaX;
              collider.y = this.middlePlatformSpikeColliderOriginalPositions[index].y + deltaY;
              if (collider.body) {
                collider.body.updateFromGameObject();
              }
            });
          }
        },
        onComplete: () => {
          // After reaching the top, move horizontally to the center of the door
          this.tweens.add({
            targets: this.middlePlatformRect,
            x: this.door.x, // Move to door's X position (center)
            duration: 500, // 1.5 seconds (faster)
            ease: 'Linear',
            onUpdate: () => {
              // Update physics body position
              if (this.middlePlatformRect.body) {
                this.middlePlatformRect.body.updateFromGameObject();
              }

              // Update all spike positions to follow the platform
              if (this.middlePlatformSpikes) {
                const deltaY = this.middlePlatformRect.y - this.middlePlatformOriginalY;
                const deltaX = this.middlePlatformRect.x - this.middlePlatformOriginalX;

                this.middlePlatformSpikes.forEach((spike, index) => {
                  spike.x = this.middlePlatformSpikeOriginalPositions[index].x + deltaX;
                  spike.y = this.middlePlatformSpikeOriginalPositions[index].y + deltaY;
                });

                this.middlePlatformSpikeColliders.forEach((collider, index) => {
                  collider.x = this.middlePlatformSpikeColliderOriginalPositions[index].x + deltaX;
                  collider.y = this.middlePlatformSpikeColliderOriginalPositions[index].y + deltaY;
                  if (collider.body) {
                    collider.body.updateFromGameObject();
                  }
                });
              }
            }
          });
        }
      });
    }

    // Door logic
    const distanceToDoor = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.door.x, this.door.y
    );

    if (distanceToDoor < 200 && !this.doorOpen) {
      this.doorOpen = true;
      this.door.play("door_opening");
      this.door.once("animationcomplete", () => {
        this.door.play("door_open");
      });
    }

    if (Math.abs(this.player.x - this.door.x) < 10 && distanceToDoor < 40 && this.doorOpen && !this.levelComplete) {
      this.levelComplete = true;
      this.player.body.setVelocity(0, 0);
      this.player.body.setAllowGravity(false);
      this.player.setFlipX(false);
      this.player.stop();
      this.player.play("walkup", true);

      this.player.once("animationcomplete", () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.onLevelComplete();
        });
      });
    }
  }

  createPlatforms() {
    // Initialize spike arrays and position tracking
    this.allSpikes = []; // All spikes for collision detection
    this.allSpikeColliders = []; // All spike colliders for collision detection
    this.middlePlatformSpikes = []; // Only middle platform spikes (for animation)
    this.middlePlatformSpikeColliders = []; // Only middle platform spike colliders (for animation)
    this.middlePlatformSpikeOriginalPositions = [];
    this.middlePlatformSpikeColliderOriginalPositions = [];

    // Right side platform where player spawns (300x150)
    const platformWidth = 300;
    const platformHeight = 150;

    // Right bottom platform
    this.createPlatform(
      GAME_WIDTH - platformWidth / 2,
      GAME_HEIGHT - platformHeight / 2,
      platformWidth,
      platformHeight
    );

    // Right top platform - 420px above the bottom platform
    const rightTopPlatformWidth = platformWidth + 700;
    const rightTopPlatformHeight = platformHeight + 100;
    const rightTopPlatformX = GAME_WIDTH - platformWidth / 2;
    const rightTopPlatformY = GAME_HEIGHT - platformHeight / 2 - 420;

    this.createPlatform(
      rightTopPlatformX,
      rightTopPlatformY,
      rightTopPlatformWidth,
      rightTopPlatformHeight
    );

    // Platform attached to the right top platform at its left boundary (centered)
    const rightAttachedPlatformWidth = 250;
    const rightAttachedPlatformHeight = 100;
    const rightAttachedPlatformX = rightTopPlatformX - rightTopPlatformWidth / 2 - rightAttachedPlatformWidth / 2;
    const rightAttachedPlatformY = rightTopPlatformY; // Centered at same Y position

    this.createPlatform(
      rightAttachedPlatformX,
      rightAttachedPlatformY,
      rightAttachedPlatformWidth,
      rightAttachedPlatformHeight
    );

    // Add spikes on left side of right attached platform
    const rightAttachedSpikeSpacing = 25;
    const rightPlatformSpikeCount = Math.floor(rightAttachedPlatformHeight / rightAttachedSpikeSpacing);
    for (let i = 0; i < rightPlatformSpikeCount; i++) {
      const spikeX = rightAttachedPlatformX - rightAttachedPlatformWidth / 2;
      const spikeY = rightAttachedPlatformY - rightAttachedPlatformHeight / 2 + (i * rightAttachedSpikeSpacing) + rightAttachedSpikeSpacing / 2;

      const spike = this.add.image(spikeX, spikeY, "spike");
      spike.setOrigin(0.5, 1);
      spike.setAngle(-90);
      spike.setDepth(5); // Lower depth so middle platform appears on top
      this.allSpikes.push(spike);

      const collider = this.add.rectangle(spikeX - 10, spikeY, 3, 6);
      collider.setDepth(4); // Lower depth
      this.physics.add.existing(collider, true);
      this.allSpikeColliders.push(collider);
    }

    // Platform to the left of right bottom platform (this is the main spike platform that will move)
    const middlePlatformX = GAME_WIDTH - platformWidth / 2 - platformWidth - 400;
    const middlePlatformY = GAME_HEIGHT - platformHeight / 2 - 50;
    const middlePlatformWidth = platformWidth - 50;
    const middlePlatformHeight = platformHeight - 20;

    // Store original position and reference to the platform rectangle
    this.middlePlatformOriginalX = middlePlatformX;
    this.middlePlatformOriginalY = middlePlatformY;
    this.middlePlatformRect = this.createPlatform(
      middlePlatformX,
      middlePlatformY,
      middlePlatformWidth,
      middlePlatformHeight
    );
    this.middlePlatformRect.setDepth(15); // Higher depth so it appears on top of other spikes

    // Create spikes on all sides of the middle platform
    const spikeSpacing = 20;
    const cornerOffset = 20; // Offset to avoid corner overlaps

    // Top spikes (excluding corners) - add 1 more spike
    const topSpikeCount = Math.floor((middlePlatformWidth - 2 * cornerOffset) / spikeSpacing) + 1;
    for (let i = 0; i < topSpikeCount; i++) {
      const spikeX = middlePlatformX - middlePlatformWidth / 2 + cornerOffset + (i * spikeSpacing) + spikeSpacing / 2 - 7; // Shifted 10px left
      const spikeY = middlePlatformY - middlePlatformHeight / 2;

      const spike = this.add.image(spikeX, spikeY, "spike");
      spike.setOrigin(0.5, 1);
      spike.setAngle(0);
      spike.setDepth(16); // Higher depth for middle platform spikes
      this.middlePlatformSpikes.push(spike);
      this.middlePlatformSpikeOriginalPositions.push({ x: spikeX, y: spikeY });

      const collider = this.add.rectangle(spikeX, spikeY - 10, 10, 7);
      collider.setDepth(15);
      this.physics.add.existing(collider, true);
      this.middlePlatformSpikeColliders.push(collider);
      this.middlePlatformSpikeColliderOriginalPositions.push({ x: spikeX, y: spikeY - 10 });
    }

    // Bottom spikes (excluding corners) - add 1 more spike
    const bottomSpikeCount = Math.floor((middlePlatformWidth - 2 * cornerOffset) / spikeSpacing) + 1;
    for (let i = 0; i < bottomSpikeCount; i++) {
      const spikeX = middlePlatformX - middlePlatformWidth / 2 + cornerOffset + (i * spikeSpacing) + spikeSpacing / 2 - 7; // Shifted 10px left
      const spikeY = middlePlatformY + middlePlatformHeight / 2;

      const spike = this.add.image(spikeX, spikeY, "spike");
      spike.setOrigin(0.5, 1); // Changed from (0.5, 0) to (0.5, 1) to align at border
      spike.setAngle(180);
      spike.setDepth(16); // Higher depth for middle platform spikes
      this.middlePlatformSpikes.push(spike);
      this.middlePlatformSpikeOriginalPositions.push({ x: spikeX, y: spikeY });

      const collider = this.add.rectangle(spikeX, spikeY + 10, 10, 7);
      collider.setDepth(15);
      this.physics.add.existing(collider, true);
      this.middlePlatformSpikeColliders.push(collider);
      this.middlePlatformSpikeColliderOriginalPositions.push({ x: spikeX, y: spikeY + 10 });
    }

    // Left spikes (including full height) - rotated 180 degrees from original
    const leftSpikeCount = Math.floor(middlePlatformHeight / spikeSpacing);
    for (let i = 0; i < leftSpikeCount; i++) {
      const spikeX = middlePlatformX - middlePlatformWidth / 2;
      const spikeY = middlePlatformY - middlePlatformHeight / 2 + (i * spikeSpacing) + spikeSpacing / 2;

      const spike = this.add.image(spikeX, spikeY, "spike");
      spike.setOrigin(0.7, 1); // Changed to (0, 0.5) so spikes point inward
      spike.setAngle(-90);
      spike.setDepth(16); // Higher depth for middle platform spikes
      this.middlePlatformSpikes.push(spike);
      this.middlePlatformSpikeOriginalPositions.push({ x: spikeX, y: spikeY });

      const collider = this.add.rectangle(spikeX - 10, spikeY, 7, 10);
      collider.setDepth(15);
      this.physics.add.existing(collider, true);
      this.middlePlatformSpikeColliders.push(collider);
      this.middlePlatformSpikeColliderOriginalPositions.push({ x: spikeX - 10, y: spikeY });
    }

    // Right spikes (including full height) - rotated 180 degrees from original
    const rightSpikeCount = Math.floor(middlePlatformHeight / spikeSpacing);
    for (let i = 0; i < rightSpikeCount; i++) {
      const spikeX = middlePlatformX + middlePlatformWidth / 2;
      const spikeY = middlePlatformY - middlePlatformHeight / 2 + (i * spikeSpacing) + spikeSpacing / 2;

      const spike = this.add.image(spikeX, spikeY, "spike");
      spike.setOrigin(0.2, 1); // Changed to (0, 0.5) so spikes point inward
      spike.setAngle(90);
      spike.setDepth(16); // Higher depth for middle platform spikes
      this.middlePlatformSpikes.push(spike);
      this.middlePlatformSpikeOriginalPositions.push({ x: spikeX, y: spikeY });

      const collider = this.add.rectangle(spikeX + 10, spikeY, 7, 10);
      collider.setDepth(15);
      this.physics.add.existing(collider, true);
      this.middlePlatformSpikeColliders.push(collider);
      this.middlePlatformSpikeColliderOriginalPositions.push({ x: spikeX + 10, y: spikeY });
    }

    // Left top platform (same as right top)
    const leftTopPlatformWidth = platformWidth + 300;
    const leftTopPlatformHeight = platformHeight + 400;
    const leftTopPlatformX = platformWidth / 2;
    const leftTopPlatformY = GAME_HEIGHT - platformHeight / 2 - 420;

    this.createPlatform(
      leftTopPlatformX,
      leftTopPlatformY,
      leftTopPlatformWidth,
      leftTopPlatformHeight
    );

    // Platform attached to the left top platform at its right boundary
    const attachedPlatformWidth = 250;
    const attachedPlatformHeight = 100;
    const attachedPlatformX = leftTopPlatformX + leftTopPlatformWidth / 2 + attachedPlatformWidth / 2;
    const attachedPlatformY = leftTopPlatformY - 160;

    // Store this position to trigger middle platform animation
    this.firstLeftPlatformX = attachedPlatformX;

    this.createPlatform(
      attachedPlatformX,
      attachedPlatformY,
      attachedPlatformWidth,
      attachedPlatformHeight
    );

    // Add spikes on right side of first attached platform
    const attachedSpikeSpacing = 25; // Increased spacing to avoid overlap
    const firstPlatformSpikeCount = Math.floor(attachedPlatformHeight / attachedSpikeSpacing);
    for (let i = 0; i < firstPlatformSpikeCount; i++) {
      const spikeX = attachedPlatformX + attachedPlatformWidth / 2;
      const spikeY = attachedPlatformY - attachedPlatformHeight / 2 + (i * attachedSpikeSpacing) + attachedSpikeSpacing / 2;

      const spike = this.add.image(spikeX, spikeY, "spike");
      spike.setOrigin(0.5, 1); // Adjusted origin to align at border
      spike.setAngle(90);
      spike.setDepth(5); // Lower depth so middle platform appears on top
      this.allSpikes.push(spike);

      const collider = this.add.rectangle(spikeX + 10, spikeY, 3, 6);
      collider.setDepth(4); // Lower depth
      this.physics.add.existing(collider, true);
      this.allSpikeColliders.push(collider);
    }

    // Similar platform 320px below the first attached platform
    const secondAttachedPlatformY = attachedPlatformY + 320;
    this.createPlatform(
      attachedPlatformX,
      secondAttachedPlatformY,
      attachedPlatformWidth,
      attachedPlatformHeight
    );

    // Add spikes on right side of second attached platform
    const secondPlatformSpikeCount = Math.floor(attachedPlatformHeight / attachedSpikeSpacing);
    for (let i = 0; i < secondPlatformSpikeCount; i++) {
      const spikeX = attachedPlatformX + attachedPlatformWidth / 2;
      const spikeY = secondAttachedPlatformY - attachedPlatformHeight / 2 + (i * attachedSpikeSpacing) + attachedSpikeSpacing / 2;

      const spike = this.add.image(spikeX, spikeY, "spike");
      spike.setOrigin(0.5, 1); // Adjusted origin to align at border
      spike.setAngle(90);
      spike.setDepth(5); // Lower depth so middle platform appears on top
      this.allSpikes.push(spike);

      const collider = this.add.rectangle(spikeX + 10, spikeY, 3, 6);
      collider.setDepth(4); // Lower depth
      this.physics.add.existing(collider, true);
      this.allSpikeColliders.push(collider);
    }
  }


  handleSpikeCollision() {
    if (!this.levelComplete) {
      this.levelComplete = true;
      this.player.play("death");
      this.player.body.setVelocity(0, 0);
      this.player.body.setAllowGravity(false);

      // Restart level after death animation
      this.player.once("animationcomplete", () => {
        this.scene.restart();
      });
    }
  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level20');
    // Go to Level 20
    this.scene.start("Level20");
  }
}

const Level19 = () => {
  useEffect(() => {
    let game;

    const createGame = () => {
      const config = {
        type: Phaser.AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent: "phaser-container",
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { y: 1000 },
            debug: false,
          },
        },
        scene: [Level19Scene],
      };

      game = new Phaser.Game(config);
    };

    createGame();

    return () => {
      if (game) game.destroy(true);
    };
  }, []);

  return <div id="phaser-container"></div>;
};

export default Level19;
