import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level13Scene extends BaseScene {
  constructor() {
    super("Level13");
    this.backgroundKey = "background13";
    this.groundPlatformHeight = 120; // Smaller height for this level
    this.platformColor = 0x212121; // Dark blue color for this level
    this.levelWidth = GAME_WIDTH; // Single screen width for this level
    this.doorX = GAME_WIDTH - 150; // Door near the end
  }

  loadLevelAssets() {
    // Load Level 13 specific background
    this.load.image("background13", "/background 1/orig_big13.png");
    // Load spike image
    this.load.image("spike", "/Spike.png");
    // Load ball image (we'll use a circle for now)
  }

  create() {
    super.create();

    // Create T-shaped pole at 1/4 of screen
    const poleX = GAME_WIDTH / 4;
    const poleColor = 0x212121; // Brown color for the pole
    const groundTop = GAME_HEIGHT - 120; // Top of the ground platform
    const poleHeight = 200;

    // Create a container for the entire pole structure
    this.poleContainer = this.add.container(poleX, groundTop);

    // Vertical part of the T (pole) - slim (relative to container)
    this.verticalPole = this.add.rectangle(0, -poleHeight / 2, 12, poleHeight, poleColor);
    this.verticalPole.setDepth(10);

    // Horizontal part of the T (top) - longer and slim (relative to container)
    this.horizontalPole = this.add.rectangle(0, -poleHeight, 100, 10, poleColor);
    this.horizontalPole.setDepth(10);

    // Add spikes on each end of horizontal pole (relative to container)
    const spikeLeftX = -40; // Left end of horizontal pole
    const spikeRightX = 40; // Right end of horizontal pole
    const spikeY = -poleHeight + 21; // At the bottom edge of horizontal bar

    // Left spike
    this.leftSpike = this.add.image(spikeLeftX, spikeY, "spike");
    this.leftSpike.setOrigin(0.5, 0);
    this.leftSpike.setAngle(180); // Point downward
    this.leftSpike.setDepth(11);
    this.leftSpike.falling = false;

    // Right spike
    this.rightSpike = this.add.image(spikeRightX, spikeY, "spike");
    this.rightSpike.setOrigin(0.5, 0);
    this.rightSpike.setAngle(180); // Point downward
    this.rightSpike.setDepth(11);
    this.rightSpike.falling = false;

    // Add all elements to container
    this.poleContainer.add([this.verticalPole, this.horizontalPole, this.leftSpike, this.rightSpike]);

    this.poleX = poleX;
    this.poleFallen = false;
    this.leftSpikeTriggered = false;
    this.ballWaveCount = 0; // Track how many ball waves have been triggered
    this.balls = []; // Array to hold multiple balls
    this.ballWave1Triggered = false;
    this.ballWave2Triggered = false;
  }

  update() {
    // Override speed for this level to make it more difficult
    if (!this.levelComplete) {
      const speed = 300; // Reduced speed from default 300
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

    // Pole falling logic - when player crosses center
    if (!this.poleFallen && this.player.x > this.poleX) {
      this.poleFallen = true;

      // Rotate entire pole container to the right (90 degrees)
      this.tweens.add({
        targets: this.poleContainer,
        angle: 90,
        duration: 2500,
        ease: 'Power2',
        onComplete: () => {
          // Create solid platforms at the fallen pole's position
          const groundTop = GAME_HEIGHT - 120;
          const poleHeight = 200;

          // Horizontal platform for the vertical pole (now horizontal after 90 degree rotation)
          this.fallenPolePlatform = this.add.rectangle(
            this.poleX + poleHeight / 2,
            groundTop - 6,
            poleHeight,
            12,
            0x212121
          );
          this.fallenPolePlatform.setAlpha(0); // Make it invisible (visual is from container)
          this.physics.add.existing(this.fallenPolePlatform, true);
          this.physics.add.collider(this.player, this.fallenPolePlatform);

          // Horizontal platform for the horizontal bar (now also horizontal at the top)
          this.fallenHorizontalBarPlatform = this.add.rectangle(
            this.poleX + poleHeight,
            groundTop - 56,
            10,
            2,
            0x212121
          );
          this.fallenHorizontalBarPlatform.setAlpha(0); // Make it invisible
          this.physics.add.existing(this.fallenHorizontalBarPlatform, true);
          this.physics.add.collider(this.player, this.fallenHorizontalBarPlatform);
        }
      });
    }

    // Left spike falling logic
    if (!this.leftSpikeTriggered && !this.leftSpike.falling) {
      // Get the world position of the left spike from the container
      const spikeWorldX = this.poleContainer.x + this.leftSpike.x;
      const distanceToLeftSpike = Math.abs(this.player.x - spikeWorldX);

      // Trigger when player is within 50px of left spike
      if (distanceToLeftSpike < 40) {
        this.leftSpikeTriggered = true;
        this.leftSpike.falling = true;

        // Remove spike from container and add to world
        this.poleContainer.remove(this.leftSpike);

        // Set spike to world position
        this.leftSpike.setPosition(spikeWorldX, this.poleContainer.y + this.leftSpike.y);

        // Add physics to the spike
        this.physics.add.existing(this.leftSpike);
        this.leftSpike.body.setVelocityY(600); // Fast falling speed
        this.leftSpike.body.setAllowGravity(false);
      }
    }

    // Check collision with falling left spike
    if (this.leftSpike.falling && !this.levelComplete) {
      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.leftSpike.x, this.leftSpike.y,
        this.player.x, this.player.y
      );

      if (distanceToPlayer < 40) {
        this.handleSpikeCollision();
      }

      // Destroy spike if it goes off screen
      if (this.leftSpike.y > GAME_HEIGHT + 100) {
        this.leftSpike.destroy();
      }
    }

    // First ball wave - when player reaches 3/4 of screen
    if (!this.ballWave1Triggered && this.player.x >= GAME_WIDTH * 0.75) {
      this.ballWave1Triggered = true;
      this.ballWaveCount++;

      // Create 1 ball
      this.spawnBall(GAME_WIDTH - 100);
    }

    // Second ball wave - when player reaches 3/4 again (after going back)
    if (this.ballWave1Triggered && !this.ballWave2Triggered && this.player.x >= GAME_WIDTH * 0.75 && this.balls.length === 0) {
      this.ballWave2Triggered = true;
      this.ballWaveCount++;

      // Create 1 ball
      this.spawnBall(GAME_WIDTH - 100);
    }

    // Destroy balls if they go off screen
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      if (ball && (ball.x < -100 || ball.x > GAME_WIDTH + 100)) {
        ball.destroy();
        this.balls.splice(i, 1);
      }
    }
  }

  spawnBall(startX) {
    const groundTop = GAME_HEIGHT - 120;
    const ball = this.add.circle(startX, groundTop - 35, 30, 0x212121);
    this.physics.add.existing(ball);
    ball.body.setBounce(1, 0.3); // Full horizontal bounce, small vertical bounce
    ball.body.setCollideWorldBounds(false);
    ball.body.setVelocityX(-300); // Move left (rolling speed)
    ball.body.setAllowGravity(true);

    // Add collision with player
    this.physics.add.overlap(this.player, ball, this.handleBallCollision, null, this);

    // Add collision with ground
    this.physics.add.collider(ball, this.platforms);

    // Add collision with fallen pole platforms
    if (this.fallenPolePlatform) {
      this.physics.add.collider(ball, this.fallenPolePlatform);
    }
    if (this.fallenHorizontalBarPlatform) {
      this.physics.add.collider(ball, this.fallenHorizontalBarPlatform);
    }

    this.balls.push(ball);
    return ball;
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

  createPlatforms() {
    // Add Level 13 specific platforms here
  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level14');
    // Go to Level 14
    this.scene.start("Level14");
  }
}

const Level13 = () => {
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
        scene: [Level13Scene],
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

export default Level13;
