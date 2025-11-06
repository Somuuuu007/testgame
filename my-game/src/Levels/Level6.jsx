import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level6Scene extends BaseScene {
  constructor() {
    super("Level6");
    this.backgroundKey = "background6";
    this.groundPlatformHeight = 100; // Much taller ground platform
    this.groundPlatformWidth = 200; // Much taller ground platform
    this.platformColor = 0x212121;
    this.levelWidth = GAME_WIDTH; // Single screen width like Level 1
    this.doorX = 1300; // Door on the last step

  }

  loadLevelAssets() {
    // Load Level 6 specific background
    this.load.image("background6", "/background 1/orig_big6.png");
  }

  create() {
    super.create();

    // Adjust player spawn position - lower on the screen to avoid top spikes
    this.player.y = GAME_HEIGHT - 250;

    // Make door visible first - position it dynamically on top of last platform
    this.door.x = 1350; // Same X as last platform
    this.door.y = this.doorY; // Calculated in createPlatforms

    // Create spike graphics for top boundary (death zone)
    this.spikes = this.add.graphics();
    this.spikes.fillStyle(0x212121, 1);
    this.spikes.setDepth(11);

    // Draw triangular spikes along the top boundary
    const spikeWidth = 30;
    const spikeHeight = 40;
    const topSpikeCount = Math.ceil(GAME_WIDTH / spikeHeight);

    for (let i = 0; i < topSpikeCount; i++) {
      const x = i * spikeHeight;
      this.spikes.fillTriangle(
        x, 0,                           // Left top point
        x + spikeHeight, 0,             // Right top point
        x + spikeHeight / 2, spikeWidth // Bottom point (tip of spike)
      );
    }

    // Create invisible collision rectangle for top spikes
    this.topSpikeCollider = this.add.rectangle(GAME_WIDTH / 2, 15, GAME_WIDTH, 30);
    this.topSpikeCollider.setDepth(10);
    this.physics.add.existing(this.topSpikeCollider, true);

    // Add collision detection between player and top spikes
    this.physics.add.overlap(this.player, this.topSpikeCollider, this.handleSpikeCollision, null, this);
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

  createPlatforms() {
    // Create individual steps with custom properties - these will move upward when stepped on

    // Step 1
    this.step1 = this.createPlatform(290, 650, 180, 200);
    this.step1.moving = false;
    this.step1.activated = false;

    // Step 2
    this.step2 = this.createPlatform(480, 600, 200, 280);
    this.step2.moving = false;
    this.step2.activated = false;

    // Step 3
    this.step3 = this.createPlatform(680, 600, 200, 460);
    this.step3.moving = false;
    this.step3.activated = false;

    // Step 4
    this.step4 = this.createPlatform(880, 600, 200, 620);
    this.step4.moving = false;
    this.step4.activated = false;

    // Step 5
    this.step5 = this.createPlatform(1080, 600, 200, 780);
    this.step5.moving = false;
    this.step5.activated = false;

    // Step 6 & 7 - Static steps (don't move, door is here)
    this.createPlatform(1280, 600, 200, 940);
    const lastPlatformY = 600;
    const lastPlatformHeight = 940;
    this.createPlatform(1480, lastPlatformY, 200, lastPlatformHeight);

    // Calculate door position on top of last platform
    // Platform center Y = lastPlatformY, height = lastPlatformHeight
    // Top of platform = center - (height / 2)
    this.doorY = lastPlatformY - (lastPlatformHeight / 2);

    // Store moving steps in an array for easy iteration
    this.movingSteps = [this.step1, this.step2, this.step3, this.step4, this.step5];
  }

  update(time, delta) {  
     // Override jump power for this level
    if (!this.levelComplete) {
      const speed = 250;
      const jumpPower = -430; // Increased jump power for this level

      this.isOnGround = this.player.body.touching.down || this.player.body.blocked.down;

      // Horizontal movement
      if (this.cursors.left.isDown || this.aKey.isDown) {
        this.player.setVelocityX(-speed);
        this.player.setFlipX(true);

        if (this.isOnGround && this.player.anims.currentAnim.key !== "run") {
          this.player.play("run");
        }
      } else if (this.cursors.right.isDown || this.dKey.isDown) {
        this.player.setVelocityX(speed);
        this.player.setFlipX(false);

        if (this.isOnGround && this.player.anims.currentAnim.key !== "run") {
          this.player.play("run");
        }
      } else {
        this.player.setVelocityX(0);

        if (this.isOnGround && this.player.anims.currentAnim.key !== "idle") {
          this.player.play("idle");
        }
      }

      // Jumping with increased power
      if ((Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey)) && this.isOnGround) {
        this.player.setVelocityY(jumpPower);
        this.player.play("jump");
      }

      if (!this.isOnGround && this.player.anims.currentAnim.key !== "jump") {
        this.player.play("jump");
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

    // Check which step the player is standing on and activate upward movement
    if (this.isOnGround && !this.levelComplete) {
      this.movingSteps.forEach((step) => {
        if (!step.activated && this.player.body.touching.down) {
          // Check if player's bottom is above or at the top of the step
          const playerBottom = this.player.y + this.player.height / 2;
          const stepTop = step.y - step.height / 2;

          // Player is standing on the step if their bottom is close to the step's top
          if (Math.abs(playerBottom - stepTop) < 5 &&
              this.player.x >= step.x - step.width / 2 &&
              this.player.x <= step.x + step.width / 2) {
            step.activated = true;
            step.moving = true;
          }
        }
      });
    }

    // Move steps upward when activated
    this.movingSteps.forEach((step) => {
      if (step.moving) {
        // Frame-rate independent step movement
        // Keep original tested speed: 2 pixels per frame at 120fps
        const stepSpeed = 2;

        // Update step position
        step.y -= stepSpeed;
        step.body.position.y -= stepSpeed;
        step.body.updateFromGameObject();

        // Check if player is standing on this step and move them with it
        if (this.player.body.touching.down) {
          const playerBottom = this.player.y + this.player.height / 2;
          const stepTop = step.y - step.height / 2;

          // If player is on top of this step, move them up with it
          if (Math.abs(playerBottom - stepTop) < 10 &&
              this.player.x >= step.x - step.width / 2 &&
              this.player.x <= step.x + step.width / 2) {
            this.player.y -= stepSpeed;
          }
        }

        // Stop moving after reaching a certain height
        if (step.y <= 100) {
          step.moving = false;
        }
      }
    });

    // Check if player has fallen to the bottom ground (death zone)
    if (this.player.y >= GAME_HEIGHT - 50 && !this.levelComplete) {
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
    localStorage.setItem('currentLevel', 'Level7');
    // Go to Level 7
    this.scene.start("Level7");
  }
}

const Level6 = () => {
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
        scene: [Level6Scene],
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

export default Level6;
