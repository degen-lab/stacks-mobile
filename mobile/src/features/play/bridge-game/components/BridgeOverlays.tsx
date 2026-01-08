import { useMemo } from "react";

import { SCORE_MULTIPLIER } from "../constants";
import { GameOverOverlay, ReviveOverlay, type RunSummary } from "../overlays";
import type { ActionHandler } from "../overlays/types";

type OverlayState = "START" | "PLAYING" | "REVIVE" | "GAME_OVER";

type BridgeOverlaysProps = {
  uiState: OverlayState;
  uiScore: number;
  highScore?: number;
  runSummary?: RunSummary | null;
  onRestart: ActionHandler;
  onRevive: ActionHandler;
  onDeclineRevive: ActionHandler;
  onSubmitToRaffle?: ActionHandler;
  onSubmitToLeaderboard?: ActionHandler;
  onExit?: ActionHandler;
  isWatchingAd: boolean;
  adLoaded: boolean;
  adLoading: boolean;
  adError: string | null;
};

const BridgeOverlays = ({
  uiState,
  uiScore,
  highScore,
  runSummary,
  onRestart,
  onRevive,
  onDeclineRevive,
  onSubmitToRaffle,
  onSubmitToLeaderboard,
  onExit,
  isWatchingAd,
  adLoaded,
  adLoading,
  adError,
}: BridgeOverlaysProps) => {
  const summary: RunSummary = useMemo(
    () => ({
      score: runSummary?.score ?? uiScore * SCORE_MULTIPLIER,
      baseScore: runSummary?.baseScore ?? uiScore,
      distance: Math.max(0, runSummary?.distance ?? Math.round(uiScore * 0.8)),
      platforms: runSummary?.platforms ?? 0,
      pointsEarned: runSummary?.pointsEarned,
      dailyProgress: runSummary?.dailyProgress ?? 50,
      canSubmitScore: runSummary?.canSubmitScore ?? false,
      isHighScore: runSummary?.isHighScore ?? false,
      streak: runSummary?.streak,
      submissionsUsed: runSummary?.submissionsUsed,
      submittedHighscore: runSummary?.submittedHighscore,
      submittedRaffle: runSummary?.submittedRaffle,
    }),
    [runSummary, uiScore],
  );

  switch (uiState) {
    case "REVIVE":
      return (
        <ReviveOverlay
          score={uiScore}
          highScore={highScore}
          onRevive={onRevive}
          onDeclineRevive={onDeclineRevive}
          isWatchingAd={isWatchingAd}
          adLoaded={adLoaded}
          adLoading={adLoading}
          adError={adError}
        />
      );

    case "GAME_OVER":
      return (
        <GameOverOverlay
          summary={summary}
          highScore={highScore}
          onRestart={onRestart}
          onSubmitToLeaderboard={onSubmitToLeaderboard}
          onSubmitToRaffle={onSubmitToRaffle}
          onExit={onExit}
        />
      );

    default:
      return null;
  }
};

export type { OverlayState };
export default BridgeOverlays;
