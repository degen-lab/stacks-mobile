export type ActionHandler = () => void | Promise<void>;

export type RunSummary = {
  score: number;
  baseScore: number;
  distance: number;
  platforms: number;
  pointsEarned?: number;
  dailyProgress: number;
  canSubmitScore: boolean;
  isHighScore: boolean;
  streak?: number;
  submissionsUsed?: number;
  submittedHighscore?: boolean;
  submittedRaffle?: boolean;
};
