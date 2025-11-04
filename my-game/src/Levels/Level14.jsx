import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level14Scene extends BaseScene {
  constructor() {
    super("Level14");
    this.backgroundKey = "background14";
    this.groundPlatformHeight = 20; // Smaller height for this level
    this.platformColor = 0x212121; // Dark blue color for this level
    this.levelWidth = GAME_WIDTH; // Single screen width for this level
    this.doorX = GAME_WIDTH - 150; // Door near the end
  }

  loadLevelAssets() {
    // Load Level 14 specific background
    this.load.image("background14", "/background 1/orig_big14.png");
    // Load spike image
    this.load.image("spike", "/Spike.png");
  }

  create() {
    super.create();

    // Move player to spawn in top left corner room
    this.player.x = 100;
    this.player.y = 100;

    // Track spike trigger state
    this.wallSpikesTriggered = false;
    this.groundSpikesTriggered = false;
    this.groundSpikes2Triggered = false;
  }

  createPlatforms() {
    // Create a room in the top left corner
    const roomWidth = 250;
    const roomX = 100;
    const roomY = 100;
    const floorY = roomY + 75;

    // Floor of the room
    this.createPlatform(roomX, floorY, roomWidth, 20);

    // Right wall (moved to the right with gap, extends to top of screen)
    const wallHeight = roomY + 75 + 50; // Height from top to below floor
    this.createPlatform(roomX + 210, wallHeight / 2, 20, wallHeight);

    // Small platform at the right end of the floor (touching it)
    const smallPlatformWidth = 80;
    const smallPlatformX = roomX + (roomWidth / 2) - smallPlatformWidth / 2;
    this.createPlatform(smallPlatformX, floorY - 20, smallPlatformWidth, 45);

    // Create 2 spikes at bottom left of right wall (invisible by default)
    const wallX = roomX + 230;
    const wallBottomY = floorY;
    const spikeSpacing = 15;

    this.wallSpike1 = this.add.image(wallX - 38, wallBottomY + 10, "spike");
    this.wallSpike1.setOrigin(0.5, 0.5);
    this.wallSpike1.setAngle(-90); // Point left
    this.wallSpike1.setDepth(11);
    this.wallSpike1.setAlpha(0); // Invisible by default

    this.wallSpike2 = this.add.image(wallX - 38, wallBottomY + 10 + spikeSpacing, "spike");
    this.wallSpike2.setOrigin(0.5, 0.5);
    this.wallSpike2.setAngle(-90); // Point left
    this.wallSpike2.setDepth(11);
    this.wallSpike2.setAlpha(0); // Invisible by default

    // Create collision rectangles for the spikes
    this.wallSpikeCollider1 = this.add.rectangle(wallX - 38, wallBottomY + 10, 40, 40);
    this.wallSpikeCollider1.setDepth(10);
    this.physics.add.existing(this.wallSpikeCollider1, true);

    this.wallSpikeCollider2 = this.add.rectangle(wallX - 38, wallBottomY + 10 + spikeSpacing, 40, 40);
    this.wallSpikeCollider2.setDepth(10);
    this.physics.add.existing(this.wallSpikeCollider2, true);

    // Create 4 hidden spikes at 1/4 distance of ground platform
    const groundY = GAME_HEIGHT - this.groundPlatformHeight;
    const groundSpikeX = GAME_WIDTH / 4;
    const groundSpikeSpacing = 20;

    this.groundSpikes = [];
    this.groundSpikeColliders = [];

    for (let i = 0; i < 4; i++) {
      const spike = this.add.image(groundSpikeX + (i * groundSpikeSpacing), groundY, "spike");
      spike.setOrigin(0.5, 1);
      spike.setAngle(0); // Point up
      spike.setDepth(11);
      spike.setAlpha(0); // Invisible by default
      this.groundSpikes.push(spike);

      const collider = this.add.rectangle(groundSpikeX + (i * groundSpikeSpacing), groundY - 10, 15, 15);
      collider.setDepth(10);
      this.physics.add.existing(collider, true);
      this.groundSpikeColliders.push(collider);
    }

    // Create 4 hidden spikes at 3/4 distance of ground platform
    const groundSpike2X = (GAME_WIDTH * 3) / 4;

    this.groundSpikes2 = [];
    this.groundSpikeColliders2 = [];

    for (let i = 0; i < 4; i++) {
      const spike = this.add.image(groundSpike2X + (i * groundSpikeSpacing), groundY, "spike");
      spike.setOrigin(0.5, 1);
      spike.setAngle(0); // Point up
      spike.setDepth(11);
      spike.setAlpha(0); // Invisible by default
      this.groundSpikes2.push(spike);

      const collider = this.add.rectangle(groundSpike2X + (i * groundSpikeSpacing), groundY - 10, 15, 15);
      collider.setDepth(10);
      this.physics.add.existing(collider, true);
      this.groundSpikeColliders2.push(collider);
    }

  }

  update() {
    super.update();

    // Check if player touches the wall spike area to make them visible
    if (!this.wallSpikesTriggered && !this.levelComplete) {
      const distanceToSpike1 = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.wallSpikeCollider1.x, this.wallSpikeCollider1.y
      );

      const distanceToSpike2 = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.wallSpikeCollider2.x, this.wallSpikeCollider2.y
      );

      // Trigger when player is close to either spike
      if (distanceToSpike1 < 40 || distanceToSpike2 < 40) {
        this.wallSpikesTriggered = true;

        // Make spikes visible
        this.wallSpike1.setAlpha(1);
        this.wallSpike2.setAlpha(1);

        // Add collision detection
        this.physics.add.overlap(this.player, this.wallSpikeCollider1, this.handleWallSpikeCollision, null, this);
        this.physics.add.overlap(this.player, this.wallSpikeCollider2, this.handleWallSpikeCollision, null, this);
      }
    }

    // Check if player is on ground and triggers ground spikes
    if (!this.groundSpikesTriggered && !this.levelComplete) {
      const isOnGround = this.player.body.touching.down || this.player.body.blocked.down;
      const groundY = GAME_HEIGHT - this.groundPlatformHeight;

      // Check if player is on the ground platform
      if (isOnGround && this.player.y > groundY - 100) {
        // Check distance to the center of the spike cluster
        const groundSpikeX = GAME_WIDTH / 4;
        const distance = Math.abs(this.player.x - groundSpikeX);

        // Trigger when player is within 10px of the spike area
        if (distance < 50) {
          this.groundSpikesTriggered = true;

          // Make all spikes visible
          this.groundSpikes.forEach(spike => spike.setAlpha(1));

          // Add collision detection for all spikes
          this.groundSpikeColliders.forEach(collider => {
            this.physics.add.overlap(this.player, collider, this.handleGroundSpikeCollision, null, this);
          });
        }
      }
    }

    // Check if player is on ground and triggers second set of ground spikes
    if (!this.groundSpikes2Triggered && !this.levelComplete) {
      const isOnGround = this.player.body.touching.down || this.player.body.blocked.down;
      const groundY = GAME_HEIGHT - this.groundPlatformHeight;

      // Check if player is on the ground platform
      if (isOnGround && this.player.y > groundY - 100) {
        // Check distance to the center of the spike cluster
        const groundSpike2X = (GAME_WIDTH * 3) / 4;
        const distance = Math.abs(this.player.x - groundSpike2X);

        // Trigger when player is within 50px of the spike area
        if (distance < 50) {
          this.groundSpikes2Triggered = true;

          // Make all spikes visible
          this.groundSpikes2.forEach(spike => spike.setAlpha(1));

          // Add collision detection for all spikes
          this.groundSpikeColliders2.forEach(collider => {
            this.physics.add.overlap(this.player, collider, this.handleGroundSpikeCollision, null, this);
          });
        }
      }
    }
  }

  handleGroundSpikeCollision() {
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

  handleWallSpikeCollision() {
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
    localStorage.setItem('currentLevel', 'Level15');
    // Go to Level 15
    this.scene.start("Level15");
  }
}

const Level14 = () => {
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
        scene: [Level14Scene],
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

export default Level14;
