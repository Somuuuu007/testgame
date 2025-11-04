import { useEffect } from "react";
import Phaser from "phaser";
import { BaseScene } from "./BaseScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class Level17Scene extends BaseScene {
  constructor() {
    super("Level17");
    this.backgroundKey = "background17";
    this.groundPlatformHeight = 180; // Smaller height for this level
    this.platformColor = 0x212121; // Dark color for this level
    this.levelWidth = GAME_WIDTH ; // Single screen width for this level
    this.doorX = GAME_WIDTH - 250; // Door near the end
  }

  loadLevelAssets() {
    // Load Level 17 specific background
    this.load.image("background17", "/background 1/orig_big17.png");

  }

  create() {
    super.create();
    this.player.x = 250;
    this.player.y = GAME_HEIGHT - 300;

    // Move the default door (from BaseScene) to the left side and hide it initially
    this.door.x = 150 / 2;
    this.door.y = GAME_HEIGHT - 180;
    this.door.setAlpha(0); // Hidden initially

    // Create a visible but non-functional door on the right side
    const rightDoorX = GAME_WIDTH - 250;
    const rightDoorY = GAME_HEIGHT - 180;
    this.rightDoor = this.add.sprite(rightDoorX, rightDoorY, "door_17");
    this.rightDoor.setScale(0.3);
    this.rightDoor.setOrigin(0.5, 1);
    this.rightDoor.setDepth(0);
    this.rightDoor.play("door_closed");

    // Track rotation state
    this.rotationStarted = false;
    this.rotationComplete = false;
    this.hasCollidedWithWall = false; // Track if player has already collided
  }

  update() {
    super.update();

    // Start rotating the left wall clockwise when player reaches half of screen
    if (!this.rotationStarted && !this.levelComplete && this.player.x >= GAME_WIDTH / 2) {
      this.rotationStarted = true;

      // Remove wall from platforms so it doesn't block player during rotation
      // But the polygon collision will still kill player if they touch it
      this.platforms.remove(this.leftWall);
      this.physics.world.disable(this.leftWall);

      // Rotate clockwise (positive angle) - 180 degrees rotation
      this.tweens.add({
        targets: this.leftWall,
        angle: 180,
        duration: 4000, // 4 seconds for full rotation
        ease: 'Linear',
        onComplete: () => {
          this.rotationComplete = true;
        }
      });
    }

    // Gradually reveal door as wall rotates away from it
    if (this.rotationStarted && !this.rotationComplete) {
      // Calculate if wall is still blocking the door based on rotation angle
      // Door is at x = 75 (150/2), wall rotates from 0 to 180 degrees
      // Door should start appearing around 45 degrees and be fully visible by 90 degrees
      const rotationProgress = this.leftWall.angle;

      if (rotationProgress >= 45) {
        // Map rotation from 45-90 degrees to alpha 0-1
        const doorAlpha = Phaser.Math.Clamp((rotationProgress - 45) / 45, 0, 1);
        this.door.setAlpha(doorAlpha);
      } else {
        this.door.setAlpha(0);
      }
    }

    // Check for collision with rotating wall during rotation
    if (this.rotationStarted && !this.rotationComplete && !this.levelComplete && !this.hasCollidedWithWall) {
      // Get the wall's four corners after rotation
      const wallWidth = 150;
      const wallHeight = Math.sqrt(Math.pow(GAME_WIDTH, 2) + Math.pow(GAME_HEIGHT, 2)) * 1.5;
      const wallAngle = Phaser.Math.DegToRad(this.leftWall.angle);

      // Wall origin is at (1, 0.65) - bottom right corner is at origin
      const originX = this.leftWall.x;
      const originY = this.leftWall.y;

      // Calculate the four corners of the rotated wall
      // Corner positions relative to origin (which is at right edge, 65% down)
      const corners = [
        { x: 0, y: -wallHeight * 0.65 }, // top-right
        { x: -wallWidth, y: -wallHeight * 0.65 }, // top-left
        { x: -wallWidth, y: wallHeight * 0.35 }, // bottom-left
        { x: 0, y: wallHeight * 0.35 } // bottom-right
      ];

      // Rotate corners around origin and convert to world coordinates
      const rotatedCorners = corners.map(corner => {
        const rotatedX = corner.x * Math.cos(wallAngle) - corner.y * Math.sin(wallAngle);
        const rotatedY = corner.x * Math.sin(wallAngle) + corner.y * Math.cos(wallAngle);
        return new Phaser.Geom.Point(originX + rotatedX, originY + rotatedY);
      });

      // Create polygon from rotated corners
      const wallPolygon = new Phaser.Geom.Polygon(rotatedCorners);

      // Check if player center point is inside the wall polygon
      const playerPoint = new Phaser.Geom.Point(this.player.x, this.player.y);

      if (wallPolygon.contains(playerPoint.x, playerPoint.y)) {
        this.hasCollidedWithWall = true;
        this.handleWallCollision();
      }
    }
  }

  handleWallCollision() {
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
    const boundaryWidth = 150;

    // Calculate diagonal length to cover entire screen when rotated
    // Multiply by 1.5 to ensure full coverage during rotation
    const diagonalLength = Math.sqrt(Math.pow(GAME_WIDTH, 2) + Math.pow(GAME_HEIGHT, 2)) * 1.5;

    // Left boundary wall - will rotate clockwise
    // Set rotation origin lower than middle for challenging gameplay
    this.leftWall = this.add.rectangle(
      boundaryWidth / 2,
      GAME_HEIGHT / 2,
      boundaryWidth,
      diagonalLength, // Use extended diagonal length
      this.platformColor
    );

    // Set origin FIRST before adding physics
    this.leftWall.setOrigin(1, 0.65);
    this.leftWall.x = boundaryWidth;
    this.leftWall.y = GAME_HEIGHT * 0.65;

    // Add physics and make it static initially
    this.physics.add.existing(this.leftWall, true); // Static body
    this.platforms.add(this.leftWall);

    // Right boundary wall
    this.rightWall = this.createPlatform(
      GAME_WIDTH - boundaryWidth / 2,
      GAME_HEIGHT / 2,
      boundaryWidth,
      GAME_HEIGHT
    );

    // Top ceiling platform (same dimensions as ground)
    this.topCeiling = this.createPlatform(
      GAME_WIDTH / 2,
      180 / 2,
      GAME_WIDTH,
      180
    );
  }

  onLevelComplete() {
    // Save next level to localStorage
    localStorage.setItem('currentLevel', 'Level18');
    // Go to Level 18
    this.scene.start("Level18");
  }
}

const Level17 = () => {
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
        scene: [Level17Scene],
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

export default Level17;
