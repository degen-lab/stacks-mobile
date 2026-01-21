/**
 * Visual configuration for the Bridge Game
 * Contains all rendering-related constants including dimensions, colors, and animations
 */

import { Dimensions } from "react-native";

export const VISUAL_CONFIG = {
  // Canvas dimensions
  CANVAS_H: 500,
  PLATFORM_H: 275,

  // Entity sizes
  HERO_SIZE: 40,
  STICK_WIDTH: 6,

  // Stick visual blocks
  STICK_BLOCK_HEIGHT: 8,
  STICK_BLOCK_GAP: 1,

  // Platform generation
  PLATFORM_MIN_GAP: 40,
  PLATFORM_MAX_GAP: 200,
  PLATFORM_MIN_WIDTH: 50,
  PLATFORM_MAX_WIDTH: 100,
  PLATFORM_START_WIDTH: 80,
  MAX_BRIDGE_LENGTH: 800, // pixels (80% of typical screen width)

  // Platform spawn animation
  PLATFORM_SPAWN_MS: 100, // spawn animation duration
  PLATFORM_SPAWN_OFFSET: 40, // vertical offset during spawn

  // Particle effects
  PARTICLE_COUNT: 14, // particles per burst
  PARTICLE_MIN_SIZE: 5,
  PARTICLE_MAX_SIZE: 11, // 5 + 6

  // Tolerances
  PERFECT_TOLERANCE: 3,
  HERO_PLATFORM_INSET: 6,
  HERO_MIN_LANDING_DISTANCE: 16,

  // Colors
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
} as const;

// Screen dimensions
export const SCREEN_WIDTH = Dimensions.get("window").width;
export const SCREEN_HEIGHT = Dimensions.get("window").height;
