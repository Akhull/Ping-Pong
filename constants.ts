export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 768;

// Game physics
export const PADDLE_WIDTH = 20;
export const INITIAL_PADDLE_HEIGHT = 120;
export const BALL_RADIUS = 10;
export const INITIAL_BALL_SPEED = 5;
export const MAX_BALL_SPEED = 25;
export const LERP_FACTOR = 0.2; // For smooth paddle interpolation

// Player Stats
export const INITIAL_ATTACK = 1.05; // Multiplier for ball speed on hit
export const INITIAL_CRIT_CHANCE = 0; // 0% chance
export const INITIAL_CRIT_FORCE = 0.25; // 25% bonus speed on crit
export const INITIAL_MOVESPEED = 400; // pixels per second
export const INITIAL_LUCK = 0; // 0% chance

// Gameplay rules
export const WINNING_SCORE = 100;

// Augment specific constants
export const AUGMENT_PADDLE_HEIGHT_STACK_INCREASE = 25;
export const AUGMENT_COMMON_PADDLE_HEIGHT_INCREASE = 10;
export const AUGMENT_UNCOMMON_PADDLE_WIDTH_INCREASE = 5;
export const AUGMENT_FIREBALL_COOLDOWN_MS = 20000;
export const AUGMENT_SHRINK_COOLDOWN_MS = 35000;
export const AUGMENT_SHRINK_DURATION_MS = 5000;
export const AUGMENT_BLACK_HOLE_COOLDOWN_MS = 40000;
export const AUGMENT_BLACK_HOLE_DURATION_MS = 7000;
export const AUGMENT_WHITE_HOLE_COOLDOWN_MS = 40000;
export const AUGMENT_WHITE_HOLE_DURATION_MS = 7000;
export const AUGMENT_INVERT_CONTROLS_COOLDOWN_MS = 40000;
export const AUGMENT_INVERT_CONTROLS_DURATION_MS = 3000;
export const AUGMENT_VAC_BANN_COOLDOWN_MS = 45000;
export const AUGMENT_BANNED_DURATION_MS = 7000;
export const AUGMENT_AIMBOT_COOLDOWN_MS = 45000;
export const AIMBOT_SPEED_MULTIPLIER = 5;
export const MULTI_CLONE_GAP = 30;

// Exodia Laser
export const EXODIA_LASER_COOLDOWN_MS = 8000;
export const EXODIA_LASER_CHARGE_TIME_MS = 1000;
export const EXODIA_LASER_DURATION_MS = 3000;
export const EXODIA_LASER_HEIGHT = 60;
export const EXODIA_LASER_BALL_SPEED_BOOST = 30; // Corresponds to 300 display speed

// Defensive Wall Augments
export const WALL_COOLDOWN_MS = 15000;
export const RARE_WALL_WIDTH = 10;
export const RARE_WALL_HEIGHT = 60;
export const EPIC_WALL_WIDTH = 10;
export const EPIC_WALL_HEIGHT = 80;
export const LEGENDARY_WALL_WIDTH = 10;
export const LEGENDARY_WALL_HEIGHT = 100;

// Network
export const TICK_RATE = 20; // 20 updates per second
export const NETWORK_UPDATE_INTERVAL = 1000 / TICK_RATE;