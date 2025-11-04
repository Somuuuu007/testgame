import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

export class BaseScene extends Phaser.Scene {
  preload() {
    this.load.spritesheet("Idle", "/Idle.png", {
      frameWidth: 48,
      frameHeight: 64,
    });
    this.load.spritesheet("Run", "/Walk.png", {
      frameWidth: 48,
      frameHeight: 64,
    });
    this.load.spritesheet("Jump", "/Jump.png", {
      frameWidth: 48,
      frameHeight: 64,
    });
    this.load.spritesheet("Death", "/Death.png", {
      frameWidth: 48,
      frameHeight: 64,
    });
    this.load.spritesheet("WalkUp", "/walk_Up.png", {
      frameWidth: 48,
      frameHeight: 64,
    });

    // Load door sprites
    for (let i = 0; i <= 40; i++) {
      const frameNum = i.toString().padStart(2, '0');
      this.load.image(`door_${i}`, `/Door/sprite_${frameNum}.png`);
    }

    // Load level-specific assets (override in child class if needed)
    this.loadLevelAssets();
  }

  loadLevelAssets() {
    // Override this in child classes to load level-specific assets
  }

  create() {
    // Save current level to localStorage
    localStorage.setItem('currentLevel', this.scene.key);

    // Get level width (can be overridden in child class)
    const levelWidth = this.levelWidth || 2400;

    // Add background if specified - covers entire game world
    if (this.backgroundKey) {
      const bg = this.add.image(levelWidth / 2, GAME_HEIGHT / 2, this.backgroundKey);
      bg.setDisplaySize(levelWidth, GAME_HEIGHT);
      bg.setScrollFactor(1); // Background scrolls with camera
    } else {
      this.cameras.main.setBackgroundColor('#1a1a1a');
    }

    // Set world bounds
    this.physics.world.setBounds(0, 0, levelWidth, GAME_HEIGHT);

    // Create platforms group
    this.platforms = this.physics.add.staticGroup();

    // Helper function to create platform
    this.createPlatform = (x, y, width, height) => {
      const color = this.platformColor || 0x000000;
      const platform = this.add.rectangle(x, y, width, height, color);
      this.physics.add.existing(platform, true);
      this.platforms.add(platform);
      return platform;
    };

    // Ground platform - can be overridden by setting groundPlatformWidth/Height in child class
    // Only create if groundPlatformHeight is not explicitly set to null
    if (this.groundPlatformHeight !== null) {
      const groundWidth = this.groundPlatformWidth || levelWidth;
      const groundHeight = this.groundPlatformHeight || 150;
      this.createPlatform(groundWidth / 2, GAME_HEIGHT - groundHeight / 2, groundWidth, groundHeight);
    }

    // Create level-specific platforms
    this.createPlatforms();

    // Create player
    this.player = this.physics.add.sprite(100, GAME_HEIGHT - 200, "Idle");
    this.player.setScale(2);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 28, true);
    this.player.setDepth(10);

    // Create door at the end of level
    const doorX = this.doorX || levelWidth - 200;
    const doorY = GAME_HEIGHT - (this.groundPlatformHeight || 150);
    this.door = this.add.sprite(doorX, doorY, "door_17");
    this.door.setScale(0.3);
    this.door.setOrigin(0.5, 1);
    this.door.setDepth(0);
    this.door.play("door_closed");

    // Camera follows player
    this.cameras.main.setBounds(0, 0, levelWidth, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Player collides with platforms
    this.physics.add.collider(this.player, this.platforms);

    // Track door state
    this.doorOpen = false;
    this.levelComplete = false;

    // Create animations
    this.createAnimations();

    // Start with idle animation
    this.player.play("idle");
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Add WASD keys for dual controls
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    // Track if player is on ground
    this.isOnGround = false;
  }

  createPlatforms() {
    // Override this in child classes to add level-specific platforms
  }

  createAnimations() {
    // Only create animations if they don't exist
    if (!this.anims.exists("idle")) {
      this.anims.create({
        key: "idle",
        frames: this.anims.generateFrameNumbers("Idle", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: "run",
        frames: this.anims.generateFrameNumbers("Run", { start: 0, end: 7 }),
        frameRate: 20,
        repeat: -1,
      });

      this.anims.create({
        key: "jump",
        frames: this.anims.generateFrameNumbers("Jump", { start: 0, end: 1 }),
        frameRate: 5,
        repeat: 0,
      });

      this.anims.create({
        key: "death",
        frames: this.anims.generateFrameNumbers("Death", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: 0,
      });

      this.anims.create({
        key: "walkup",
        frames: this.anims.generateFrameNumbers("WalkUp", { start: 0, end: 7 }),
        frameRate: 15,
        repeat: 0,
      });

      this.anims.create({
        key: "door_closed",
        frames: [{ key: "door_17" }],
        frameRate: 10,
      });

      this.anims.create({
        key: "door_opening",
        frames: Array.from({ length: 24 }, (_, i) => ({ key: `door_${i + 17}` })),
        frameRate: 20,
        repeat: 0,
      });

      this.anims.create({
        key: "door_open",
        frames: [{ key: "door_40" }],
        frameRate: 10,
      });
    }
  }

  update() {
    if (this.levelComplete) {
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

    // Jumping - arrow keys, space, or W key
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

  onLevelComplete() {
    // Override this in child classes to go to next level
    this.scene.restart();
  }
}
