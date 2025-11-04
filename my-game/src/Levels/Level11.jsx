import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level11Scene extends BaseScene {
  constructor() {
    super("Level11");
    this.backgroundKey = "background11";
    this.groundPlatformHeight = 120; // Smaller height for this level
    this.platformColor = 0x212121; // Dark blue color for this level
    this.levelWidth = GAME_WIDTH; // Single screen width for this level
    this.doorX = GAME_WIDTH - 150; // Door near the end
  }

  loadLevelAssets() {
    // Load Level 11 specific background - using the complete image
    this.load.image("background11", "/background 1/orig_big11.png");
    // Load spike image
    this.load.image("spike", "/Spike.png");
  }

  create() {
    super.create();

    // Create spikes at the top (visible but not falling)
    this.spikes = [];
    this.fallingSpikes = [];
    const spikeSpacing = 20; // Same spacing as Level 10
    const startX = GAME_WIDTH / 4;
    const endX = this.doorX; // End at the door position

    // Create spikes from 1/4 to door position
    for (let x = startX; x < endX; x += spikeSpacing) {
      const spike = this.add.image(x, 15, "spike");
      spike.setOrigin(0.5, 0);
      spike.setAngle(180); // Rotate 180 degrees to point downward
      spike.setDepth(15);
      spike.falling = false;
      this.spikes.push(spike);
    }

    // Track next spike to drop
    this.nextSpikeIndex = 0;
    this.spikeDropTimer = 0;
    this.spikeDropInterval = 100; // Drop spike every 100ms (fast)
    this.spikesStarted = false;
    this.waitingForFinalDrop = false;
    this.finalDropTimer = 0;
    this.finalDropDelay = 1000; // 1 second delay before final drop
  }

  update() {
    // Override speed for this level to make it more difficult
    if (!this.levelComplete) {
      const speed = 200; // Reduced speed from default 300
      const jumpPower = -400;

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

      // Jumping
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

    // Check if player starts moving to trigger spikes
    if (!this.levelComplete) {
      // Start spikes falling once player is close to 1/4 of screen (where spikes start)
      const startX = GAME_WIDTH / 4;
      const triggerDistance = 100; // Start when player is 100px away from spike area

      if (!this.spikesStarted && this.player.x >= startX - triggerDistance) {
        this.spikesStarted = true;
      }

      // Drop spikes continuously once started
      if (this.spikesStarted && this.nextSpikeIndex < this.spikes.length) {
        // After 24 spikes, wait for a delay then drop all remaining
        if (this.nextSpikeIndex === 24 && !this.waitingForFinalDrop) {
          this.waitingForFinalDrop = true;
          this.finalDropTimer = 0;
        }

        // Handle the delay and final drop
        if (this.waitingForFinalDrop) {
          this.finalDropTimer += this.game.loop.delta;

          if (this.finalDropTimer >= this.finalDropDelay) {
            // Drop all remaining spikes after delay
            for (let i = this.nextSpikeIndex; i < this.spikes.length; i++) {
              const spike = this.spikes[i];
              if (spike && !spike.falling) {
                spike.falling = true;
                this.physics.add.existing(spike);
                spike.body.setVelocityY(800); // Very fast falling speed
                spike.body.setAllowGravity(false);
                this.fallingSpikes.push(spike);
              }
            }
            this.nextSpikeIndex = this.spikes.length; // Mark all as dropped
            this.waitingForFinalDrop = false;
          }
        } else if (this.nextSpikeIndex < 24) {
          // Drop spikes one by one for the first 24
          this.spikeDropTimer += this.game.loop.delta;

          if (this.spikeDropTimer >= this.spikeDropInterval) {
            this.spikeDropTimer = 0;

            // Make the next spike fall
            const spike = this.spikes[this.nextSpikeIndex];
            if (spike && !spike.falling) {
              spike.falling = true;
              this.physics.add.existing(spike);
              spike.body.setVelocityY(800); // Very fast falling speed
              spike.body.setAllowGravity(false);
              this.fallingSpikes.push(spike);
            }

            this.nextSpikeIndex++;
          }
        }
      }
    }

    // Check collision between falling spikes and player
    if (!this.levelComplete) {
      for (let i = 0; i < this.fallingSpikes.length; i++) {
        const spike = this.fallingSpikes[i];
        if (spike && spike.active) {
          const distanceToPlayer = Phaser.Math.Distance.Between(
            spike.x, spike.y,
            this.player.x, this.player.y
          );

          // Kill player if spike is close enough
          if (distanceToPlayer < 40) {
            this.handleSpikeCollision();
            break;
          }

          // Destroy spike if it goes off screen
          if (spike.y > GAME_HEIGHT + 100) {
            spike.destroy();
            this.fallingSpikes.splice(i, 1);
            i--;
          }
        }
      }
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

  createPlatforms() {
    // Add Level 11 specific platforms here
  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level12');
    // Go to Level 12
    this.scene.start("Level12");
  }
}

const Level11 = () => {
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
        scene: [Level11Scene],
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

export default Level11;
