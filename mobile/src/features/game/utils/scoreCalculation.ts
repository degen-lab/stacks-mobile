import { GAMEPLAY_CONFIG } from "../config";

/**
 * Calculates the display score from a base score
 * @param baseScore The raw score (number of successful landings)
 * @returns The display score (baseScore * multiplier)
 */
export function getDisplayScore(baseScore: number): number {
  return baseScore * GAMEPLAY_CONFIG.SCORE_MULTIPLIER;
}

/**
 * Calculates the base score from a display score
 * @param displayScore The display score
 * @returns The base score (displayScore / multiplier)
 */
export function getBaseScore(displayScore: number): number {
  return Math.floor(displayScore / GAMEPLAY_CONFIG.SCORE_MULTIPLIER);
}

/**
 * Formats a score for display with optional prefix
 * @param score The score to format
 * @param prefix Optional prefix (e.g., "Score: ")
 * @returns Formatted score string
 */
export function formatScore(score: number, prefix?: string): string {
  const formatted = score.toLocaleString();
  return prefix ? `${prefix}${formatted}` : formatted;
}
