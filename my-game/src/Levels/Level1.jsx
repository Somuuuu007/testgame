import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level1Scene extends BaseScene {
  constructor() {
    super("Level1");
    this.backgroundKey = "background1";
    this.groundPlatformHeight = 80; // Smaller height for this level
    this.platformColor = 0x000000; // Dark blue color for this level
    this.levelWidth = GAME_WIDTH; // Single screen width for this level
    this.doorX = GAME_WIDTH - 150; // Door near the end
  }

  loadLevelAssets() {
    // Load Level 1 specific background - using the complete image
    this.load.image("background1", "/background 1/orig_big.png");
    // Load rock sprite
    this.load.image("rock", "/rock.png");
  }

  create() {
    super.create();

    // Add rock above the ground platform with physics
    this.rock = this.physics.add.sprite(GAME_WIDTH / 3, GAME_HEIGHT - 95, "rock");
    this.rock.setScale(2);
    this.rock.setDepth(5);
    this.rock.body.setAllowGravity(false);
    this.rock.body.setImmovable(true);

    // Add overlap detection between player and rock
    this.physics.add.overlap(this.player, this.rock, this.checkRockCollision, null, this);

    // Track if rock should follow player
    this.rockActivated = false;
  }

  checkRockCollision(player, rock) {
    // Only kill player if they are moving left (backing into the rock)
    if (player.body.velocity.x < 0 && !this.levelComplete) {
      this.levelComplete = true;
      player.play("death");
      player.body.setVelocity(0, 0);
      player.body.setAllowGravity(false);

      // Restart level after death animation
      player.once("animationcomplete", () => {
        this.scene.restart();
      });
    }
  }

  update(time, delta) {
    super.update();

    // Check if player has passed the rock by 50 pixels
    if (!this.rockActivated && this.player.x > this.rock.x + 60) {
      this.rockActivated = true;
    }

    // If rock is activated, make it follow the player
    if (this.rockActivated) {
      // Speed in pixels per second (consistent across all frame rates)
      // Set close to player speed (300) to maintain constant gap
      const speed = 300;

      // Rock moves horizontally towards player only when moving right and player is ahead by 60px
      if (this.player.body.velocity.x > 0 && this.player.x > this.rock.x + 60) {
        // Player is moving right and is ahead, rock follows
        // Use delta (time since last frame in ms) to make movement frame-rate independent
        this.rock.x += (speed * delta) / 1000;
      }
      // When player stops or moves left, rock stops
    }
  }

  createPlatforms() {
    // Add Level 1 specific platforms here
  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level4');
    // Go to Level 4 (skipping Level 2 and 3)
    this.scene.start("Level2");
  }
}

const Level1 = () => {
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
        scene: [Level1Scene],
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

export default Level1;
