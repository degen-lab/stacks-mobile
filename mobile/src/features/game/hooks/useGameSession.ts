import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef } from "react";

import {
  useGenerateSeedMutation,
  useValidateSessionMutation,
} from "@/api/game";
import type { ItemVariant } from "@/lib/enums";

import { SCORE_MULTIPLIER } from "../constants";
import type { PlayerMove } from "../types";
import type { RunSummary } from "../utils/runSummary";
import type { BridgeOverlayState } from "@/lib/store/game";

type UseGameSessionOptions = {
  engine: { start: (seed: number) => void };
  bestSubmittedScore: number | null;
  updateScore: (score: number) => void;
  setOverlay: (state: BridgeOverlayState) => void;
  resetPowerUps: () => void;
  setRunSummary: Dispatch<SetStateAction<RunSummary | null>>;
  setPerfectCue: Dispatch<
    SetStateAction<{ x: number; y: number; createdAt: number } | null>
  >;
  resetReviveReward: () => void;
  ensureReviveAdLoaded: () => void;
};

const parseSeedToNumber = (seedHex: string): number => {
  const normalized = seedHex.startsWith("0x") ? seedHex.slice(2) : seedHex;
  const seedBigInt = BigInt("0x" + normalized);
  return Number(seedBigInt & BigInt(0xffffffff));
};

export const useGameSession = ({
  engine,
  bestSubmittedScore,
  updateScore,
  setOverlay,
  resetPowerUps,
  setRunSummary,
  setPerfectCue,
  resetReviveReward,
  ensureReviveAdLoaded,
}: UseGameSessionOptions) => {
  const generateSeedMutation = useGenerateSeedMutation();
  const validateSessionMutation = useValidateSessionMutation();
  const sessionSeedRef = useRef<string | null>(null);
  const sessionSignatureRef = useRef<string | null>(null);
  const usedItemsRef = useRef<ItemVariant[]>([]);
  const runSubmittedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const startTokenRef = useRef(0);
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const requestNewSession = useCallback(async () => {
    const response = await generateSeedMutation.mutateAsync();
    const { seed, signature } = response.data;
    sessionSeedRef.current = seed;
    sessionSignatureRef.current = signature;
    return { seed, signature };
  }, [generateSeedMutation]);

  const startGame = useCallback(async () => {
    const token = ++startTokenRef.current;
    try {
      const session = await requestNewSession();
      if (!isActiveRef.current || token !== startTokenRef.current) return;
      const hashedSeed = parseSeedToNumber(session.seed);
      engine.start(hashedSeed);
      updateScore(0);
      setOverlay("PLAYING");
      setRunSummary(null);
      resetPowerUps();
      setPerfectCue(null);
      usedItemsRef.current = [];
      runSubmittedRef.current = false;
      resetReviveReward();
      ensureReviveAdLoaded();
    } catch (error) {
      console.error("Unable to start game session", error);
    }
  }, [
    engine,
    ensureReviveAdLoaded,
    requestNewSession,
    resetPowerUps,
    resetReviveReward,
    setOverlay,
    setPerfectCue,
    setRunSummary,
    updateScore,
  ]);

  const submitSession = useCallback(
    async (moves: PlayerMove[]) => {
      if (runSubmittedRef.current) return;
      if (isSubmittingRef.current) return;
      if (!sessionSeedRef.current || !sessionSignatureRef.current) {
        console.warn("Missing session seed/signature; skipping submit");
        return;
      }

      isSubmittingRef.current = true;
      try {
        const response = await validateSessionMutation.mutateAsync({
          sessionData: {
            seed: sessionSeedRef.current,
            signature: sessionSignatureRef.current,
            moves: moves.map(
              ({ startTime, duration, idleDurationMs, debug }) => ({
                startTime,
                duration,
                idleDurationMs,
                ...(debug && __DEV__ ? { debug } : {}),
              }),
            ),
            usedItems: usedItemsRef.current,
          },
          debug: __DEV__,
        });
        const pointsEarned = response.data?.pointsEarned;
        const sessionScore = response.data?.sessionScore;
        const isHighScore =
          bestSubmittedScore === null
            ? true
            : sessionScore > bestSubmittedScore;

        setRunSummary((prev) => {
          if (!prev) return prev;
          const score = sessionScore ?? prev.score;

          return {
            ...prev,
            pointsEarned,
            score,
            baseScore: score / SCORE_MULTIPLIER,
            scoreMultiplier: SCORE_MULTIPLIER,
            isHighScore,
          };
        });

        runSubmittedRef.current = true;
      } catch (error) {
        console.error("Failed to validate session", error);
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [bestSubmittedScore, setRunSummary, validateSessionMutation],
  );

  const registerUsedItem = useCallback((variant: ItemVariant) => {
    usedItemsRef.current = [...usedItemsRef.current, variant];
  }, []);

  const cancelPendingStart = useCallback(() => {
    startTokenRef.current += 1;
  }, []);

  return { registerUsedItem, startGame, submitSession, cancelPendingStart };
};
