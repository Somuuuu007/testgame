import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level12Scene extends BaseScene {
  constructor() {
    super("Level12");
    this.backgroundKey = "background12";
    this.groundPlatformHeight = 250; // Much taller ground platform
    this.groundPlatformWidth = 200; // Much taller ground platform
    this.platformColor = 0x212121;
    this.levelWidth = GAME_WIDTH; // Single screen width like Level 1
    this.doorX = 1380; // Door on the last step
  }

  loadLevelAssets() {
    // Load Level 12 specific background
    this.load.image("background12", "/background 1/orig_big12.png");
    // Load spike image
    this.load.image("spike", "/Spike.png");
  }

  create() {
    super.create();

    // Reset spike trap flags on level restart
    this.spikeTrapTriggered = false;
    this.step3SpikesTrapTriggered = false;

    // Adjust player spawn position
    this.player.y = GAME_HEIGHT - 350;

    // Make door visible first - position it on screen
    this.door.x = GAME_WIDTH - 200;
    this.door.y = GAME_HEIGHT - 200;

    // Create spike images below the floating steps
    const leftPlatformEnd = this.groundPlatformWidth;
    const rightPlatformStart = GAME_WIDTH - 200 - 200;
    const gapWidth = rightPlatformStart - leftPlatformEnd;
    const spikeWidth = 20; // Width of each spike image
    const spikeCount = Math.ceil(gapWidth / spikeWidth);

    // Add spike images
    for (let i = 0; i < spikeCount; i++) {
      const x = leftPlatformEnd + (i * spikeWidth);
      const spike = this.add.image(x, GAME_HEIGHT, "spike");
      spike.setOrigin(0, 1);
      spike.setDepth(11);
    }

    // Create invisible collision rectangle for spikes
    this.spikeCollider = this.add.rectangle(leftPlatformEnd + gapWidth / 2, GAME_HEIGHT - 10, gapWidth, 20);
    this.spikeCollider.setDepth(10);
    this.physics.add.existing(this.spikeCollider, true);

    // Add collision detection between player and spikes
    this.physics.add.overlap(this.player, this.spikeCollider, this.handleSpikeCollision, null, this);
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

  handleStep2SpikeCollision() {
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
    // Right platform (same height as left platform)
    this.createPlatform(GAME_WIDTH - 200, GAME_HEIGHT - 100, 400, 200);

    // Three floating steps from left platform to right platform (arc pattern)
    const leftPlatformEnd = this.groundPlatformWidth;
    const rightPlatformStart = GAME_WIDTH - 200 - 200;
    const gapWidth = rightPlatformStart - leftPlatformEnd;
    const stepSpacing = gapWidth / 3.5; // Spacing between steps
    const baseStepHeight = GAME_HEIGHT - 300;
    const leftOffset = 50; // Shift all steps to the left

    // Step 1 - left side (base height)
    this.step1 = this.createPlatform(leftPlatformEnd + stepSpacing - leftOffset, baseStepHeight, 120, 20);

    // Step 2 - middle (higher up) with spikes on top (initially hidden)
    this.step2 = this.createPlatform(leftPlatformEnd + stepSpacing * 2 - leftOffset, baseStepHeight - 80, 120, 20);

    const step2X = leftPlatformEnd + stepSpacing * 2 - leftOffset;
    const step2Y = baseStepHeight - 80;

    // Create spikes on step 2
    const step2Width = 120;
    const step2SpikeWidth = 20;
    const step2SpikeCount = Math.ceil(step2Width / step2SpikeWidth);

    this.step2Spikes = [];
    for (let i = 0; i < step2SpikeCount; i++) {
      const x = step2X - step2Width / 2 + (i * step2SpikeWidth);
      const spike = this.add.image(x, step2Y - 10, "spike");
      spike.setOrigin(0, 1);
      spike.setDepth(11);
      spike.setAlpha(0); // Hidden by default
      this.step2Spikes.push(spike);
    }

    // Create collision rectangle for step 2 spikes
    this.step2SpikeCollider = this.add.rectangle(step2X, step2Y - 10, step2Width, 20);
    this.step2SpikeCollider.setDepth(10);
    this.physics.add.existing(this.step2SpikeCollider, true);
    this.step2SpikeCollider.body.enable = false; // Disabled by default

    // Step 3 - right side (base height)
    this.step3 = this.createPlatform(leftPlatformEnd + stepSpacing * 3 - leftOffset, baseStepHeight, 120, 20);

    // Add 3 spikes at top of screen above step 3
    const step3X = leftPlatformEnd + stepSpacing * 3 - leftOffset;
    const spikeSpacing = 30;

    const spike1 = this.add.image(step3X - spikeSpacing, 15, "spike");
    spike1.setOrigin(0.5, 0);
    spike1.setAngle(180);
    spike1.setDepth(11);

    const spike2 = this.add.image(step3X, 15, "spike");
    spike2.setOrigin(0.5, 0);
    spike2.setAngle(180);
    spike2.setDepth(11);

    const spike3 = this.add.image(step3X + spikeSpacing, 15, "spike");
    spike3.setOrigin(0.5, 0);
    spike3.setAngle(180);
    spike3.setDepth(11);

    // Create 2 spikes coming from right side (initially off-screen)
    const step3Y = baseStepHeight;
    this.step3RightSpike1 = this.add.image(GAME_WIDTH + 50, step3Y - 50, "spike");
    this.step3RightSpike1.setOrigin(0.5, 0.5);
    this.step3RightSpike1.setAngle(-90); // Point left
    this.step3RightSpike1.setDepth(11);

    this.step3RightSpike2 = this.add.image(GAME_WIDTH + 50, step3Y - 30, "spike");
    this.step3RightSpike2.setOrigin(0.5, 0.5);
    this.step3RightSpike2.setAngle(-90); // Point left
    this.step3RightSpike2.setDepth(11);

    // Create collision for right-side spikes
    this.step3RightSpikeCollider1 = this.add.rectangle(GAME_WIDTH + 50, step3Y - 50, 40, 40);
    this.step3RightSpikeCollider1.setDepth(10);
    this.physics.add.existing(this.step3RightSpikeCollider1, false);
    this.step3RightSpikeCollider1.body.setAllowGravity(false);

    this.step3RightSpikeCollider2 = this.add.rectangle(GAME_WIDTH + 50, step3Y - 30, 40, 40);
    this.step3RightSpikeCollider2.setDepth(10);
    this.physics.add.existing(this.step3RightSpikeCollider2, false);
    this.step3RightSpikeCollider2.body.setAllowGravity(false);
  }

  update() {
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
      if ((Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey)) && this.isOnGround) {
        this.player.setVelocityY(jumpPower);
        this.player.play("jump");
      }

      if (!this.isOnGround && this.player.anims.currentAnim.key !== "jump") {
        this.player.play("jump");
      }

      // Spike trap logic - trigger when player reaches midpoint between step1 and step2
      if (!this.spikeTrapTriggered) {
        const step1Bounds = this.step1.getBounds();
        const step2Bounds = this.step2.getBounds();
        const midpoint = (step1Bounds.right + step2Bounds.left) / 2;

        // Check if player crossed the midpoint
        if (this.player.x >= midpoint) {
          this.spikeTrapTriggered = true;

          // Show spikes on step 2 immediately
          this.step2Spikes.forEach(spike => {
            spike.setAlpha(1);
          });

          // Enable collision
          this.step2SpikeCollider.body.enable = true;
          this.physics.add.overlap(this.player, this.step2SpikeCollider, this.handleStep2SpikeCollision, null, this);

          // Hide spikes and deactivate after a short delay
          this.time.delayedCall(1000, () => {
            this.step2Spikes.forEach(spike => {
              spike.setAlpha(0);
            });
            this.step2SpikeCollider.body.enable = false;
          });
        }
      }

      // Step 3 spike trap - trigger when player lands on step 3
      if (!this.step3SpikesTrapTriggered && this.player.body.touching.down) {
        const step3Bounds = this.step3.getBounds();
        const playerBounds = this.player.getBounds();

        // Check if player is on step 3
        if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, step3Bounds)) {
          this.step3SpikesTrapTriggered = true;

          // Move spikes from right side all the way to the left side of screen
          this.tweens.add({
            targets: [this.step3RightSpike1, this.step3RightSpikeCollider1],
            x: -100,
            duration: 800,
            ease: 'Linear'
          });

          this.tweens.add({
            targets: [this.step3RightSpike2, this.step3RightSpikeCollider2],
            x: -100,
            duration: 800,
            ease: 'Linear'
          });

          // Add collision detection
          this.physics.add.overlap(this.player, this.step3RightSpikeCollider1, this.handleStep2SpikeCollision, null, this);
          this.physics.add.overlap(this.player, this.step3RightSpikeCollider2, this.handleStep2SpikeCollision, null, this);
        }
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
  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level13');
    // Go to Level 13
    this.scene.start("Level13");
  }
}

const Level12 = () => {
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
        scene: [Level12Scene],
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

export default Level12;
