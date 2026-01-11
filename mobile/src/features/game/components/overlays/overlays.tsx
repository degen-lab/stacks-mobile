import { useMemo } from "react";

import { getDisplayScore } from "../../utils/scoreCalculation";
import { GAMEPLAY_CONFIG } from "../../config";
import { GameOverOverlay, ReviveOverlay } from ".";
import type { RunSummary } from "../../utils/runSummary";
import type { ActionHandler } from "../../types";
import { useGameStore } from "@/lib/store/game";

type BridgeOverlaysProps = {
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
  const overlayState = useGameStore((state) => state.overlayState);
  const score = useGameStore((state) => state.score);
  const summary: RunSummary = useMemo(
    () => ({
      score: runSummary?.score ?? getDisplayScore(score),
      baseScore: runSummary?.baseScore ?? score,
      scoreMultiplier: GAMEPLAY_CONFIG.SCORE_MULTIPLIER,
      distance: Math.max(0, runSummary?.distance ?? Math.round(score * 0.8)),
      platforms: runSummary?.platforms ?? 0,
      pointsEarned: runSummary?.pointsEarned,
      canSubmitScore: runSummary?.canSubmitScore ?? false,
      isHighScore: runSummary?.isHighScore ?? false,
      streak: runSummary?.streak ?? 0,
      submissionsUsed: runSummary?.submissionsUsed ?? 0,
      submittedHighscore: runSummary?.submittedHighscore ?? false,
      submittedRaffle: runSummary?.submittedRaffle ?? false,
    }),
    [runSummary, score],
  );

  switch (overlayState) {
    case "REVIVE":
      return (
        <ReviveOverlay
          score={score}
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

export default BridgeOverlays;
