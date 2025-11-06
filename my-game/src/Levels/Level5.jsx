import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level5Scene extends BaseScene {
  constructor() {
    super("Level5");
    this.backgroundKey = "background5";
    this.groundPlatformHeight = 80;
    this.platformColor = 0x212121;
    this.levelWidth = GAME_WIDTH; // Single screen width for this level
    this.doorX = GAME_WIDTH - 150; // Door near the end
  }

  loadLevelAssets() {
    // Load Level 5 specific background
    this.load.image("background5", "/background 1/orig_big5.png");
  }

  create() {
    super.create();

    // Track if game has been flipped
    this.gameFlipped = false;

    // Track spike movement
    this.leftSpikeX = 0;
    this.rightSpikeX = GAME_WIDTH;
    this.spikesMoving = false;

    // Create spike graphics for all boundaries (death zones)
    this.spikes = this.add.graphics();
    this.spikes.fillStyle(0x212121, 1);
    this.spikes.setDepth(11);

    const spikeWidth = 30;
    const spikeHeight = 40;

    // Left boundary spikes
    const leftSpikeCount = Math.ceil(GAME_HEIGHT / spikeHeight);
    for (let i = 0; i < leftSpikeCount; i++) {
      const y = i * spikeHeight;
      this.spikes.fillTriangle(
        0, y,                           // Top left point
        0, y + spikeHeight,             // Bottom left point
        spikeWidth, y + spikeHeight / 2 // Right point (tip of spike)
      );
    }

    // Right boundary spikes
    const rightSpikeCount = Math.ceil(GAME_HEIGHT / spikeHeight);
    for (let i = 0; i < rightSpikeCount; i++) {
      const y = i * spikeHeight;
      this.spikes.fillTriangle(
        GAME_WIDTH, y,                    // Top right point
        GAME_WIDTH, y + spikeHeight,      // Bottom right point
        GAME_WIDTH - spikeWidth, y + spikeHeight / 2 // Left point (tip of spike)
      );
    }

    // Top boundary spikes
    const topSpikeCount = Math.ceil(GAME_WIDTH / spikeHeight);
    for (let i = 0; i < topSpikeCount; i++) {
      const x = i * spikeHeight;
      this.spikes.fillTriangle(
        x, 0,                           // Left top point
        x + spikeHeight, 0,             // Right top point
        x + spikeHeight / 2, spikeWidth // Bottom point (tip of spike)
      );
    }

    // Create invisible collision rectangles for all spike boundaries
    // Left boundary
    this.leftSpikeCollider = this.add.rectangle(15, GAME_HEIGHT / 2, 30, GAME_HEIGHT);
    this.leftSpikeCollider.setDepth(10);
    this.physics.add.existing(this.leftSpikeCollider, true);
    this.physics.add.overlap(this.player, this.leftSpikeCollider, this.handleBoundaryCollision, null, this);

    // Right boundary
    this.rightSpikeCollider = this.add.rectangle(GAME_WIDTH - 15, GAME_HEIGHT / 2, 30, GAME_HEIGHT);
    this.rightSpikeCollider.setDepth(10);
    this.physics.add.existing(this.rightSpikeCollider, true);
    this.physics.add.overlap(this.player, this.rightSpikeCollider, this.handleBoundaryCollision, null, this);

    // Top boundary
    this.topSpikeCollider = this.add.rectangle(GAME_WIDTH / 2, 15, GAME_WIDTH, 30);
    this.topSpikeCollider.setDepth(10);
    this.physics.add.existing(this.topSpikeCollider, true);
    this.physics.add.overlap(this.player, this.topSpikeCollider, this.handleBoundaryCollision, null, this);
  }

  handleBoundaryCollision() {
    if (!this.levelComplete) {
      this.handleDeath();
    }
  }

  update(time, delta) {
    if (!this.levelComplete) {
      const speed = 300;

      // Delta time in seconds (delta is in milliseconds, so divide by 1000)
      const deltaSeconds = delta / 1000;

      this.isOnGround = this.player.body.touching.down || this.player.body.blocked.down;

      // Normal horizontal movement
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
        this.player.setVelocityY(-400);
        this.player.play("jump");
      }

      if (!this.isOnGround && this.player.anims.currentAnim.key !== "jump") {
        this.player.play("jump");
      }

      const distanceToDoor = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.door.x, this.door.y
      );

      // When player gets close to door BEFORE flip, make it disappear and flip the game
      if (distanceToDoor < 100 && !this.gameFlipped) {
        this.gameFlipped = true;

        // Make door disappear and move it off-screen temporarily
        this.door.setVisible(false);
        this.door.x = -1000; // Move off-screen to prevent any collision
        this.door.y = -1000;

        // Flip the entire game upside down
        this.cameras.main.setAngle(180);

        // Reset door state for later
        this.doorOpen = false;

        // Start moving spikes toward center
        this.spikesMoving = true;

        // Reposition door to center after flip
        this.time.delayedCall(500, () => {
          this.door.x = GAME_WIDTH / 2; // Center of the screen
          this.door.y = GAME_HEIGHT - 80; // Top of the ground platform when flipped
          this.door.setVisible(true);
          this.door.play("door_closed");
        });
      }

      // Door logic - ONLY works after game is flipped
      if (this.gameFlipped) {
        // Door opening logic
        if (distanceToDoor < 200 && !this.doorOpen) {
          this.doorOpen = true;
          this.door.play("door_opening");
          this.door.once("animationcomplete", () => {
            this.door.play("door_open");
          });
        }

        // Door completion logic
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
              // Reset death count when level is completed
              localStorage.removeItem('level5Deaths');
              this.onLevelComplete();
            });
          });
        }
      }

      // Move spikes toward center when game flips
      if (this.spikesMoving) {
        // Increased speed to match original - testing with higher value
        // If 180 was too slow, try 360 (double)
        const spikeSpeedPerSecond = 370; // pixels per second
        const spikeSpeed = spikeSpeedPerSecond * deltaSeconds;

        // Move left spikes to the right
        this.leftSpikeX += spikeSpeed;

        // Move right spikes to the left
        this.rightSpikeX -= spikeSpeed;

        // Redraw spikes at new positions
        this.spikes.clear();
        this.spikes.fillStyle(0x212121, 1);

        const spikeWidth = 30;
        const spikeHeight = 40;

        // Left boundary spikes (moving right)
        const leftSpikeCount = Math.ceil(GAME_HEIGHT / spikeHeight);
        for (let i = 0; i < leftSpikeCount; i++) {
          const y = i * spikeHeight;
          this.spikes.fillTriangle(
            this.leftSpikeX, y,
            this.leftSpikeX, y + spikeHeight,
            this.leftSpikeX + spikeWidth, y + spikeHeight / 2
          );
        }

        // Right boundary spikes (moving left)
        const rightSpikeCount = Math.ceil(GAME_HEIGHT / spikeHeight);
        for (let i = 0; i < rightSpikeCount; i++) {
          const y = i * spikeHeight;
          this.spikes.fillTriangle(
            this.rightSpikeX, y,
            this.rightSpikeX, y + spikeHeight,
            this.rightSpikeX - spikeWidth, y + spikeHeight / 2
          );
        }

        // Top boundary spikes (stay in place)
        const topSpikeCount = Math.ceil(GAME_WIDTH / spikeHeight);
        for (let i = 0; i < topSpikeCount; i++) {
          const x = i * spikeHeight;
          this.spikes.fillTriangle(
            x, 0,
            x + spikeHeight, 0,
            x + spikeHeight / 2, spikeWidth
          );
        }

        // Update collider positions
        this.leftSpikeCollider.x = this.leftSpikeX + 15;
        this.rightSpikeCollider.x = this.rightSpikeX - 15;
      }
    }

    // Check if player falls off the world (death)
    if (this.player.y >= GAME_HEIGHT && !this.levelComplete) {
      this.handleDeath();
    }

    // Check if player touches any boundary (death zone)
    // Left boundary - check based on current spike position
    if (this.spikesMoving) {
      if (this.player.x <= this.leftSpikeX + 30 && !this.levelComplete) {
        this.handleDeath();
      }

      if (this.player.x >= this.rightSpikeX - 30 && !this.levelComplete) {
        this.handleDeath();
      }
    } else {
      if (this.player.x <= 10 && !this.levelComplete) {
        this.handleDeath();
      }

      if (this.player.x >= GAME_WIDTH - 10 && !this.levelComplete) {
        this.handleDeath();
      }
    }

    if (this.player.y <= 10 && !this.levelComplete) {
      this.handleDeath();
    }
  }

  handleDeath() {
    this.levelComplete = true;

    // Increment death count
    const currentDeaths = parseInt(localStorage.getItem('level5Deaths') || '0');
    localStorage.setItem('level5Deaths', (currentDeaths + 1).toString());

    this.player.play("death");
    this.player.body.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);

    // Restart level after death animation
    this.player.once("animationcomplete", () => {
      this.scene.restart();
    });
  }

  createPlatforms() {
    // Add Level 5 specific platforms here
  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level6');
    // Go to Level 6
    this.scene.start("Level6");
  }
}

const Level5 = () => {
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
        scene: [Level5Scene],
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

export default Level5;
