import { queryClient } from "@/api/common/api-provider";
import {
  useGenerateSeedMutation,
  useValidateSessionMutation,
} from "@/api/game";
import {
  useCurrentTournamentSubmissions,
  useTournamentData,
  useTournamentLeaderboard,
} from "@/api/tournament";
import {
  useBroadcastSponsoredTransactionMutation,
  useBroadcastTransactionMutation,
  useCreateTransactionMutation,
} from "@/api/transaction";
import { useSponsoredSubmissionsLeft, useUserProfile } from "@/api/user";
import type { UserProfile } from "@/api/user/types";
import { getItemVariant } from "@/api/user/types";
import { ItemVariant, SubmissionType, TournamentStatusEnum } from "@/lib/enums";
import { RelativePathString, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

import { ContractCallDetailsSheet } from "@/components/contract-call-details-sheet";
import { TournamentSubmissionSheet } from "@/components/tournament-submission-sheet";
import useRewardedAd from "@/features/ads/hooks/useRewardedAd";
import { useSignTransaction } from "@/hooks/use-sign-transaction";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { formatAddress } from "@/lib/addresses";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/contracts";
import { Env } from "@/lib/env";
import { useAuth } from "@/lib/store/auth";
import { useGameStore } from "@/lib/store/game";
import { useSelectedNetwork } from "@/lib/store/settings";
import { calculateStreakStats } from "@/lib/streak";
import { walletKit } from "@/lib/wallet";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { OverlayState } from "../components/BridgeOverlays";
import { BRIDGE_CONFIG, SCORE_MULTIPLIER, SCREEN_HEIGHT } from "../constants";
import { StacksBridgeEngine } from "../engine";
import type { EngineEvent, PlayerMove, RenderState } from "../types";
import BridgeGameLayout from "./BridgeGame.layout";

const parseSeedToNumber = (seedHex: string): number => {
  const normalized = seedHex.startsWith("0x") ? seedHex.slice(2) : seedHex;
  const seedBigInt = BigInt("0x" + normalized);
  return Number(seedBigInt & BigInt(0xffffffff));
};

type BridgeGameProps = {
  autoStart?: boolean;
};

const BridgeGame = ({ autoStart = true }: BridgeGameProps) => {
  const router = useRouter();
  const generateSeedMutation = useGenerateSeedMutation();
  const validateSessionMutation = useValidateSessionMutation();

  const [uiState, setUiState] = useState<OverlayState>("START");
  const [uiScore, setUiScore] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [runSummary, setRunSummary] = useState<{
    score: number;
    baseScore: number;
    scoreMultiplier: number;
    distance: number;
    platforms: number;
    dailyProgress: number;
    canSubmitScore: boolean;
    isHighScore: boolean;
    streak?: number;
    submissionsUsed?: number;
    pointsEarned?: number;
    submittedRaffle?: boolean;
    submittedHighscore?: boolean;
  } | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const [submissionContext, setSubmissionContext] = useState<{
    kind: "tournament" | "raffle";
  } | null>(null);
  const [submissionOpenCount, setSubmissionOpenCount] = useState(0);
  const { balance: walletBalance } = useStxBalance();
  const { userData } = useAuth();
  const { selectedNetwork } = useSelectedNetwork();
  const { data: leaderboardData } = useTournamentLeaderboard();
  const { data: tournamentData } = useTournamentData();
  const { data: currentTournamentSubmissions } =
    useCurrentTournamentSubmissions();
  const { data: sponsoredSubmissionsLeft } = useSponsoredSubmissionsLeft();
  const { data: userProfile } = useUserProfile();
  const createTransactionMutation = useCreateTransactionMutation();
  const broadcastTransactionMutation = useBroadcastTransactionMutation();
  const broadcastSponsoredTransactionMutation =
    useBroadcastSponsoredTransactionMutation();
  const signTransaction = useSignTransaction();
  const submissionDeferredRef = useRef<{
    resolve: (txId: string) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<{
    submissionId: number;
    serializedTx: string;
  } | null>(null);
  const [ssvData, setSsvData] = useState<{
    userId: string;
    customData: string;
  } | null>(null);
  const submissionRewardedRef = useRef(false);
  const [perfectCue, setPerfectCue] = useState<{
    x: number;
    y: number;
    createdAt: number;
  } | null>(null);
  const [ghostUsed, setGhostUsed] = useState(false);
  const [ghostExpiresAt, setGhostExpiresAt] = useState<number | null>(null);
  const [revivePowerUpUsed, setRevivePowerUpUsed] = useState(false);
  const [revivePowerUpConsumed, setRevivePowerUpConsumed] = useState(false);
  const [layoutHeight, setLayoutHeight] = useState(SCREEN_HEIGHT);
  const { highscore, setHighscore, hydrateHighscore, setLastRunSummary } =
    useGameStore();
  const bestSubmittedScore = leaderboardData?.userSubmission?.score ?? null;
  const canSubmitTournament =
    tournamentData?.status === TournamentStatusEnum.SubmitPhase;

  const weeklyContestSubmissionsLeft =
    sponsoredSubmissionsLeft?.dailyWeeklyContestSubmissionsLeft;
  const raffleSubmissionsLeft =
    sponsoredSubmissionsLeft?.dailyRaffleSubmissionsLeft;
  const raffleSubmissionsUsed =
    currentTournamentSubmissions?.raffleSubmissionsForCurrentTournament
      .length ?? 0;
  const itemQuantities = useMemo(() => {
    const quantities = new Map<ItemVariant, number>();
    if (!userProfile?.items) return quantities;
    userProfile.items.forEach((item) => {
      const variant = getItemVariant(item);
      if (!variant) return;
      const current = quantities.get(variant) ?? 0;
      const quantity = item.quantity ?? 1;
      quantities.set(variant, current + quantity);
    });
    return quantities;
  }, [userProfile?.items]);
  const reviveAvailable = (itemQuantities.get(ItemVariant.Revive) ?? 0) > 0;
  const dropPointAvailable =
    (itemQuantities.get(ItemVariant.DropPoint) ?? 0) > 0;

  const canvasHeight = layoutHeight;
  const worldOffsetY = canvasHeight - BRIDGE_CONFIG.CANVAS_H;

  const sessionSeedRef = useRef<string | null>(null);
  const sessionSignatureRef = useRef<string | null>(null);
  const usedItemsRef = useRef<ItemVariant[]>([]);
  const runSubmittedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const engineRef = useRef(new StacksBridgeEngine());
  const adRewardedRef = useRef(false);
  const autoStartTriggeredRef = useRef(false);
  const submissionSheetRef = useRef<BottomSheetModal>(null);
  const contractDetailsSheetRef = useRef<BottomSheetModal>(null);

  const requestNewSession = useCallback(async () => {
    const response = await generateSeedMutation.mutateAsync();
    const { seed, signature } = response.data;
    sessionSeedRef.current = seed;
    sessionSignatureRef.current = signature;
    return { seed, signature };
  }, [generateSeedMutation]);

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
    [bestSubmittedScore, validateSessionMutation],
  );

  const consumeRevivePowerUp = useCallback(() => {
    if (!reviveAvailable) return;
    setRevivePowerUpConsumed(true);
    usedItemsRef.current = [...usedItemsRef.current, ItemVariant.Revive];
    queryClient.setQueryData<UserProfile>(["user-profile"], (prev) => {
      if (!prev?.items?.length) return prev;
      let consumed = false;
      const nextItems = prev.items.map((item) => {
        if (consumed) return item;
        if (getItemVariant(item) !== ItemVariant.Revive) return item;
        const currentQuantity = item.quantity ?? 1;
        if (currentQuantity <= 0) return item;
        consumed = true;
        return {
          ...item,
          quantity: Math.max(0, currentQuantity - 1),
        };
      });
      return {
        ...prev,
        items: nextItems,
      };
    });
  }, [reviveAvailable]);

  const consumeDropPointPowerUp = useCallback(() => {
    if (!dropPointAvailable) return;
    usedItemsRef.current = [...usedItemsRef.current, ItemVariant.DropPoint];
    queryClient.setQueryData<UserProfile>(["user-profile"], (prev) => {
      if (!prev?.items?.length) return prev;
      let consumed = false;
      const nextItems = prev.items.map((item) => {
        if (consumed) return item;
        if (getItemVariant(item) !== ItemVariant.DropPoint) return item;
        const currentQuantity = item.quantity ?? 1;
        if (currentQuantity <= 0) return item;
        consumed = true;
        return {
          ...item,
          quantity: Math.max(0, currentQuantity - 1),
        };
      });
      return {
        ...prev,
        items: nextItems,
      };
    });
  }, [dropPointAvailable]);

  const buildRunSummary = useCallback(
    (
      baseScore: number,
      moves: PlayerMove[] = [],
      streak: number = 0,
      canSubmitScore = true,
    ) => {
      const platforms = moves.length;
      const scoreMultiplier = SCORE_MULTIPLIER;
      const totalScore = baseScore * scoreMultiplier;
      const distance = Math.max(0, Math.round(baseScore * 0.8));
      const streakStats = calculateStreakStats({ streak: Math.max(0, streak) });
      const dailyProgress = Math.round(
        (streakStats.completedDaysThisWeek / streakStats.weekDays.length) * 100,
      );
      const isHighScore =
        bestSubmittedScore === null ? true : totalScore > bestSubmittedScore;
      setLastRunSummary(baseScore, isHighScore);
      return {
        score: totalScore,
        baseScore,
        scoreMultiplier,
        distance,
        platforms,
        pointsEarned: undefined,
        dailyProgress,
        canSubmitScore,
        isHighScore,
        streak,
        submissionsUsed: raffleSubmissionsUsed,
        submittedHighscore: false,
        submittedRaffle: false,
      };
    },
    [bestSubmittedScore, setLastRunSummary, raffleSubmissionsUsed],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setLayoutHeight((prev) =>
      Math.abs(prev - nextHeight) < 1 ? prev : nextHeight,
    );
  }, []);

  const declineRevive = useCallback(() => {
    const { score: baseScore, streak } = engineRef.current.state;
    const runData = engineRef.current.getRunData();

    setRunSummary(
      buildRunSummary(
        baseScore,
        runData?.moves ?? [],
        streak,
        canSubmitTournament,
      ),
    );
    setUiScore(baseScore);
    setUiState("GAME_OVER");

    submitSession(runData?.moves ?? []);
  }, [buildRunSummary, submitSession, canSubmitTournament]);

  const adUnitId = __DEV__
    ? TestIds.REWARDED
    : Env.ANDROID_REWARDS_AD_MOBIN_KEY;

  const handleAdEarned = useCallback(() => {
    adRewardedRef.current = true;
    setIsWatchingAd(false);
    engineRef.current.revive();
    setUiState("PLAYING");
    setRunSummary(null);
  }, []);

  const handleAdOpened = useCallback(() => {
    setIsWatchingAd(true);
  }, []);

  const handleAdClosed = useCallback(() => {
    setIsWatchingAd(false);
    // If ad was closed without reward, decline revive
    if (!adRewardedRef.current && uiState === "REVIVE") {
      declineRevive();
    }
    // Reset flag for next ad
    adRewardedRef.current = false;
  }, [declineRevive, uiState]);

  const handleAdError = useCallback(() => {
    setIsWatchingAd(false);
  }, []);

  const {
    loaded: isAdLoaded,
    loading: isAdLoading,
    error: adError,
    loadAd,
    showAd,
  } = useRewardedAd({
    adUnitId,
    loadOnMount: true,
    onEarnedReward: handleAdEarned,
    onAdOpened: handleAdOpened,
    onAdClosed: handleAdClosed,
    onAdError: handleAdError,
  });

  const {
    loaded: isSubmissionAdLoaded,
    loading: isSubmissionAdLoading,
    loadAd: loadSubmissionAd,
    showAd: showSubmissionAd,
  } = useRewardedAd({
    adUnitId,
    loadOnMount: false,
    serverSideVerificationOptions: ssvData ?? undefined,
    onEarnedReward: async () => {
      if (!pendingSubmission) return;
      submissionRewardedRef.current = true;
      try {
        await broadcastSponsoredTransactionMutation.mutateAsync({
          submissionId: pendingSubmission.submissionId,
          serializedTx: pendingSubmission.serializedTx,
        });
        submissionDeferredRef.current?.resolve(
          String(pendingSubmission.submissionId),
        );
      } catch (error) {
        const nextError =
          error instanceof Error ? error : new Error(String(error));
        submissionDeferredRef.current?.reject(nextError);
      } finally {
        submissionDeferredRef.current = null;
        setPendingSubmission(null);
        setSsvData(null);
      }
    },
    onAdClosed: () => {
      if (!submissionRewardedRef.current) {
        submissionDeferredRef.current?.reject(new Error("Ad not completed."));
        submissionDeferredRef.current = null;
        setPendingSubmission(null);
        setSsvData(null);
      }
      submissionRewardedRef.current = false;
    },
    onAdError: (error) => {
      submissionDeferredRef.current?.reject(
        new Error(error?.message ?? "Ad failed to load."),
      );
      submissionDeferredRef.current = null;
      setPendingSubmission(null);
      setSsvData(null);
      submissionRewardedRef.current = false;
    },
  });

  const syncFromEvent = useCallback(
    (event: EngineEvent) => {
      switch (event.type) {
        case "score":
          setUiScore(event.value);
          break;
        case "gameOver": {
          // Check if revive power-up is active before ending the game
          if (revivePowerUpUsed && !revivePowerUpConsumed) {
            engineRef.current.revivePowerUp();
            setUiState("PLAYING");
            setRunSummary(null);
            consumeRevivePowerUp();
            break;
          }

          const currentStreak = engineRef.current.state.streak;
          setUiScore(event.value);
          setUiState("GAME_OVER");
          setRunSummary(
            buildRunSummary(
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
          setUiScore(event.value);
          if (revivePowerUpUsed && !revivePowerUpConsumed) {
            engineRef.current.revivePowerUp();
            setUiState("PLAYING");
            setRunSummary(null);
            consumeRevivePowerUp();
          } else {
            // Show ad revive option
            setUiState("REVIVE");
            // Reset reward flag and ensure ad is loading/loaded (user must press button to show)
            adRewardedRef.current = false;
            // If ad isn't loaded and not already loading, start loading it
            if (!isAdLoaded && !isAdLoading) {
              loadAd();
            }
          }
          break;
        case "perfect":
          setPerfectCue({
            x: event.x,
            y: event.y,
            createdAt: performance.now(),
          });
          break;
      }
    },
    [
      buildRunSummary,
      isAdLoaded,
      isAdLoading,
      loadAd,
      revivePowerUpUsed,
      revivePowerUpConsumed,
      submitSession,
      consumeRevivePowerUp,
      canSubmitTournament,
    ],
  );

  const step = useCallback(
    (deltaTime: number, isPlaying: boolean) => {
      const events = engineRef.current.step(isPlaying, deltaTime);
      events.forEach(syncFromEvent);
    },
    [syncFromEvent],
  );

  const isPlaying = uiState === "PLAYING";

  useEffect(() => {
    if (!isPlaying) return;
    let frameId: number;
    let lastTime = performance.now();
    const loop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms to prevent large jumps
      lastTime = currentTime;
      step(deltaTime, isPlaying);
      setRenderTick((t) => t + 1);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, step]);

  const startGame = useCallback(async () => {
    try {
      const session = await requestNewSession();
      const hashedSeed = parseSeedToNumber(session.seed);
      engineRef.current.start(hashedSeed);
      setUiScore(0);
      setUiState("PLAYING");
      setRunSummary(null);
      setGhostUsed(false);
      setGhostExpiresAt(null);
      setRevivePowerUpUsed(false);
      setRevivePowerUpConsumed(false);
      setPerfectCue(null);
      usedItemsRef.current = [];
      runSubmittedRef.current = false;
      adRewardedRef.current = false;
      // Preload ad when game starts so it's ready for revive
      if (!isAdLoaded && !isAdLoading) {
        loadAd();
      }
    } catch (error) {
      console.error("Unable to start game session", error);
    }
  }, [requestNewSession, isAdLoaded, isAdLoading, loadAd]);

  const handleInputDown = useCallback(() => {
    engineRef.current.handleInputDown(uiState === "PLAYING");
  }, [uiState]);

  const handleInputUp = useCallback(() => {
    engineRef.current.handleInputUp(uiState === "PLAYING");
  }, [uiState]);

  const activateGhost = useCallback(() => {
    if (ghostUsed || !dropPointAvailable) return;
    const now = performance.now();
    setGhostExpiresAt(now + 30000);
    setGhostUsed(true);
    consumeDropPointPowerUp();
  }, [ghostUsed, dropPointAvailable, consumeDropPointPowerUp]);

  const activateRevive = useCallback(() => {
    if (revivePowerUpUsed || !reviveAvailable) return;
    setRevivePowerUpUsed(true);
  }, [revivePowerUpUsed, reviveAvailable]);

  const handleRevive = useCallback(() => {
    if (isAdLoading || isWatchingAd) return;
    adRewardedRef.current = false;
    if (isAdLoaded) {
      showAd();
    } else {
      loadAd();
    }
  }, [isAdLoaded, isAdLoading, isWatchingAd, loadAd, showAd]);

  const handleEmitterReady = useCallback(
    (spawn: (x: number, y: number, color: string, count?: number) => void) => {
      engineRef.current.setParticleEmitter(spawn);
    },
    [],
  );

  const handleExit = useCallback(() => {
    router.back();
  }, [router]);

  const openSubmissionSheet = useCallback((kind: "tournament" | "raffle") => {
    setSubmissionContext({ kind });
    setSubmissionOpenCount((count) => count + 1);
    submissionSheetRef.current?.present();
  }, []);

  const handleSubmissionCancel = useCallback(() => {
    setSubmissionContext(null);
    submissionSheetRef.current?.dismiss();
  }, []);

  const handleOpenContractDetails = useCallback(() => {
    contractDetailsSheetRef.current?.present();
  }, []);

  const handleSubmissionSuccess = useCallback(
    (txId: string) => {
      console.info("Submission success", txId);
      setRunSummary((prev) => {
        if (!prev) return prev;
        const isRaffleSubmission = submissionContext?.kind === "raffle";
        if (prev.score > highscore) {
          setTimeout(() => {
            setHighscore(prev.score);
          }, 0);
        }
        return {
          ...prev,
          submittedHighscore: isRaffleSubmission
            ? prev.submittedHighscore
            : true,
          submittedRaffle: isRaffleSubmission ? true : prev.submittedRaffle,
          submissionsUsed: isRaffleSubmission
            ? (prev.submissionsUsed ?? raffleSubmissionsUsed) + 1
            : prev.submissionsUsed,
        };
      });
    },
    [highscore, raffleSubmissionsUsed, setHighscore, submissionContext?.kind],
  );

  const avatarSource = useMemo(
    () => (userData?.user.photo ? { uri: userData.user.photo } : undefined),
    [userData?.user.photo],
  );
  const displayName = useMemo(
    () => userData?.user.name ?? "Stacks user",
    [userData?.user.name],
  );

  const handleSubmitSponsored = useCallback(async () => {
    return await new Promise<string>(async (resolve, reject) => {
      submissionDeferredRef.current = { resolve, reject };
      submissionRewardedRef.current = false;
      try {
        const accounts = await walletKit.getWalletAccounts();
        const account = accounts[0];
        if (!account) {
          throw new Error("Wallet not available.");
        }
        if (!userProfile?.id) {
          throw new Error("User profile not available.");
        }
        const response = await createTransactionMutation.mutateAsync({
          address: account.addresses.testnet,
          publicKey: account.publicKey,
          score: runSummary?.score ?? uiScore,
          submissionType: SubmissionType.WeeklyContest,
          isSponsored: true,
        });
        const unsigned = response.data?.unsignedTransaction;
        if (!unsigned?.submission?.id || !unsigned.serializedTx) {
          throw new Error("Invalid transaction response.");
        }
        const signedSerializedTx = await signTransaction(
          unsigned.serializedTx,
          account.index,
        );
        setPendingSubmission({
          submissionId: unsigned.submission.id,
          serializedTx: signedSerializedTx,
        });
        setSsvData({
          userId: String(userProfile.id),
          customData: String(unsigned.submission.id),
        });
      } catch (error) {
        const nextError =
          error instanceof Error ? error : new Error(String(error));
        submissionDeferredRef.current = null;
        reject(nextError);
      }
    });
  }, [
    createTransactionMutation,
    runSummary?.score,
    uiScore,
    userProfile?.id,
    signTransaction,
  ]);

  const handleAddFunds = useCallback(() => {
    // TODO: Navigate to the add-funds flow once it's built.
    router.push("/add-funds" as RelativePathString);
  }, [router]);

  const handleSubmitWallet = useCallback(async () => {
    const accounts = await walletKit.getWalletAccounts();
    const account = accounts[0];
    if (!account) {
      throw new Error("Wallet not available.");
    }

    const score = runSummary?.score ?? uiScore;
    const submissionType =
      submissionContext?.kind === "raffle"
        ? SubmissionType.Lottery
        : SubmissionType.WeeklyContest;
    const [address, contractName] =
      CONTRACTS[selectedNetwork]?.game?.CONTRACT?.split(".") ?? [];
    if (!address || !contractName) {
      throw new Error("Invalid contract address or name.");
    }

    const response = await createTransactionMutation.mutateAsync({
      address: account.addresses.testnet,
      publicKey: account.publicKey,
      score,
      submissionType,
      isSponsored: false,
    });

    const unsigned = response.data?.unsignedTransaction;
    if (!unsigned?.submission?.id || !unsigned.serializedTx) {
      throw new Error("Invalid transaction response.");
    }

    const signedSerializedTx = await signTransaction(
      unsigned.serializedTx,
      account.index,
    );

    await broadcastTransactionMutation.mutateAsync({
      submissionId: unsigned.submission.id,
      serializedTx: signedSerializedTx,
    });

    return String(unsigned.submission.id);
  }, [
    broadcastTransactionMutation,
    createTransactionMutation,
    runSummary?.score,
    selectedNetwork,
    signTransaction,
    submissionContext?.kind,
    uiScore,
  ]);

  useEffect(() => {
    void hydrateHighscore();
  }, [hydrateHighscore]);

  useEffect(() => {
    if (autoStart && uiState === "START" && !autoStartTriggeredRef.current) {
      autoStartTriggeredRef.current = true;
      void startGame();
    }
    // Reset the ref when game ends and returns to START state
    if (uiState !== "START") {
      autoStartTriggeredRef.current = false;
    }
  }, [autoStart, uiState, startGame]);

  useEffect(() => {
    if (!ssvData) return;
    if (!isSubmissionAdLoaded && !isSubmissionAdLoading) {
      loadSubmissionAd();
    }
  }, [isSubmissionAdLoaded, isSubmissionAdLoading, loadSubmissionAd, ssvData]);

  useEffect(() => {
    if (!ssvData) return;
    if (isSubmissionAdLoaded) {
      showSubmissionAd();
    }
  }, [isSubmissionAdLoaded, showSubmissionAd, ssvData]);

  const state: RenderState = engineRef.current.getRenderState();
  return (
    <>
      <BridgeGameLayout
        onLayout={handleLayout}
        renderState={state}
        canvasHeight={canvasHeight}
        worldOffsetY={worldOffsetY}
        renderTick={renderTick}
        perfectCue={perfectCue}
        ghostUsed={ghostUsed}
        ghostExpiresAt={ghostExpiresAt}
        dropPointAvailable={dropPointAvailable}
        uiState={uiState}
        uiScore={uiScore}
        runSummary={runSummary}
        highScore={bestSubmittedScore ?? 0}
        isWatchingAd={isWatchingAd}
        adLoaded={isAdLoaded}
        adLoading={isAdLoading}
        adError={adError}
        onInputDown={handleInputDown}
        onInputUp={handleInputUp}
        onEmitterReady={handleEmitterReady}
        onActivateGhost={activateGhost}
        reviveAvailable={reviveAvailable}
        revivePowerUpUsed={revivePowerUpUsed}
        revivePowerUpConsumed={revivePowerUpConsumed}
        onActivateRevive={activateRevive}
        onRevive={handleRevive}
        onDeclineRevive={declineRevive}
        onRestart={startGame}
        onExit={handleExit}
        onSubmitToLeaderboard={() => openSubmissionSheet("tournament")}
        onSubmitToRaffle={() => openSubmissionSheet("raffle")}
      />
      <TournamentSubmissionSheet
        ref={submissionSheetRef}
        score={runSummary?.score ?? uiScore}
        currentRank={null}
        projectedRank={null}
        tournamentId={
          submissionContext?.kind === "raffle"
            ? "weekly-raffle"
            : "weekly-tournament"
        }
        tournamentName={
          submissionContext?.kind === "raffle"
            ? "Weekly Raffle"
            : "Weekly Tournament"
        }
        canUseSponsored
        walletBalance={walletBalance}
        walletHasEnoughBalance={walletBalance > 0}
        sponsoredSubmissionsLeft={
          submissionContext?.kind === "raffle"
            ? raffleSubmissionsLeft
            : weeklyContestSubmissionsLeft
        }
        onAddFunds={handleAddFunds}
        rewardAmount={
          submissionContext?.kind === "raffle" ? "1000 STX" : "500 STX"
        }
        estimatedFee={0.002}
        showRankChange={submissionContext?.kind !== "raffle"}
        userDisplayName={displayName}
        userAvatarSource={avatarSource}
        onSubmitSponsored={handleSubmitSponsored}
        onSubmitWallet={handleSubmitWallet}
        onCancel={handleSubmissionCancel}
        onSuccess={handleSubmissionSuccess}
        canSubmit={canSubmitTournament}
        onOpenContractDetails={handleOpenContractDetails}
        snapPoints={["60%"]}
        resetKey={submissionOpenCount}
        weeklyContestSubmissionsLeft={weeklyContestSubmissionsLeft}
        raffleSubmissionsLeft={raffleSubmissionsLeft}
      />
      <ContractCallDetailsSheet
        ref={contractDetailsSheetRef}
        onClose={() => contractDetailsSheetRef.current?.dismiss()}
        network={
          selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1)
        }
        contractName={(() => {
          const contract = CONTRACTS[selectedNetwork]?.game?.CONTRACT;
          if (!contract) return "Not configured";
          const [address, contractName] = contract.split(".");
          return address && contractName
            ? `${formatAddress(address)}.${contractName}`
            : "Not configured";
        })()}
        functionName={SC_FUNCTIONS.game.publicFunctions.SUBMIT_SCORE}
      />
    </>
  );
};

export default BridgeGame;
