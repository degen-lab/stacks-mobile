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
  DARK_SCENE: {
    // surface-tertiary (#181818) → surface-primary (#242220) — matches design system tokens
    BACKGROUND_COLORS: ["#181818", "#242220"] as const,
    HUD_SCORE: "#F5EFE7",
    HUD_HELPER: "#C8BDAF",
    PLATFORM_TOP: "#484747",
    PLATFORM_SIDE: "#4A515C",
    PLATFORM_MARKER: "#FF4A3D",
    PANEL_BG: "#26221F",
    PANEL_BORDER: "#4F5863",
    CARD_BG: "#302A26",
    CARD_BORDER: "#5B6470",
    POWER_UP_BG: "#2D3138",
    POWER_UP_BG_ACTIVE: "#434B55",
    POWER_UP_BORDER: "#69727D",
    POWER_UP_LABEL: "#D5CBC0",
    POWER_UP_STATUS: "#FFB15C",
    POWER_UP_GLOW: [
      "rgba(255, 152, 53, 0.24)",
      "rgba(255, 152, 53, 0)",
    ] as const,
  },
} as const;

// Screen dimensions
export const SCREEN_WIDTH = Dimensions.get("window").width;
export const SCREEN_HEIGHT = Dimensions.get("window").height;
