import { getDisplayScore } from "./scoreCalculation";
import { GAMEPLAY_CONFIG } from "../config";
import type { PlayerMove } from "../types";

type BuildRunSummaryParams = {
  baseScore: number;
  moves?: PlayerMove[];
  streak?: number;
  canSubmitScore?: boolean;
  bestSubmittedScore: number | null;
  raffleSubmissionsUsed: number;
};

export type RunSummary = {
  score: number;
  baseScore: number;
  scoreMultiplier: number;
  distance: number;
  platforms: number;
  pointsEarned?: number | undefined;
  canSubmitScore: boolean;
  isHighScore: boolean;
  streak: number;
  submissionsUsed: number;
  submittedHighscore: boolean;
  submittedRaffle: boolean;
};

export const buildRunSummary = ({
  baseScore,
  moves = [],
  streak = 0,
  canSubmitScore = true,
  bestSubmittedScore,
  raffleSubmissionsUsed,
}: BuildRunSummaryParams): RunSummary => {
  const platforms = moves.length;
  const scoreMultiplier = GAMEPLAY_CONFIG.SCORE_MULTIPLIER;
  const totalScore = getDisplayScore(baseScore);
  const distance = Math.max(0, Math.round(baseScore * 0.8));
  const isHighScore =
    bestSubmittedScore === null ? true : totalScore > bestSubmittedScore;

  return {
    score: totalScore,
    baseScore,
    scoreMultiplier,
    distance,
    platforms,
    canSubmitScore,
    isHighScore,
    streak,
    submissionsUsed: raffleSubmissionsUsed,
    submittedHighscore: false,
    submittedRaffle: false,
  };
};
