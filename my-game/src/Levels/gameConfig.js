// Game dimensions
// Width is now dynamic based on device screen
// Height is fixed to maintain consistent vertical gameplay
export const GAME_WIDTH = window.innerWidth;  // Dynamic width based on device screen
export const GAME_HEIGHT = 740; // Fixed height - all levels designed for this height

// Export as default config object
export const gameConfig = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
};

export default gameConfig;
