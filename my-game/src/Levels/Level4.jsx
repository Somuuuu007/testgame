import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level4Scene extends BaseScene {
  constructor() {
    super("Level4");
    this.backgroundKey = "background4";
    this.groundPlatformHeight = 80;
    this.platformColor = 0x212121;
    this.levelWidth = GAME_WIDTH; // Single screen width for this level
    this.doorX = GAME_WIDTH - 150; // Door near the end
  }

  loadLevelAssets() {
    // Load Level 4 specific background
    this.load.image("background4", "/background 1/orig_big4.png");
  }

  create() {
    super.create();

    // Check if this is the first time entering Level 4
    const currentLevel = localStorage.getItem('currentLevel');
    const wasInLevel4 = localStorage.getItem('wasInLevel4');

    // If entering Level 4 for the first time, reset death count
    if (currentLevel === 'Level4' && wasInLevel4 !== 'true') {
      localStorage.setItem('level4Deaths', '0');
      localStorage.setItem('wasInLevel4', 'true');
    }

    // Get death count from localStorage for this level
    const deathCount = parseInt(localStorage.getItem('level4Deaths') || '0');

    // Pattern: Attempts 1-2 reversed, 3 normal, 4-5 reversed, 6 normal, repeat...
    // Calculate position in pattern (0-5 cycle)
    const patternPosition = deathCount % 6;
    // Reversed for positions 0,1 (attempts 1,2) and 3,4 (attempts 4,5)
    // Normal for positions 2 (attempt 3) and 5 (attempt 6)
    this.controlsReversed = (patternPosition === 0 || patternPosition === 1 || patternPosition === 3 || patternPosition === 4);

    // Create spike graphics for left boundary (death zone)
    this.spikes = this.add.graphics();
    this.spikes.fillStyle(0x212121, 1); // Dark red color for spikes
    this.spikes.setDepth(11);

    // Draw triangular spikes along the left boundary
    const spikeWidth = 30;
    const spikeHeight = 40;
    const spikeCount = Math.ceil(GAME_HEIGHT / spikeHeight);

    for (let i = 0; i < spikeCount; i++) {
      const y = i * spikeHeight;
      this.spikes.fillTriangle(
        0, y,                           // Top left point
        0, y + spikeHeight,             // Bottom left point
        spikeWidth, y + spikeHeight / 2 // Right point (tip of spike)
      );
    }

    // Create invisible collision rectangle for spikes
    this.spikeCollider = this.add.rectangle(15, GAME_HEIGHT / 2, 30, GAME_HEIGHT);
    this.spikeCollider.setDepth(10);
    this.physics.add.existing(this.spikeCollider, true);

    // Add collision detection between player and spikes
    this.physics.add.overlap(this.player, this.spikeCollider, this.handleBoundaryCollision, null, this);
  }

  handleBoundaryCollision() {
    if (!this.levelComplete) {
      this.handleDeath();
    }
  }

  update() {
    // Override movement controls for this level
    if (!this.levelComplete) {
      const speed = 300;

      this.isOnGround = this.player.body.touching.down || this.player.body.blocked.down;

      // Reversed controls logic
      const leftPressed = this.controlsReversed
        ? (this.cursors.right.isDown || this.dKey.isDown)
        : (this.cursors.left.isDown || this.aKey.isDown);

      const rightPressed = this.controlsReversed
        ? (this.cursors.left.isDown || this.aKey.isDown)
        : (this.cursors.right.isDown || this.dKey.isDown);

      // Horizontal movement with switched controls
      if (leftPressed) {
        this.player.setVelocityX(-speed);
        this.player.setFlipX(true);

        if (this.isOnGround && this.player.anims.currentAnim.key !== "run") {
          this.player.play("run");
        }
      } else if (rightPressed) {
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

      // Jumping (not reversed)
      if ((Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey)) && this.isOnGround) {
        this.player.setVelocityY(-400);
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
            // Reset death count when level is completed
            localStorage.removeItem('level4Deaths');
            this.onLevelComplete();
          });
        });
      }
    }

    // Check if player falls off the world (death)
    if (this.player.y >= GAME_HEIGHT && !this.levelComplete) {
      this.handleDeath();
    }

    // Check if player touches left boundary (death zone)
    if (this.player.x <= 10 && !this.levelComplete) {
      this.handleDeath();
    }
  }

  handleDeath() {
    this.levelComplete = true;

    // Increment death count
    const currentDeaths = parseInt(localStorage.getItem('level4Deaths') || '0');
    localStorage.setItem('level4Deaths', (currentDeaths + 1).toString());

    this.player.play("death");
    this.player.body.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);

    // Restart level after death animation
    this.player.once("animationcomplete", () => {
      this.scene.restart();
    });
  }

  createPlatforms() {
    // Add Level 4 specific platforms here
  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level5');
    // Go to Level 5
    this.scene.start("Level5");
  }
}

const Level4 = () => {
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
        scene: [Level4Scene],
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

export default Level4;
