import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level2Scene extends BaseScene {
  constructor() {
    super("Level2");
    this.backgroundKey = "background2";
    this.groundPlatformHeight = 600; // Much taller ground platform
    this.groundPlatformWidth = 200; // Much taller ground platform
    this.platformColor = 0x212121;
    this.levelWidth = GAME_WIDTH; // Single screen width like Level 1

    // Dynamic positions based on screen width (using percentages)
    this.step1X = GAME_WIDTH * 0.19;  // ~19% from left
    this.step2X = GAME_WIDTH * 0.32;  // ~32% from left
    this.step3X = GAME_WIDTH * 0.45;  // ~45% from left
    this.step4X = GAME_WIDTH * 0.58;  // ~58% from left
    this.step5X = GAME_WIDTH * 0.71;  // ~71% from left
    this.step6X = GAME_WIDTH * 0.84;  // ~84% from left
    this.doorX = GAME_WIDTH * 0.84;   // Door on the last step

  }

  loadLevelAssets() {
    // Load Level 2 specific background
    this.load.image("background2", "/background 1/orig_big2.png"); // Change this when you have Level 2 background
  }

  create() {
    super.create();

    // Adjust player spawn position for the taller ground
    this.player.y = GAME_HEIGHT - 700;

    // Position door dynamically based on calculated doorY (now door exists)
    this.door.x = this.doorX;
    this.door.y = this.doorY; // doorY already calculated to place door on platform top
  }

  createPlatforms() {
    // Create individual steps with custom properties
    // Store step 6 details for door positioning
    const step6Y = 1000;
    const step6Height = GAME_HEIGHT + 50;

    // Step 1
    this.createPlatform(this.step1X, 500, 200, GAME_HEIGHT - 150);

    // Step 2 - Disappearing step (trap)
    this.disappearingStep = this.add.rectangle(this.step2X, 600, 200, GAME_HEIGHT - 100, 0x212121);
    this.physics.add.existing(this.disappearingStep, true);
    this.platforms.add(this.disappearingStep);

    this.createPlatform(this.step3X, 700, 200, GAME_HEIGHT - 60);
    this.createPlatform(this.step4X, 800, 200, GAME_HEIGHT - 20);
    this.createPlatform(this.step5X, 900, 200, GAME_HEIGHT + 20);
    this.createPlatform(this.step6X, step6Y, 200, step6Height);

    // Simply place door at last platform's top
    // Platform center Y = step6Y, height = step6Height
    // Top of platform = center - (height / 2)
    this.doorY = step6Y - (step6Height / 2);

    // Track if step has been touched
    this.stepTouched = false;
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

    // Check if player is standing on the disappearing step
    if (!this.stepTouched && this.disappearingStep && this.player.body.touching.down) {
      // Check if player is overlapping with the disappearing step
      const playerBounds = this.player.getBounds();
      const stepBounds = this.disappearingStep.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, stepBounds)) {
        this.stepTouched = true;

        // IMMEDIATELY remove from platforms group to stop collision
        this.platforms.remove(this.disappearingStep, true, true);

        // Destroy the platform instantly
        this.disappearingStep.destroy();
        this.disappearingStep = null;

        // Force player to fall immediately - remove any upward velocity and add downward force
        this.player.setVelocityY(200); // Immediate downward velocity
        this.player.body.checkCollision.up = false; // Prevent standing on removed platform
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
    localStorage.setItem('currentLevel', 'Level3');
    // Go to Level 3
    this.scene.start("Level3");
  }
}

const Level2 = () => {
  useEffect(() => {
    let game;

    const createGame = () => {
      const config = {
        type: Phaser.AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent: "phaser-container",
        scale: {
          mode: Phaser.Scale.NONE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { y: 1000 },
            debug: false,
          },
        },
        scene: [Level2Scene],
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

export default Level2;
