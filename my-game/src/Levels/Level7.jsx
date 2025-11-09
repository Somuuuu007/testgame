import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level7Scene extends BaseScene {
  constructor() {
    super("Level7");
    this.backgroundKey = "background7";
    this.groundPlatformHeight = 600; // Much taller ground platform
    this.groundPlatformWidth = 200; // Much taller ground platform
    this.platformColor = 0x212121;
    this.levelWidth = GAME_WIDTH; // Single screen width like Level 1
    this.doorX = 1380; // Door on the last step

  }

  loadLevelAssets() {
    // Load Level 7 specific background
    this.load.image("background7", "/background 1/orig_big7.png");
  }

  create() {
    super.create();

    // Adjust player spawn position - lower to avoid top spikes
    this.player.y = GAME_HEIGHT - 630;

    // Make door visible first - position it on screen
    this.door.x = 1200;
    this.door.y = GAME_HEIGHT - 200;

    // Tilt the game (rotate camera) at the start
    this.cameras.main.setAngle(180);

    // Define the midpoint of the screen (divides left and right halves)
    this.screenMidpoint = GAME_WIDTH / 2;

    // Track which half the player is in
    this.inRightHalf = false;

    // Create spike graphics for boundaries (death zones)
    this.spikes = this.add.graphics();
    this.spikes.fillStyle(0x212121, 1);
    this.spikes.setDepth(11);

    const spikeWidth = 30;
    const spikeHeight = 40;

    // Top boundary spikes
    const topSpikeCount = Math.ceil(GAME_WIDTH / spikeHeight);
    for (let i = 0; i < topSpikeCount; i++) {
      const x = i * spikeHeight;
      this.spikes.fillTriangle(
        x, 0,                           // Left top point
        x + spikeHeight, 0,             // Right top point
        x + spikeHeight / 2, spikeWidth // Bottom point (tip of spike)
      );
    }

    // Bottom boundary spikes
    const bottomSpikeCount = Math.ceil(GAME_WIDTH / spikeHeight);
    for (let i = 0; i < bottomSpikeCount; i++) {
      const x = i * spikeHeight;
      this.spikes.fillTriangle(
        x, GAME_HEIGHT,                    // Left bottom point
        x + spikeHeight, GAME_HEIGHT,      // Right bottom point
        x + spikeHeight / 2, GAME_HEIGHT - spikeWidth // Top point (tip of spike)
      );
    }

    // Right boundary spikes
    const rightSpikeCount = Math.ceil(GAME_HEIGHT / spikeHeight);
    for (let i = 0; i < rightSpikeCount; i++) {
      const y = i * spikeHeight;
      this.spikes.fillTriangle(
        GAME_WIDTH, y,                    // Top right point
        GAME_WIDTH, y + spikeHeight,      // Bottom right point
        GAME_WIDTH - spikeWidth, y + spikeHeight / 2 // Left point (tip of spike)
      );
    }

    // Create invisible collision rectangles for all spike boundaries
    // Top boundary
    this.topSpikeCollider = this.add.rectangle(GAME_WIDTH / 2, 15, GAME_WIDTH, 30);
    this.topSpikeCollider.setDepth(10);
    this.physics.add.existing(this.topSpikeCollider, true);
    this.physics.add.overlap(this.player, this.topSpikeCollider, this.handleSpikeCollision, null, this);

    // Bottom boundary
    this.bottomSpikeCollider = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 15, GAME_WIDTH, 30);
    this.bottomSpikeCollider.setDepth(10);
    this.physics.add.existing(this.bottomSpikeCollider, true);
    this.physics.add.overlap(this.player, this.bottomSpikeCollider, this.handleSpikeCollision, null, this);

    // Right boundary
    this.rightSpikeCollider = this.add.rectangle(GAME_WIDTH - 15, GAME_HEIGHT / 2, 30, GAME_HEIGHT);
    this.rightSpikeCollider.setDepth(10);
    this.physics.add.existing(this.rightSpikeCollider, true);
    this.physics.add.overlap(this.player, this.rightSpikeCollider, this.handleSpikeCollision, null, this);
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
    // Create individual steps with custom properties

    // Step 1
    this.createPlatform(280, 500, 200, GAME_HEIGHT - 150);

    // Step 2 - Solid step
    this.createPlatform(480, 600, 200, GAME_HEIGHT - 120);
  }

  update() {
    // Check which half of the screen the player is in and adjust gravity
    if (this.player.x > this.screenMidpoint && !this.inRightHalf) {
      // Player entered right half - reverse gravity (upward)
      this.inRightHalf = true;
      this.physics.world.gravity.y = -300;
    } else if (this.player.x <= this.screenMidpoint && this.inRightHalf) {
      // Player returned to left half - normal gravity (downward)
      this.inRightHalf = false;
      this.physics.world.gravity.y = 1000;
    }

    // Override jump power for this level
    if (!this.levelComplete) {
      const speed = 250;
      const jumpPower = -450; // Increased jump power for this level

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
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey)) {
        if (this.isOnGround) {
          // Normal jump when on ground
          this.player.setVelocityY(jumpPower);
          this.player.play("jump");
        } else if (this.inRightHalf) {
          // Small jump in mid-air on right side (upside-down gravity zone)
          this.player.setVelocityY(150); // Small downward velocity (which appears as small upward jump when flipped)
          this.player.play("jump");
        }
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
    localStorage.setItem('currentLevel', 'Level8');
    // Go to Level 8
    this.scene.start("Level8");
  }
}

const Level7 = () => {
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
        scene: [Level7Scene],
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

export default Level7;
