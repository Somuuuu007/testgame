// Game dimensions
// Both width and height are now dynamic based on device screen
export const GAME_WIDTH = window.innerWidth;  // Dynamic width based on device screen
export const GAME_HEIGHT = window.innerHeight; // Dynamic height based on device screen

// Export as default config object
export const gameConfig = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
};

export default gameConfig;
