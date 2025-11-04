import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level15Scene extends BaseScene {
  constructor() {
    super("Level15");
    this.backgroundKey = "background15";
    this.groundPlatformHeight = null; // No continuous ground platform for this level
    this.platformColor = 0x212121; // Dark blue color for this level
    this.levelWidth = GAME_WIDTH; // Single screen width for this level
    this.doorX = GAME_WIDTH - 180; // Door near the end
  }

  loadLevelAssets() {
    // Load Level 15 specific background
    this.load.image("background15", "/background 1/orig_big15.png");
    // Load spike image
    this.load.image("spike", "/Spike.png");
  }

  create() {
    super.create();

    // Move player spawn position to be safe on the left platform (away from spikes)
    this.player.x = 150;
    this.player.y = GAME_HEIGHT - 200;

    // Fix door position to be on the rightmost floor section
    this.door.y = GAME_HEIGHT - 80;

    // Create spikes on the left wall (only in playable area)
    const wallThickness = 88;
    const spikeSpacing = 15;
    const leftWallX = wallThickness;

    // Calculate playable area (between ceiling and floor)
    const topWallHeight = 80; // Same as groundPlatformHeight
    const bottomWallHeight = 80;
    const playableTop = topWallHeight;
    const playableBottom = GAME_HEIGHT - bottomWallHeight;
    const playableHeight = playableBottom - playableTop;

    const numSpikes = Math.floor(playableHeight / spikeSpacing);

    this.leftSpikes = [];
    for (let i = 0; i < numSpikes; i++) {
      const spike = this.add.image(leftWallX, playableTop + (i * spikeSpacing), "spike");
      spike.setOrigin(0, 0.5);
      spike.setAngle(90); // Point right
      spike.setDepth(11);
      this.leftSpikes.push(spike);
    }

    // Create collision area for left wall spikes (very small collision area)
    this.leftSpikeCollider = this.add.rectangle(
      wallThickness + 10,
      playableTop + (playableHeight / 2),
      10,
      playableHeight
    );
    this.leftSpikeCollider.setDepth(10);
    this.physics.add.existing(this.leftSpikeCollider, true);
    this.physics.add.overlap(this.player, this.leftSpikeCollider, this.handleSpikeCollision, null, this);
  }

  spawnRollingBall() {
    const floorY = GAME_HEIGHT - 80;
    const ballRadius = 25;

    // Spawn ball from the right side
    this.ball = this.add.circle(GAME_WIDTH - 100, floorY - ballRadius - 40, ballRadius, 0x212121);
    this.physics.add.existing(this.ball);
    this.ball.body.setBounce(0, 0); // No bouncing
    this.ball.body.setCollideWorldBounds(false);
    this.ball.body.setVelocityX(-400); // Roll left faster
    this.ball.body.setAllowGravity(true);

    // Add collision with platforms
    this.physics.add.collider(this.ball, this.platforms);

    // Add collision with player
    this.physics.add.overlap(this.player, this.ball, this.handleBallCollision, null, this);
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

  update() {
    // Check if player is close to the fake platform (before stepping on it)
    if (!this.fakePlatformDisappeared && this.fakePlatform) {
      const fakePlatformLeftEdge = this.fakePlatform.x - (this.fakePlatform.width / 2);

      // Disappear when player is just a few pixels before the platform edge
      if (this.player.x >= fakePlatformLeftEdge - 10) {
        this.fakePlatformDisappeared = true;

        // Remove the fake platform from physics
        this.platforms.remove(this.fakePlatform);

        // Fade out and destroy the platform
        this.tweens.add({
          targets: this.fakePlatform,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            this.fakePlatform.destroy();
          }
        });
      }
    }

    // Spawn rolling ball when player gets near the door
    if (!this.ballSpawned && !this.levelComplete) {
      const distanceToDoor = Math.abs(this.player.x - this.door.x);

      if (distanceToDoor < 150) {
        this.ballSpawned = true;
        this.spawnRollingBall();
      }
    }

    // Destroy ball if it falls below screen
    if (this.ball && this.ball.y > GAME_HEIGHT + 100) {
      this.ball.destroy();
      this.ball = null;
    }

    // Check if player falls below the floor level to kill them
    const floorY = GAME_HEIGHT - 80;
    if (!this.levelComplete && this.player.y > floorY + 50) {
      this.levelComplete = true;
      this.player.play("death");
      this.player.body.setVelocity(0, 0);
      this.player.body.setAllowGravity(false);

      // Restart level after death animation
      this.player.once("animationcomplete", () => {
        this.scene.restart();
      });
    }

    // Override with swapped controls for this level
    if (!this.levelComplete) {
      const speed = 300;
      const jumpPower = -400;

      this.isOnGround = this.player.body.touching.down || this.player.body.blocked.down;

      // Swapped horizontal movement (A/Left goes right, D/Right goes left)
      if (this.cursors.left.isDown || this.aKey.isDown) {
        this.player.setVelocityX(speed); // Moving RIGHT with left/A key
        this.player.setFlipX(false);

        if (this.isOnGround && this.player.anims.currentAnim.key !== "run") {
          this.player.play("run");
        }
      } else if (this.cursors.right.isDown || this.dKey.isDown) {
        this.player.setVelocityX(-speed); // Moving LEFT with right/D key
        this.player.setFlipX(true);

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
  }

  createPlatforms() {
    // Create a closed room structure with walls on all sides
    const wallThickness = 80;

    // Left wall
    this.createPlatform(
      wallThickness / 2,
      GAME_HEIGHT / 2,
      wallThickness,
      GAME_HEIGHT
    );

    // Right wall
    this.createPlatform(
      GAME_WIDTH - wallThickness / 2,
      GAME_HEIGHT / 2,
      wallThickness,
      GAME_HEIGHT
    );

    // Top wall (ceiling)
    this.createPlatform(
      GAME_WIDTH / 2,
      wallThickness / 2,
      GAME_WIDTH,
      wallThickness
    );

    // Bottom floor divided into 3 sections
    const floorY = GAME_HEIGHT - wallThickness / 2;
    const floorHeight = wallThickness;
    const totalWidth = GAME_WIDTH - (2 * wallThickness); // Width between left and right walls
    const gapWidth = 100; // Gap width
    const sectionWidth = (totalWidth - (2 * gapWidth)) / 3; // Each section width

    // Section 1 (left platform)
    this.leftPlatform = this.createPlatform(
      wallThickness + sectionWidth / 2,
      floorY,
      sectionWidth,
      floorHeight
    );

    // Fake platform in the left gap - will disappear when player steps on it
    const fakePlatformX = wallThickness + sectionWidth + gapWidth / 2;
    this.fakePlatform = this.add.rectangle(
      fakePlatformX,
      floorY,
      gapWidth,
      floorHeight,
      this.platformColor
    );
    this.physics.add.existing(this.fakePlatform, true);
    this.platforms.add(this.fakePlatform);
    this.fakePlatformDisappeared = false;

    // Section 2 (middle platform)
    this.middlePlatform = this.createPlatform(
      wallThickness + sectionWidth + gapWidth + sectionWidth / 2,
      floorY,
      sectionWidth,
      floorHeight
    );

    // Section 3 (right platform)
    this.rightPlatform = this.createPlatform(
      wallThickness + (2 * sectionWidth) + (2 * gapWidth) + sectionWidth / 2,
      floorY,
      sectionWidth,
      floorHeight
    );

    // Track ball state
    this.ballSpawned = false;
    this.ball = null;
  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level16');
    // Go to Level 16
    this.scene.start("Level16");
  }
}

const Level15 = () => {
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
        scene: [Level15Scene],
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

export default Level15;
