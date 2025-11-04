import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level8Scene extends BaseScene {
  constructor() {
    super("Level8");
    this.backgroundKey = "background8";
    this.groundPlatformHeight = 200; // Much taller ground platform
    this.groundPlatformWidth = 400; // Much taller ground platform
    this.platformColor = 0x212121;
    this.levelWidth = GAME_WIDTH; // Single screen width like Level 1
    this.doorX = 1380; // Door on the last step

  }

  loadLevelAssets() {
    // Load Level 8 specific background
    this.load.image("background8", "/background 1/orig_big8.png");
  }

  create() {
    super.create();

    // Adjust player spawn position for the taller ground
    this.player.y = GAME_HEIGHT - 400;

    // Make door visible first - position it on screen (above right platform)
    this.door.x = GAME_WIDTH - 200;
    this.door.y = GAME_HEIGHT - 200;

    // Create spike graphics for the gap between platforms
    this.spikes = this.add.graphics();
    this.spikes.fillStyle(0x212121, 1); // Silver color
    this.spikes.setDepth(11);

    // Draw small triangular spikes in the gap at the bottom
    const spikeWidth = 20;
    const spikeHeight = 25;
    const gapStart = 400; // End of left platform
    const gapEnd = GAME_WIDTH - 400; // Start of right platform
    const spikeCount = Math.ceil((gapEnd - gapStart) / spikeHeight);

    for (let i = 0; i < spikeCount; i++) {
      const x = gapStart + (i * spikeHeight);
      this.spikes.fillTriangle(
        x, GAME_HEIGHT,                    // Left bottom point
        x + spikeHeight, GAME_HEIGHT,      // Right bottom point
        x + spikeHeight / 2, GAME_HEIGHT - spikeWidth // Top point (tip of spike)
      );
    }

    // Create invisible collision rectangle for spikes
    const gapWidth = gapEnd - gapStart;
    this.spikeCollider = this.add.rectangle(gapStart + gapWidth / 2, GAME_HEIGHT - 10, gapWidth, 20);
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

  handleStep3SpikeCollision() {
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
    // Create matching platforms on left and right sides

    // Left platform
    this.createPlatform(200, GAME_HEIGHT - 100, 400, 200);

    // Right platform (same height and width as left)
    this.createPlatform(GAME_WIDTH - 200, GAME_HEIGHT - 100, 400, 200);

    // Floating steps in the gap between left and right platforms
    const gapStart = 400;
    const gapEnd = GAME_WIDTH - 400;
    const gapWidth = gapEnd - gapStart;
    const stepSpacing = gapWidth / 4; // Divide gap into 4 sections for 3 steps

    // Step 1 (floating) - store reference for trap detection
    this.step1X = gapStart + stepSpacing;
    this.step1Y = GAME_HEIGHT - 250;
    this.step1 = this.createPlatform(this.step1X, this.step1Y, 150, 20);

    // Track if step 1 has been triggered
    this.step1Triggered = false;
    this.fallingObject = null;

    // Step 2 (floating)
    this.createPlatform(gapStart + stepSpacing * 2, GAME_HEIGHT - 350, 150, 20);

    // Step 3 (floating) - store reference for trap detection
    this.step3X = gapStart + stepSpacing * 3;
    this.step3Y = GAME_HEIGHT - 250;
    this.step3 = this.createPlatform(this.step3X, this.step3Y, 150, 20);

    // Create invisible spikes on step 3
    this.step3Spikes = this.add.graphics();
    this.step3Spikes.fillStyle(0xC0C0C0, 1); // Silver color
    this.step3Spikes.setDepth(12);
    this.step3Spikes.setVisible(false); // Start invisible

    // Draw spikes on step 3
    const spikeWidth = 15;
    const spikeHeight = 20;
    const spikeCount = Math.ceil(150 / spikeWidth);
    const step3Left = this.step3X - 75; // Platform is 150 wide, centered

    for (let i = 0; i < spikeCount; i++) {
      const x = step3Left + (i * spikeWidth);
      this.step3Spikes.fillTriangle(
        x, this.step3Y - 10,                    // Left point
        x + spikeWidth, this.step3Y - 10,       // Right point
        x + spikeWidth / 2, this.step3Y - 10 - spikeHeight // Top point (tip)
      );
    }

    // Track if step 3 has been triggered
    this.step3Triggered = false;

    // Create spike collision area (invisible initially)
    this.step3SpikeCollider = this.add.rectangle(this.step3X, this.step3Y - 20, 150, 30);
    this.step3SpikeCollider.setDepth(10);
    this.physics.add.existing(this.step3SpikeCollider, true);
    this.step3SpikeCollider.body.enable = false; // Disable collision initially
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

    // Check if player touches step 1 and trigger falling object
    if (!this.step1Triggered && this.player.body.touching.down) {
      const playerBounds = this.player.getBounds();
      const step1Bounds = this.step1.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, step1Bounds)) {
        this.step1Triggered = true;

        // Create falling circular object above step 1
        this.fallingObject = this.add.circle(this.step1X, 0, 40, 0x000000); // Black circle, radius 40
        this.physics.add.existing(this.fallingObject);
        this.fallingObject.body.setVelocityY(400); // Fall speed
        this.fallingObject.body.setBounce(0.7); // Bounce when hitting surfaces
        this.fallingObject.body.setCollideWorldBounds(true); // Don't go off screen
        this.fallingObject.setDepth(15);

        // Make it collide with platforms
        this.physics.add.collider(this.fallingObject, this.platforms);
      }
    }

    // Update falling object and check collision
    if (this.fallingObject && !this.levelComplete) {
      // Check if falling object hits the player
      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.fallingObject.x, this.fallingObject.y,
        this.player.x, this.player.y
      );

      // Kill player if they're within 60 pixels radius (larger kill area)
      if (distanceToPlayer < 60) {
        this.handleFallingObjectCollision();
      }
    }

    // Check if player touches step 3 and trigger spikes
    if (!this.step3Triggered && this.player.body.touching.down) {
      const playerBounds = this.player.getBounds();
      const step3Bounds = this.step3.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, step3Bounds)) {
        this.step3Triggered = true;

        // Make spikes visible
        this.step3Spikes.setVisible(true);

        // Enable spike collision
        this.step3SpikeCollider.body.enable = true;
        this.physics.add.overlap(this.player, this.step3SpikeCollider, this.handleStep3SpikeCollision, null, this);

        // Kill player immediately
        this.handleStep3SpikeCollision();
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
    localStorage.setItem('currentLevel', 'Level9');
    // Go to Level 9
    this.scene.start("Level9");
  }
}

const Level8 = () => {
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
        scene: [Level8Scene],
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

export default Level8;
