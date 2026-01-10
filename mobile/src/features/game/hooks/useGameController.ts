import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";

import type { EngineEvent, PlayerMove } from "../types";
import type { BridgeOverlayState } from "@/lib/store/game";
import type { RunSummary } from "../utils/runSummary";

type UseGameControllerOptions = {
  engine: {
    handleInputDown: (isPlaying: boolean) => void;
    handleInputUp: (isPlaying: boolean) => void;
    revivePowerUp: () => void;
    state: { streak: number };
  };
  revivePowerUp: { activated: boolean; consumed: boolean };
  overlayState: BridgeOverlayState;
  setOverlay: (state: BridgeOverlayState) => void;
  updateScore: (score: number) => void;
  applyEngineEvents: (events: EngineEvent[]) => void;
  setRunSummary: Dispatch<SetStateAction<RunSummary | null>>;
  getRunSummary: (
    baseScore: number,
    moves: PlayerMove[],
    streak: number,
    canSubmitScore: boolean,
  ) => RunSummary;
  canSubmitTournament: boolean;
  submitSession: (moves: PlayerMove[]) => void;
  consumeRevive: () => void;
  resetReviveReward: () => void;
  reviveAd: { loaded: boolean; loading: boolean; loadAd: () => void };
  onPerfectCue: (event: { x: number; y: number }) => void;
};

export const useGameController = ({
  engine,
  revivePowerUp,
  overlayState,
  setOverlay,
  updateScore,
  setRunSummary,
  getRunSummary,
  canSubmitTournament,
  submitSession,
  consumeRevive,
  resetReviveReward,
  reviveAd,
  onPerfectCue,
  applyEngineEvents,
}: UseGameControllerOptions) => {
  const handleEvents = useCallback(
    (events: EngineEvent[]) => {
      if (!events.length) return;
      applyEngineEvents(events);
      for (const event of events) {
        switch (event.type) {
          case "perfect": {
            onPerfectCue({ x: event.x, y: event.y });
            break;
          }
          case "gameOver": {
            if (revivePowerUp.activated && !revivePowerUp.consumed) {
              engine.revivePowerUp();
              if (overlayState !== "PLAYING") {
                setOverlay("PLAYING");
              }
              setRunSummary(null);
              consumeRevive();
              break;
            }

            const currentStreak = engine.state.streak;
            updateScore(event.value);
            if (overlayState !== "GAME_OVER") {
              setOverlay("GAME_OVER");
            }
            setRunSummary(
              getRunSummary(
                event.value,
                event.moves,
                currentStreak,
                canSubmitTournament,
              ),
            );
            submitSession(event.moves);
            break;
          }
          case "revivePrompt":
            updateScore(event.value);
            if (revivePowerUp.activated && !revivePowerUp.consumed) {
              engine.revivePowerUp();
              if (overlayState !== "PLAYING") {
                setOverlay("PLAYING");
              }
              setRunSummary(null);
              consumeRevive();
            } else {
              if (overlayState !== "REVIVE") {
                setOverlay("REVIVE");
              }
              resetReviveReward();
              if (!reviveAd.loaded && !reviveAd.loading) {
                reviveAd.loadAd();
              }
            }
            break;
          default:
            break;
        }
      }
    },
    [
      applyEngineEvents,
      canSubmitTournament,
      consumeRevive,
      engine,
      getRunSummary,
      onPerfectCue,
      overlayState,
      resetReviveReward,
      revivePowerUp.activated,
      revivePowerUp.consumed,
      setOverlay,
      setRunSummary,
      submitSession,
      updateScore,
      reviveAd,
    ],
  );

  const isPlaying = overlayState === "PLAYING";

  const handleInputDown = useCallback(() => {
    engine.handleInputDown(isPlaying);
  }, [engine, isPlaying]);

  const handleInputUp = useCallback(() => {
    engine.handleInputUp(isPlaying);
  }, [engine, isPlaying]);

  return { handleEvents, handleInputDown, handleInputUp, isPlaying };
};
