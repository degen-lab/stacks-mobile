/**
 * Gameplay configuration for the Bridge Game
 * Contains all gameplay-related constants including scoring, power-ups, and anti-cheat
 */

export const GAMEPLAY_CONFIG = {
  // Scoring
  SCORE_MULTIPLIER: 10,

  // Power-ups
  GHOST_DURATION_MS: 30000, // 30 seconds
  GHOST_TIMER_UPDATE_INTERVAL: 100, // update timer every 100ms

  // Anti-cheat validation (backend comparison)
  MIN_BRIDGE_DURATION: 50, // milliseconds - minimum human reaction time
  MAX_PERFECT_RATE: 0.85, // 85% - if more than this, suspicious
  MIN_TIME_BETWEEN_MOVES: 100, // milliseconds - minimum time between moves
  MAX_CONSECUTIVE_PERFECT: 10, // maximum consecutive perfect landings
  MIN_VARIANCE_IN_DURATION: 20, // minimum variance in bridge durations (ms)
} as const;
