import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level16Scene extends BaseScene {
  constructor() {
    super("Level16");
    this.backgroundKey = "background16";
    this.groundPlatformHeight = 140; // Smaller height for this level
    this.platformColor = 0x212121; // Dark color for this level
    this.levelWidth = GAME_WIDTH; // Single screen width for this level
    this.doorX = GAME_WIDTH - 200; // Temporary position, will be updated in create()
  }

  loadLevelAssets() {
    // Load Level 16 specific background
    this.load.image("background16", "/background 1/orig_big16.png");
    // Load spike image
    this.load.image("spike", "/Spike.png");
  }

  create() {
    super.create();

    // Track spike trap state
    this.spikeTrapTriggered = false;

    // Track ball state
    this.ballSpawned = false;
    this.ball = null;

    // Track right spikes state
    this.rightSpikesTriggered = false;

    // Move door to platform 4 position (stored in createPlatforms)
    this.door.x = this.platform4X;
    this.door.y = this.platform4Y - 7.5;
  }

  update() {
    // Spawn ball when player reaches 1/4 of screen
    if (!this.ballSpawned && !this.levelComplete && this.player.x >= GAME_WIDTH / 4) {
      this.ballSpawned = true;
      this.spawnBall();
    }

    // Destroy ball if it goes off screen
    if (this.ball && this.ball.x > GAME_WIDTH + 100) {
      this.ball.destroy();
      this.ball = null;
    }

    // Show right spikes when player lands on platform 3
    if (!this.rightSpikesTriggered && !this.levelComplete) {
      const platform3X = GAME_WIDTH - 65;
      const platform3Y = GAME_HEIGHT - 450;

      const isOnPlatform3 = Math.abs(this.player.x - platform3X) < 40;
      const isNearPlatform3Y = this.player.y >= platform3Y - 50 && this.player.y <= platform3Y + 20;

      // Trigger when player is closer to platform 3
      if (isOnPlatform3 && isNearPlatform3Y) {
        this.rightSpikesTriggered = true;

        // Show spikes immediately
        this.rightSpike1.setAlpha(1);
        this.rightSpike2.setAlpha(1);
        this.rightSpike3.setAlpha(1);

        // Enable collision
        this.physics.add.overlap(this.player, this.rightSpikeCollider1, this.handleSpikeCollision, null, this);
        this.physics.add.overlap(this.player, this.rightSpikeCollider2, this.handleSpikeCollision, null, this);
        this.physics.add.overlap(this.player, this.rightSpikeCollider3, this.handleSpikeCollision, null, this);
      }
    }

    // Check if player gets close to platform 2 to trigger spikes
    if (!this.spikeTrapTriggered && !this.levelComplete) {
      const isNearPlatform2 = Math.abs(this.player.x - this.platform2X) < 90;
      const isNearPlatform2Y = this.player.y >= (GAME_HEIGHT - 350) - 50 && this.player.y <= (GAME_HEIGHT - 350) + 20;

      // Trigger when player is close to platform 2
      if (isNearPlatform2 && isNearPlatform2Y) {
        this.spikeTrapTriggered = true;

        // Show spikes immediately
        this.platform2Spikes.forEach(spike => spike.setAlpha(1));

        // Enable collision
        this.platform2SpikeColliders.forEach(collider => {
          this.physics.add.overlap(this.player, collider, this.handleSpikeCollision, null, this);
        });

        // Hide spikes and disable collision after 1 second
        this.time.delayedCall(1000, () => {
          this.platform2Spikes.forEach(spike => spike.setAlpha(0));
          this.platform2SpikeColliders.forEach(collider => {
            this.physics.world.disable(collider);
          });
        });
      }
    }

    // Override with increased jump power for this level
    if (!this.levelComplete) {
      const speed = 300;
      const jumpPower = -500; // Increased jump power for this level

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
  }

  createPlatforms() {
    const wallThickness = 80;

    // Create platforms on the right side in a staircase pattern
    const platformWidth = 130;
    const platformHeight = 15;
    const horizontalGap = 200; // Distance between platforms horizontally

    // First platform (lower right - connected to edge)
    this.rightPlatform1 = this.createPlatform(
      GAME_WIDTH - platformWidth / 2,
      GAME_HEIGHT - 250,
      platformWidth,
      platformHeight
    );

    // Second platform (middle - slightly to the left of first)
    const platform2X = GAME_WIDTH - platformWidth / 2 - horizontalGap;
    const platform2Y = GAME_HEIGHT - 350;
    this.rightPlatform2 = this.createPlatform(
      platform2X,
      platform2Y,
      platformWidth,
      platformHeight
    );

    // Support column for second platform (from top to platform)
    const supportWidth = 20;
    const supportHeight = platform2Y - platformHeight / 2;
    this.support2 = this.createPlatform(
      platform2X - platformWidth / 2 + supportWidth / 2,
      supportHeight / 2,
      supportWidth,
      supportHeight
    );

    // Create invisible spikes on platform 2 (more towards the right side)
    this.platform2Spikes = [];
    this.platform2SpikeColliders = [];
    const spikeSpacing = 20;
    const numSpikes = Math.floor(platformWidth / spikeSpacing) - 1; // Remove last spike for symmetry
    const startOffset = platformWidth / 4; // Start spikes from 1/4 of the platform (more to the right)

    for (let i = 0; i < numSpikes; i++) {
      const spikeX = platform2X - platformWidth / 2 + startOffset + (i * spikeSpacing);
      const spikeY = platform2Y - platformHeight / 2;

      const spike = this.add.image(spikeX, spikeY, "spike");
      spike.setOrigin(0.5, 1);
      spike.setAngle(0);
      spike.setDepth(11);
      spike.setAlpha(0); // Invisible initially
      this.platform2Spikes.push(spike);

      const collider = this.add.rectangle(spikeX, spikeY - 10, 10, 7);
      collider.setDepth(10);
      this.physics.add.existing(collider, true);
      this.platform2SpikeColliders.push(collider);
    }

    // Store platform positions for detection
    this.platform1X = GAME_WIDTH - platformWidth / 2;
    this.platform2X = platform2X;

    // Third platform (upper - back to the right edge)
    const platform3X = GAME_WIDTH - platformWidth / 2;
    const platform3Y = GAME_HEIGHT - 450;
    this.rightPlatform3 = this.createPlatform(
      platform3X,
      platform3Y,
      platformWidth,
      platformHeight
    );

    // Fourth platform (top - slightly to the left again)
    const platform4X = GAME_WIDTH - platformWidth / 2 - horizontalGap;
    const platform4Y = GAME_HEIGHT - 550;
    this.rightPlatform4 = this.createPlatform(
      platform4X,
      platform4Y,
      platformWidth,
      platformHeight
    );

    // Support column for fourth platform (from top to platform)
    const support4Height = platform4Y - platformHeight / 2;
    this.support4 = this.createPlatform(
      platform4X - platformWidth / 2 + supportWidth / 2,
      support4Height / 2,
      supportWidth,
      support4Height
    );

    // Store platform 4 position for door placement
    this.platform4X = platform4X;
    this.platform4Y = platform4Y;

    // Create 3 spikes on the right side of platform 3 (touching right edge)
    const rightSpikeSpacing = 15; // Reduced gap between spikes
    const spikeX = GAME_WIDTH - 5; // Very close to right edge

    const spike1Y = platform3Y - 20;
    const spike2Y = platform3Y - 20 - rightSpikeSpacing;
    const spike3Y = platform3Y - 20 - (2 * rightSpikeSpacing);

    this.rightSpike1 = this.add.image(spikeX, spike1Y, "spike");
    this.rightSpike1.setOrigin(0.5, 0.5);
    this.rightSpike1.setAngle(-90); // Point left
    this.rightSpike1.setDepth(11);
    this.rightSpike1.setAlpha(0); // Invisible initially

    this.rightSpike2 = this.add.image(spikeX, spike2Y, "spike");
    this.rightSpike2.setOrigin(0.5, 0.5);
    this.rightSpike2.setAngle(-90); // Point left
    this.rightSpike2.setDepth(11);
    this.rightSpike2.setAlpha(0); // Invisible initially

    this.rightSpike3 = this.add.image(spikeX, spike3Y, "spike");
    this.rightSpike3.setOrigin(0.5, 0.5);
    this.rightSpike3.setAngle(-90); // Point left
    this.rightSpike3.setDepth(11);
    this.rightSpike3.setAlpha(0); // Invisible initially

    // Store collider references for later use (smaller collision area)
    this.rightSpikeCollider1 = this.add.rectangle(spikeX - 20, spike1Y, 10, 7);
    this.physics.add.existing(this.rightSpikeCollider1, true);

    this.rightSpikeCollider2 = this.add.rectangle(spikeX - 20, spike2Y, 10, 7);
    this.physics.add.existing(this.rightSpikeCollider2, true);

    this.rightSpikeCollider3 = this.add.rectangle(spikeX - 20, spike3Y, 10, 7);
    this.physics.add.existing(this.rightSpikeCollider3, true);
  }

  spawnBall() {
    const groundY = GAME_HEIGHT - 140; // Ground level
    const ballRadius = 40; // Increased size

    // Spawn ball from the left side
    this.ball = this.add.circle(-100, groundY - ballRadius - 70, ballRadius, 0x212121);
    this.physics.add.existing(this.ball);
    this.ball.body.setBounce(0, 0); // No bouncing
    this.ball.body.setCollideWorldBounds(false);
    this.ball.body.setVelocityX(420); // Roll right
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

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level17');
    // Go to Level 17
    this.scene.start("Level17");
  }
}

const Level16 = () => {
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
        scene: [Level16Scene],
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

export default Level16;
