import { useEffect } from "react";
import Phaser from "phaser";
import { Level1Scene } from "./Level1";
import { Level2Scene } from "./Level2";
import { Level3Scene } from "./Level3";
import { Level4Scene } from "./Level4";
import { Level5Scene } from "./Level5";
import { Level6Scene } from "./Level6";
import { Level7Scene } from "./Level7";
import { Level8Scene } from "./Level8";
import { Level9Scene } from "./Level9";
import { Level10Scene } from "./Level10";
import { Level11Scene } from "./Level11";
import { Level12Scene } from "./Level12";
import { Level13Scene } from "./Level13";
import { Level14Scene } from "./Level14";
import { Level15Scene } from "./Level15";
import { Level16Scene } from "./Level16";
import { Level17Scene } from "./Level17";
import { Level18Scene } from "./Level18";
import { Level19Scene } from "./Level19";
import { Level20Scene } from "./Level20";
import { GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

const Game = () => {
  useEffect(() => {
    let game;

    const createGame = () => {
      // Get current level from localStorage, default to Level1
      const currentLevel = localStorage.getItem('currentLevel') || 'Level1';

      const config = {
        type: Phaser.AUTO,
        width: GAME_WIDTH, // Dynamic width from gameConfig
        height: GAME_HEIGHT,
        parent: "phaser-container",
        scale: {
          mode: Phaser.Scale.NONE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { y: 1000 },
            debug: false,
          },
        },
        scene: [
          Level1Scene, Level2Scene, Level3Scene, Level4Scene, Level5Scene
        ],
      };

      game = new Phaser.Game(config);

      // Start the saved level
      game.scene.start(currentLevel);
    };

    createGame();

    return () => {
      if (game) game.destroy(true);
    };
  }, []);

  return <div id="phaser-container"></div>;
};

export default Game;
