import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level18Scene extends BaseScene {
  constructor() {
    super("Level18");
    this.backgroundKey = "background18";
    this.groundPlatformHeight = 200; // Smaller height for this level
    this.groundPlatformWidth = 200; // Smaller width for this level
    this.platformColor = 0x212121; // Dark color for this level
    this.levelWidth = GAME_WIDTH; // Single screen width for this level
    this.doorX = GAME_WIDTH - 100; // Door near the end on right platform
  }

  loadLevelAssets() {
    // Load Level 18 specific background
    this.load.image("background18", "/background 1/orig_big18.png");
  }

  create() {
    super.create();
    this.player.x = 100;
    this.player.y = GAME_HEIGHT - 300;

    // Move door to right platform (on top of the taller platform)
    const rightPlatformHeight = 400;
    this.door.x = GAME_WIDTH - 100;
    this.door.y = GAME_HEIGHT - rightPlatformHeight;

    // Track jump delay
    this.jumpRequested = false;
    this.jumpTimer = null;

    // Track falling ball state
    this.ballTriggered = false;
    this.fallingBall = null;
    this.ballBounceCount = 0;

    // Track right front platform animation
    this.rightFrontPlatformTriggered = false;
  }

  update() {
    // Override the update to add jump delay
    if (this.levelComplete) {
      return;
    }

    // Kill player if they touch the actual ground floor (not on any platform)
    const isOnGround = this.player.body.touching.down || this.player.body.blocked.down;
    if (this.player.y >= GAME_HEIGHT - this.groundPlatformHeight + 50 && isOnGround && !this.levelComplete) {
      this.levelComplete = true;
      this.player.play("death");
      this.player.body.setVelocity(0, 0);
      this.player.body.setAllowGravity(false);

      // Restart level after death animation
      this.player.once("animationcomplete", () => {
        this.scene.restart();
      });
      return;
    }

    const speed = 300;
    const jumpPower = -400;

    this.isOnGround = this.player.body.touching.down || this.player.body.blocked.down;

    // Horizontal movement - arrow keys or WASD
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

    // Jump with 0.7 second delay (unless right front platform is triggered)
    if ((Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey)) && this.isOnGround && !this.jumpRequested) {
      // If right front platform has been triggered, jump immediately
      if (this.rightFrontPlatformTriggered) {
        this.player.setVelocityY(jumpPower);
        this.player.play("jump");
      } else {
        // Request jump with delay
        this.jumpRequested = true;

        // Clear any existing timer
        if (this.jumpTimer) {
          this.jumpTimer.remove();
        }

        // Set timer for 0.7 second delay
        this.jumpTimer = this.time.delayedCall(700, () => {
          // Execute jump after 0.7 second if still on ground
          if (this.isOnGround && !this.levelComplete) {
            this.player.setVelocityY(jumpPower);
            this.player.play("jump");
          }
          this.jumpRequested = false;
          this.jumpTimer = null;
        });
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

    // Check if player is on middle platform and trigger falling ball
    if (!this.ballTriggered && this.player.body.touching.down) {
      const playerBounds = this.player.getBounds();
      const middlePlatformBounds = this.middlePlatform.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, middlePlatformBounds)) {
        this.ballTriggered = true;

        // Create falling ball above middle platform
        this.fallingBall = this.add.circle(this.middlePlatformX, 0, 25, 0x212121); // Dark circle, radius 25
        this.physics.add.existing(this.fallingBall);
        this.fallingBall.body.setVelocityY(400); // Fall speed
        this.fallingBall.body.setBounce(0.7); // Bounce when hitting surfaces
        this.fallingBall.body.setCollideWorldBounds(true); // Don't go off screen
        this.fallingBall.setDepth(15);

        // Make it collide with platforms and track bounces
        this.physics.add.collider(this.fallingBall, this.platforms, () => {
          this.ballBounceCount++;

          // After 2 bounces, remove bounce
          if (this.ballBounceCount >= 2) {
            this.fallingBall.body.setBounce(0);

            // Wait for ball to settle, then make it roll forward
            this.time.delayedCall(500, () => {
              if (this.fallingBall) {
                this.fallingBall.body.setVelocityX(200);
                this.fallingBall.body.setCollideWorldBounds(false); // Allow to fall off screen
              }
            });
          }
        });
      }
    }

    // Update falling ball and check collision
    if (this.fallingBall && !this.levelComplete) {
      // Check if falling ball hits the player
      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.fallingBall.x, this.fallingBall.y,
        this.player.x, this.player.y
      );

      // Kill player if they're within 40 pixels radius
      if (distanceToPlayer < 40) {
        this.handleBallCollision();
      }
    }

    // Check if player lands on right middle platform and trigger right front platform animation
    if (!this.rightFrontPlatformTriggered && this.player.body.touching.down) {
      const playerBounds = this.player.getBounds();
      const rightMiddlePlatformBounds = this.rightMiddlePlatform.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, rightMiddlePlatformBounds)) {
        this.rightFrontPlatformTriggered = true;

        // Remove jump delay immediately
        this.jumpRequested = false;
        if (this.jumpTimer) {
          this.jumpTimer.remove();
          this.jumpTimer = null;
        }

        // Animate platform moving forward (to the right) very slowly
        // Keep physics enabled and update body position continuously
        this.tweens.add({
          targets: this.rightFrontPlatform,
          x: this.rightFrontPlatform.x + 300, // Move 300 pixels to the right
          duration: 10000, // Very slow - 10 seconds
          ease: 'Linear',
          onUpdate: () => {
            // Update physics body position to match visual position
            if (this.rightFrontPlatform.body) {
              this.rightFrontPlatform.body.updateFromGameObject();
            }
          }
        });
      }
    }
  }

  handleBallCollision() {
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
    // Second platform in front of the ground platform (top surfaces aligned)
    const platformWidth = 200;
    const platformHeight = 20;
    const groundPlatformHeight = 200;

    // Ground platform top surface is at: GAME_HEIGHT - groundPlatformHeight
    // Front platform should have its top at the same position
    // So its center Y should be: topSurface + platformHeight/2
    this.frontPlatform = this.createPlatform(
      platformWidth + platformWidth / 2,
      GAME_HEIGHT - groundPlatformHeight + platformHeight / 2,
      platformWidth,
      platformHeight
    );

    // Store front platform position for ball trigger
    this.frontPlatformX = platformWidth + platformWidth / 2;

    // Create a square obstacle at the center of the level (will move up/down later)
    const squareSize = 150;
    this.centerSquare = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 250,
      squareSize,
      squareSize,
      this.platformColor
    );
    this.physics.add.existing(this.centerSquare, true); // Static body
    this.platforms.add(this.centerSquare);

    // Small platform between left platform and center square
    const middlePlatformWidth = 100;
    const middlePlatformHeight = 15;
    const middlePlatformX = (platformWidth * 2 + GAME_WIDTH / 2) / 2;
    const middlePlatformY = GAME_HEIGHT - 250;
    this.middlePlatform = this.createPlatform(
      middlePlatformX,
      middlePlatformY,
      middlePlatformWidth,
      middlePlatformHeight
    );

    // Store middle platform position for ball target
    this.middlePlatformX = middlePlatformX;
    this.middlePlatformY = middlePlatformY;

    // Right platform - taller than left platform, door will be on this
    const rightPlatformWidth = 200;
    const rightPlatformHeight = 400; // Much taller than ground platform
    this.rightPlatform = this.createPlatform(
      GAME_WIDTH - rightPlatformWidth / 2,
      GAME_HEIGHT - rightPlatformHeight / 2,
      rightPlatformWidth,
      rightPlatformHeight
    );

    // Second platform on right side (similar to left side) - top surfaces aligned
    const rightFrontPlatformWidth = 200;
    const rightFrontPlatformHeight = 20;

    this.rightFrontPlatform = this.createPlatform(
      GAME_WIDTH - rightPlatformWidth - rightFrontPlatformWidth / 2,
      GAME_HEIGHT - rightPlatformHeight + rightFrontPlatformHeight / 2,
      rightFrontPlatformWidth,
      rightFrontPlatformHeight
    );

    // Small platform between right platform and center square
    const rightMiddlePlatformWidth = 100;
    const rightMiddlePlatformHeight = 15;
    this.rightMiddlePlatform = this.createPlatform(
      (GAME_WIDTH - rightPlatformWidth * 2 + GAME_WIDTH / 2) / 2, // Halfway between right platform and square
      GAME_HEIGHT - 350,
      rightMiddlePlatformWidth,
      rightMiddlePlatformHeight
    );
  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level19');
    // Go to Level 19
    this.scene.start("Level19");
  }
}

const Level18 = () => {
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
        scene: [Level18Scene],
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

export default Level18;
