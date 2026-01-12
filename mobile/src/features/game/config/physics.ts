/**
 * Physics configuration for the Bridge Game
 * Contains all physics-related constants including gravity, speeds, and movement parameters
 */

export const PHYSICS_CONFIG = {
  // Movement speeds (reduced by 20% for slower gameplay)
  GROW_SPEED: 320, // pixels per second
  ROTATE_SPEED: 192, // degrees per second
  WALK_SPEED: 304, // pixels per second
  GRAVITY: 720, // pixels per second squared
  FALL_ROTATION: 200, // degrees per second when falling

  // Camera & Scroll
  SCROLL_SPEED: 9.6, // camera scroll velocity
  SHAKE_DECAY: 4.0, // camera shake decay rate

  // Particle physics
  PARTICLE_GRAVITY: 256, // pixels per second squared for particles
  PARTICLE_LIFETIME_DECAY: 1.28, // decay rate per second
  PERFECT_TEXT_GRAVITY: 336, // pixels per second squared for "PERFECT" text
  PERFECT_TEXT_LIFETIME_DECAY: 0.64, // decay rate per second
  PERFECT_TEXT_FRICTION: 0.99, // horizontal velocity friction

  // Platform movement
  PLATFORM_MOVE_VELOCITY: 96, // pixels per second
  PLATFORM_MOVE_CHANCE: 0.4, // 40% chance to move
  PLATFORM_MOVE_MIN_RANGE: 40, // pixels
  PLATFORM_MOVE_MAX_RANGE: 80, // pixels
} as const;
