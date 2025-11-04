import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level9Scene extends BaseScene {
  constructor() {
    super("Level9");
    this.backgroundKey = "background9";
    this.groundPlatformHeight = 100;
    this.groundPlatformWidth = GAME_WIDTH - 650;
    this.platformColor = 0x212121;
    this.levelWidth = GAME_WIDTH;
    this.doorX = GAME_WIDTH - 150;
  }

  loadLevelAssets() {
    // Load Level 9 specific background
    this.load.image("background9", "/background 1/orig_big9.png");
  }

  create() {
    super.create();

    // Track if rolling object has been spawned
    this.rollingObjectSpawned = false;
    this.rollingObject = null;

    // Create right platform with same height
    const rightPlatformX = GAME_WIDTH - 200;
    this.rightPlatform = this.createPlatform(rightPlatformX, GAME_HEIGHT - this.groundPlatformHeight / 2, 400, this.groundPlatformHeight);

    // Track if right platform rolling object has been spawned
    this.rightRollingObjectSpawned = false;
    this.rightRollingObject = null;

    // Create middle disappearing platform between left and right platforms
    const leftPlatformEnd = this.groundPlatformWidth;
    const rightPlatformStart = GAME_WIDTH - 200 - 200;
    this.middlePlatformX = (leftPlatformEnd + rightPlatformStart) / 2;
    this.middlePlatform = this.createPlatform(this.middlePlatformX, GAME_HEIGHT - this.groundPlatformHeight / 2, 250, this.groundPlatformHeight);

    // Track if middle platform has been stepped on
    this.middlePlatformStepped = false;
    this.fallingObject = null;
  }

  update() {
    // Override jump power for this level
    if (!this.levelComplete) {
      const speed = 300;
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

    // Check if player steps on middle platform and make it disappear
    if (!this.middlePlatformStepped && this.middlePlatform && this.player.body.touching.down) {
      const playerBounds = this.player.getBounds();
      const middlePlatformBounds = this.middlePlatform.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, middlePlatformBounds)) {
        this.middlePlatformStepped = true;

        // Create falling circular object after 0.5 second delay
        this.time.delayedCall(100, () => {
          const fallingObjectX = this.middlePlatformX - 80; // Offset to the left
          this.fallingObject = this.add.circle(fallingObjectX, 0, 40, 0x212121); // Same color as platform
          this.physics.add.existing(this.fallingObject);
          this.fallingObject.body.setVelocityY(400); // Fall speed
          this.fallingObject.body.setBounce(0.2); // Bounce when hitting surfaces
          this.fallingObject.body.setCollideWorldBounds(true); // Don't go off screen
          this.fallingObject.setDepth(15);

          // Make it collide with platforms
          this.physics.add.collider(this.fallingObject, this.platforms);
        });

        // Make platform disappear after a short delay
        this.time.delayedCall(100, () => {
          if (this.middlePlatform) {
            this.middlePlatform.destroy();
            this.platforms.remove(this.middlePlatform);
            this.middlePlatform = null;
          }
        });
      }
    }

    // Check collision between falling object and player
    if (this.fallingObject && !this.levelComplete) {
      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.fallingObject.x, this.fallingObject.y,
        this.player.x, this.player.y
      );

      // Kill player if they're within 60 pixels radius
      if (distanceToPlayer < 60) {
        this.handleFallingObjectCollision();
      }
    }

    // Check if player reaches 1/4 of the screen and spawn rolling object
    if (!this.rollingObjectSpawned && !this.levelComplete) {
      if (this.player.x >= GAME_WIDTH / 4) {
        this.rollingObjectSpawned = true;

        // Create rolling circular object from left side of screen
        this.rollingObject = this.add.circle(-50, GAME_HEIGHT - 150, 40, 0x212121);
        this.physics.add.existing(this.rollingObject);
        this.rollingObject.body.setVelocityX(450); // Roll speed to the right
        this.rollingObject.body.setAllowGravity(true);
        this.rollingObject.body.setBounce(0);
        this.rollingObject.setDepth(15);

        // Make it collide with platforms
        this.physics.add.collider(this.rollingObject, this.platforms);
      }
    }

    // Check if player lands on right platform and spawn rolling object from right
    if (!this.rightRollingObjectSpawned && this.rightPlatform && this.player.body.touching.down) {
      const playerBounds = this.player.getBounds();
      const rightPlatformBounds = this.rightPlatform.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, rightPlatformBounds)) {
        this.rightRollingObjectSpawned = true;

        // Create rolling circular object from right side of screen
        this.rightRollingObject = this.add.circle(GAME_WIDTH + 50, GAME_HEIGHT - 150, 40, 0x212121);
        this.physics.add.existing(this.rightRollingObject);
        this.rightRollingObject.body.setVelocityX(-450); // Roll speed to the left
        this.rightRollingObject.body.setAllowGravity(true);
        this.rightRollingObject.body.setBounce(0);
        this.rightRollingObject.setDepth(15);

        // Make it collide with platforms
        this.physics.add.collider(this.rightRollingObject, this.platforms);
      }
    }

    // Check collision between rolling object and player
    if (this.rollingObject && !this.levelComplete) {
      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.rollingObject.x, this.rollingObject.y,
        this.player.x, this.player.y
      );

      // Kill player if they're within 60 pixels radius
      if (distanceToPlayer < 60) {
        this.handleRollingObjectCollision();
      }
    }

    // Check collision between right rolling object and player
    if (this.rightRollingObject && !this.levelComplete) {
      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.rightRollingObject.x, this.rightRollingObject.y,
        this.player.x, this.player.y
      );

      // Kill player if they're within 60 pixels radius
      if (distanceToPlayer < 60) {
        this.handleRollingObjectCollision();
      }
    }
  }

  handleRollingObjectCollision() {
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

  handleFallingObjectCollision() {
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
    // Add Level 9 specific platforms here if needed
  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level10');
    // Go to Level 10
    this.scene.start("Level10");
  }
}

const Level9 = () => {
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
        scene: [Level9Scene],
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

export default Level9;
