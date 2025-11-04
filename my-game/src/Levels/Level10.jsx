import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level10Scene extends BaseScene {
  constructor() {
    super("Level10");
    this.backgroundKey = "background10";
    this.groundPlatformHeight = 300; // Much taller ground platform
    this.groundPlatformWidth = 200; // Much taller ground platform
    this.platformColor = 0x212121;
    this.levelWidth = GAME_WIDTH; // Single screen width like Level 1
    this.doorX = 1380; // Door on the last step

  }

  loadLevelAssets() {
    // Load Level 10 specific background
    this.load.image("background10", "/background 1/orig_big10.png");
    // Load spike image
    this.load.image("spike", "/Spike.png");
  }

  create() {
    super.create();

    // Adjust player spawn position
    this.player.y = GAME_HEIGHT - 500;

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

  createPlatforms() {
    // Right platform (same height as left platform)
    this.createPlatform(GAME_WIDTH - 200, GAME_HEIGHT - 100, 400, 200);

    // Four floating steps from left platform to right platform (all at same height)
    const leftPlatformEnd = this.groundPlatformWidth;
    const rightPlatformStart = GAME_WIDTH - 200 - 200;
    const gapWidth = rightPlatformStart - leftPlatformEnd;
    const stepSpacing = gapWidth / 4.5; // More spacing between steps
    const stepHeight = GAME_HEIGHT - 300;
    const leftOffset = 50; // Shift all steps to the left

    // Step 1 - invisible by default
    this.step1 = this.createPlatform(leftPlatformEnd + stepSpacing - leftOffset, stepHeight, 120, 20);
    this.step1.setAlpha(0); // Make invisible
    this.step1Visible = false;

    // Step 2 - invisible by default
    this.step2 = this.createPlatform(leftPlatformEnd + stepSpacing * 2 - leftOffset, stepHeight, 120, 20);
    this.step2.setAlpha(0); // Make invisible
    this.step2Visible = false;

    // Step 3 - invisible by default
    this.step3 = this.createPlatform(leftPlatformEnd + stepSpacing * 3 - leftOffset, stepHeight, 120, 20);
    this.step3.setAlpha(0); // Make invisible
    this.step3Visible = false;

    // Step 4 - invisible by default
    this.step4 = this.createPlatform(leftPlatformEnd + stepSpacing * 4 - leftOffset, stepHeight, 120, 20);
    this.step4.setAlpha(0); // Make invisible
    this.step4Visible = false;
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

    // Check if player lands on invisible steps and make them visible
    if (this.player.body.touching.down) {
      const playerBounds = this.player.getBounds();

      // Check step 1
      if (!this.step1Visible && this.step1) {
        const step1Bounds = this.step1.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, step1Bounds)) {
          this.step1Visible = true;
          this.step1.setAlpha(1); // Make visible
        }
      }

      // Check step 2
      if (!this.step2Visible && this.step2) {
        const step2Bounds = this.step2.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, step2Bounds)) {
          this.step2Visible = true;
          this.step2.setAlpha(1); // Make visible
        }
      }

      // Check step 3
      if (!this.step3Visible && this.step3) {
        const step3Bounds = this.step3.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, step3Bounds)) {
          this.step3Visible = true;
          this.step3.setAlpha(1); // Make visible
        }
      }

      // Check step 4
      if (!this.step4Visible && this.step4) {
        const step4Bounds = this.step4.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, step4Bounds)) {
          this.step4Visible = true;
          this.step4.setAlpha(1); // Make visible
        }
      }
    }

  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level11');
    // Go to Level 11
    this.scene.start("Level11");
  }
}

const Level10 = () => {
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
        scene: [Level10Scene],
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

export default Level10;
