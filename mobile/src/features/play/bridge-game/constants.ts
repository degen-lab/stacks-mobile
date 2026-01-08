import { Dimensions } from "react-native";

export const BRIDGE_CONFIG = {
  CANVAS_H: 500,
  PLATFORM_H: 275,
  HERO_SIZE: 40,
  STICK_WIDTH: 6,
  GROW_SPEED: 480,
  ROTATE_SPEED: 300,
  WALK_SPEED: 480,
  GRAVITY: 1200,
  FALL_ROTATION: 250,

  // Camera & Scroll
  SCROLL_SPEED: 15,
  SHAKE_DECAY: 5.0,

  PERFECT_TOLERANCE: 3,
  HERO_PLATFORM_INSET: 6,
  HERO_MIN_LANDING_DISTANCE: 16,

  // Platform generation
  PLATFORM_MIN_GAP: 40,
  PLATFORM_MAX_GAP: 180,
  PLATFORM_MIN_WIDTH: 50,
  PLATFORM_MAX_WIDTH: 100,
  PLATFORM_START_WIDTH: 80,
  MAX_BRIDGE_LENGTH: 800, // pixels (80% of typical screen width)

  // Platform movement
  PLATFORM_MOVE_VELOCITY: 120, // pixels per second
  PLATFORM_MOVE_CHANCE: 0.4, // 40% chance to move
  PLATFORM_MOVE_MIN_RANGE: 40, // pixels
  PLATFORM_MOVE_MAX_RANGE: 80, // pixels

  MIN_BRIDGE_DURATION: 50, // milliseconds - minimum human reaction time
  MAX_PERFECT_RATE: 0.85, // 85% - if more than this, suspicious
  MIN_TIME_BETWEEN_MOVES: 100, // milliseconds - minimum time between moves
  MAX_CONSECUTIVE_PERFECT: 10, // maximum consecutive perfect landings
  MIN_VARIANCE_IN_DURATION: 20, // minimum variance in bridge durations (ms)

  COLORS: {
    BRAND: "#FF6A1A",
    BITCOIN: "#FD9D41",
    BRAND_DARK: "#E4570F",
    BRAND_SOFT: "#FFE6D5",
    BG_TOP: "#F7F4F0",
    BG_BOT: "#E6DFD6",
    PERFECT: "#10B981",
    TEXT_MAIN: "#1F2937",
    TEXT_SUB: "#6B7280",
    PLATFORM_TOP: "#FFFFFF",
    PLATFORM_SIDE: "#E2E8F0",
  },
};

export const SCORE_MULTIPLIER = 10;

export const SCREEN_WIDTH = Dimensions.get("window").width;
export const SCREEN_HEIGHT = Dimensions.get("window").height;
