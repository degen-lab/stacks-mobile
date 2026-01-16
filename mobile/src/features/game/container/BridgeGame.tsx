import { useBroadcastSponsoredTransactionMutation } from "@/api/transaction";
import {
  useCurrentTournamentSubmissions,
  useTournamentData,
  useTournamentLeaderboard,
} from "@/api/tournament";
import { useSponsoredSubmissionsLeft, useUserProfile } from "@/api/user";
import { getItemVariant } from "@/api/user/types";
import { ItemVariant, TournamentStatusEnum } from "@/lib/enums";
import { RelativePathString, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, StatusBar } from "react-native";
import { useGameAds } from "../hooks/useGameAds";
import { useBridgeLayout } from "../hooks/useBridgeLayout";
import { useAutoStart } from "../hooks/useAutoStart";
import { useGameSession } from "../hooks/useGameSession";
import { usePowerUpInventory } from "../hooks/usePowerUpInventory";
import { useRunSummary } from "../hooks/useRunSummary";
import { useSubmissionActions } from "../hooks/useSubmissionActions";
import { useSubmissionSheet } from "../hooks/useSubmissionSheet";

import { ContractCallDetailsSheet } from "@/components/contract-call-details-sheet";
import { TournamentSubmissionSheet } from "@/components/tournament-submission-sheet";
import { ActivityIndicator, View } from "@/components/ui";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { formatAddress } from "@/lib/addresses";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/contracts";
import { useAuth } from "@/lib/store/auth";
import { useGameStore } from "@/lib/store/game";
import { useSelectedNetwork } from "@/lib/store/settings";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { StacksBridgeEngine } from "../engine";
import type {
  BridgeOverlayState,
  EngineEvent,
  GhostState,
  PlayerMove,
  RevivePowerUpState,
} from "../types";
import { BridgeGameCanvas } from "../components/canvas";
import BridgeGameLayout from "./BridgeGame.layout";

type BridgeGameProps = {
  autoStart?: boolean;
};

const BridgeGame = ({ autoStart = true }: BridgeGameProps) => {
  const router = useRouter();

  const { selectedNetwork } = useSelectedNetwork();
  const { balance: walletBalance } = useStxBalance();
  const { userData } = useAuth();
  const broadcastSponsoredTransactionMutation =
    useBroadcastSponsoredTransactionMutation();
  const submissionDeferredRef = useRef<{
    resolve: (txId: string) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const [perfectCue, setPerfectCue] = useState<{
    x: number;
    y: number;
    createdAt: number;
  } | null>(null);
  const { canvasHeight, handleLayout, worldOffsetY } = useBridgeLayout();
  const [isStarting, setIsStarting] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const isMountedRef = useRef(true);

  const [overlayState, setOverlayState] = useState<BridgeOverlayState>("START");
  const [score, setScore] = useState(0);
  const [ghost, setGhost] = useState<GhostState>({
    active: false,
    expiresAt: null as number | null,
    used: false,
  });
  const [revivePowerUp, setRevivePowerUp] = useState<RevivePowerUpState>({
    activated: false,
    consumed: false,
  });

  const highscore = useGameStore((state) => state.highscore);
  const setHighscore = useGameStore((state) => state.setHighscore);
  const hydrateHighscore = useGameStore((state) => state.hydrateHighscore);

  // Local state updaters
  const updateScore = useCallback((newScore: number) => setScore(newScore), []);
  const setOverlay = useCallback(
    (state: BridgeOverlayState) => setOverlayState(state),
    [],
  );
  const resetPowerUps = useCallback(() => {
    setGhost({ active: false, expiresAt: null, used: false });
    setRevivePowerUp({ activated: false, consumed: false });
  }, []);
  const consumeRevivePowerUp = useCallback(() => {
    setRevivePowerUp((prev) => ({ ...prev, consumed: true }));
  }, []);
  const resetSession = useCallback(() => {
    setOverlayState("START");
    setScore(0);
    setGhost({ active: false, expiresAt: null, used: false });
    setRevivePowerUp({ activated: false, consumed: false });
  }, []);
  const applyEngineEvents = useCallback((events: EngineEvent[]) => {
    for (const event of events) {
      if (event.type === "score") {
        setScore(event.value);
      }
    }
  }, []);

  const handleActivateGhost = useCallback((expiresAt: number) => {
    setGhost((prev) => ({
      ...prev,
      active: true,
      expiresAt,
      used: true,
    }));
  }, []);

  const handleActivateRevive = useCallback(() => {
    setRevivePowerUp((prev) => ({ ...prev, activated: true }));
  }, []);

  const handleAssetsLoaded = useCallback(() => {
    setAssetsLoaded(true);
  }, []);

  const isPlaying = overlayState === "PLAYING";
  const queryOptions = useMemo(
    () => ({
      enabled: !isPlaying,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
    [isPlaying],
  );

  const { data: userProfile } = useUserProfile(queryOptions);
  const { data: leaderboardData } = useTournamentLeaderboard(queryOptions);
  const { data: tournamentData } = useTournamentData(queryOptions);
  const { data: currentTournamentSubmissions } =
    useCurrentTournamentSubmissions(queryOptions);
  const { data: sponsoredSubmissionsLeft } =
    useSponsoredSubmissionsLeft(queryOptions);
  const {
    bestSubmittedScore,
    canSubmitTournament,
    weeklyContestSubmissionsLeft,
    raffleSubmissionsLeft,
    raffleSubmissionsUsed,
  } = useMemo(
    () => ({
      bestSubmittedScore: leaderboardData?.userSubmission?.score ?? null,
      canSubmitTournament:
        tournamentData?.status === TournamentStatusEnum.SubmitPhase,
      weeklyContestSubmissionsLeft:
        sponsoredSubmissionsLeft?.dailyWeeklyContestSubmissionsLeft,
      raffleSubmissionsLeft:
        sponsoredSubmissionsLeft?.dailyRaffleSubmissionsLeft,
      raffleSubmissionsUsed:
        currentTournamentSubmissions?.raffleSubmissionsForCurrentTournament
          .length ?? 0,
    }),
    [
      leaderboardData,
      tournamentData,
      sponsoredSubmissionsLeft,
      currentTournamentSubmissions,
    ],
  );

  const { reviveAvailable, dropPointAvailable } = useMemo(() => {
    const quantities = new Map<ItemVariant, number>();
    if (userProfile?.items) {
      userProfile.items.forEach((item) => {
        const variant = getItemVariant(item);
        if (!variant) return;
        const current = quantities.get(variant) ?? 0;
        const quantity = item.quantity ?? 1;
        quantities.set(variant, current + quantity);
      });
    }
    return {
      itemQuantities: quantities,
      reviveAvailable: (quantities.get(ItemVariant.Revive) ?? 0) > 0,
      dropPointAvailable: (quantities.get(ItemVariant.DropPoint) ?? 0) > 0,
    };
  }, [userProfile?.items]);

  const engineRef = useRef(new StacksBridgeEngine());
  const contractDetailsSheetRef = useRef<BottomSheetModal>(null);

  const {
    submissionContext,
    submissionOpenCount,
    submissionSheetRef,
    handleSubmissionCancel,
    handleSubmitLeaderboard,
    handleSubmitRaffle,
    rewardAmount,
    showRankChange,
    tournamentId,
    tournamentName,
  } = useSubmissionSheet();

  const { getRunSummary, runSummary, setRunSummary } = useRunSummary({
    bestSubmittedScore,
    raffleSubmissionsUsed,
  });

  const submitSessionRef = useRef<
    ((moves: PlayerMove[]) => Promise<void>) | null
  >(null);

  const declineRevive = useCallback(() => {
    const { score: baseScore } = engineRef.current.state;
    const runData = engineRef.current.getRunData();

    setRunSummary(
      getRunSummary(baseScore, runData?.moves ?? [], canSubmitTournament),
    );
    updateScore(baseScore);
    setOverlay("GAME_OVER");

    submitSessionRef.current?.(runData?.moves ?? []);
  }, [
    canSubmitTournament,
    getRunSummary,
    setOverlay,
    setRunSummary,
    updateScore,
  ]);

  const {
    isWatchingAd,
    reviveAd,
    submissionAd,
    queueSubmissionAd,
    resetReviveReward,
    ssvData,
  } = useGameAds({
    onReviveEarned: () => {
      engineRef.current.revive();
      setOverlay("PLAYING");
      setRunSummary(null);
    },
    onReviveDeclined: () => {
      if (overlayState === "REVIVE") {
        declineRevive();
      }
    },
    onSubmissionEarned: async (payload) => {
      await broadcastSponsoredTransactionMutation.mutateAsync({
        submissionId: payload.submissionId,
        serializedTx: payload.serializedTx,
      });
      submissionDeferredRef.current?.resolve(String(payload.submissionId));
      submissionDeferredRef.current = null;
    },
    onSubmissionFailed: (error) => {
      submissionDeferredRef.current?.reject(error);
      submissionDeferredRef.current = null;
    },
    onSubmissionCanceled: () => {
      submissionDeferredRef.current?.reject(new Error("Ad not completed."));
      submissionDeferredRef.current = null;
    },
  });

  const ensureReviveAdLoaded = useCallback(() => {
    if (!reviveAd.loaded && !reviveAd.loading) {
      reviveAd.loadAd();
    }
  }, [reviveAd]);

  const { registerUsedItem, startGame, submitSession, cancelPendingStart } =
    useGameSession({
      engine: engineRef.current,
      bestSubmittedScore,
      updateScore,
      setOverlay,
      resetPowerUps,
      setRunSummary,
      setPerfectCue,
      resetReviveReward,
      ensureReviveAdLoaded,
    });

  useEffect(() => {
    submitSessionRef.current = submitSession;
  }, [submitSession]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const startGameWithLoading = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      await startGame();
    } finally {
      if (isMountedRef.current) {
        setIsStarting(false);
      }
    }
  }, [isStarting, startGame]);

  const { consumeDropPoint, consumeRevive } = usePowerUpInventory({
    canUseDropPoint: dropPointAvailable,
    canUseRevive: reviveAvailable,
    onConsumeDropPoint: () => {},
    onConsumeRevive: consumeRevivePowerUp,
    registerUsedItem,
  });

  // Game event handling and input
  const handleEvents = useCallback(
    (events: EngineEvent[]) => {
      if (!events.length) return;
      applyEngineEvents(events);
      for (const event of events) {
        switch (event.type) {
          case "perfect": {
            setPerfectCue({
              x: event.x,
              y: event.y,
              createdAt: performance.now(),
            });
            break;
          }
          case "gameOver": {
            if (revivePowerUp.activated && !revivePowerUp.consumed) {
              engineRef.current.revivePowerUp();
              if (overlayState !== "PLAYING") {
                setOverlay("PLAYING");
              }
              setRunSummary(null);
              consumeRevive();
              break;
            }

            updateScore(event.value);
            if (overlayState !== "GAME_OVER") {
              setOverlay("GAME_OVER");
            }
            setRunSummary(
              getRunSummary(event.value, event.moves, canSubmitTournament),
            );
            submitSession(event.moves);
            break;
          }
          case "revivePrompt":
            updateScore(event.value);
            if (revivePowerUp.activated && !revivePowerUp.consumed) {
              engineRef.current.revivePowerUp();
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
      getRunSummary,
      overlayState,
      resetReviveReward,
      revivePowerUp.activated,
      revivePowerUp.consumed,
      setOverlay,
      setPerfectCue,
      setRunSummary,
      submitSession,
      updateScore,
      reviveAd,
    ],
  );

  const handleInputDown = useCallback(() => {
    engineRef.current.handleInputDown(isPlaying);
  }, [isPlaying]);

  const handleInputUp = useCallback(() => {
    engineRef.current.handleInputUp(isPlaying);
  }, [isPlaying]);

  const { handleSubmissionSuccess, handleSubmitSponsored, handleSubmitWallet } =
    useSubmissionActions({
      score,
      runSummary,
      setRunSummary,
      submissionContext,
      selectedNetwork,
      userProfile,
      highscore,
      setHighscore,
      raffleSubmissionsUsed,
      queueSubmissionAd,
      submissionDeferredRef,
    });

  const avatarSource = useMemo(
    () => (userData?.user.photo ? { uri: userData.user.photo } : undefined),
    [userData?.user.photo],
  );
  const displayName = useMemo(
    () => userData?.user.name ?? "Stacks user",
    [userData?.user.name],
  );
  const walletHasEnoughBalance = walletBalance > 0;
  const sponsoredSubmissionsLeftForContext =
    submissionContext?.kind === "raffle"
      ? raffleSubmissionsLeft
      : weeklyContestSubmissionsLeft;

  // Refs to prevent redundant ad operations
  const prevSsvDataRef = useRef(ssvData);
  const hasLoadedSubmissionAdRef = useRef(false);
  const submissionAdLoadRef = useRef(submissionAd.loadAd);
  const submissionAdShowRef = useRef(submissionAd.showAd);

  // Update refs when functions change
  useEffect(() => {
    submissionAdLoadRef.current = submissionAd.loadAd;
    submissionAdShowRef.current = submissionAd.showAd;
  }, [submissionAd.loadAd, submissionAd.showAd]);

  // Load submission ad when ssvData becomes available
  useEffect(() => {
    if (!ssvData) {
      prevSsvDataRef.current = null;
      hasLoadedSubmissionAdRef.current = false;
      return;
    }

    // Only load if ssvData changed and ad isn't already loaded/loading
    if (
      prevSsvDataRef.current !== ssvData &&
      !submissionAd.loaded &&
      !submissionAd.loading &&
      !hasLoadedSubmissionAdRef.current
    ) {
      submissionAdLoadRef.current();
      hasLoadedSubmissionAdRef.current = true;
    }
    prevSsvDataRef.current = ssvData;
  }, [ssvData, submissionAd.loaded, submissionAd.loading]);

  // Show submission ad when it becomes loaded
  useEffect(() => {
    if (!ssvData) return;
    // Only show if ad just became loaded
    if (submissionAd.loaded && hasLoadedSubmissionAdRef.current) {
      submissionAdShowRef.current();
      hasLoadedSubmissionAdRef.current = false;
    }
  }, [ssvData, submissionAd.loaded]);

  const handleAddFunds = useCallback(() => {
    router.push("/add-funds" as RelativePathString); // TOOD: when we add this screen we should need a way to navigate back to the game and still let user submit
  }, [router]);

  const handleRevive = useCallback(() => {
    if (reviveAd.loading || isWatchingAd) return;
    resetReviveReward();
    if (reviveAd.loaded) {
      reviveAd.showAd();
    } else {
      reviveAd.loadAd();
    }
  }, [isWatchingAd, resetReviveReward, reviveAd]);

  const handleEmitterReady = useCallback(
    (spawn: (x: number, y: number, color: string, count?: number) => void) => {
      engineRef.current.setParticleEmitter(spawn);
    },
    [],
  );

  // reset session when exiting the game
  const handleExit = useCallback(() => {
    cancelPendingStart();
    setIsStarting(false); // Reset loading state before exit
    resetSession();
    router.back();
  }, [cancelPendingStart, resetSession, router]);

  // reset session when restarting the game
  const handleRestart = useCallback(() => {
    cancelPendingStart();
    setIsStarting(false); // Reset loading state before restart
    resetSession();
    void startGameWithLoading();
  }, [cancelPendingStart, resetSession, startGameWithLoading]);

  const handleOpenContractDetails = useCallback(() => {
    contractDetailsSheetRef.current?.present();
  }, []);

  useEffect(() => {
    void hydrateHighscore();
  }, [hydrateHighscore]);

  useAutoStart(autoStart, overlayState, startGameWithLoading);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        cancelPendingStart();
        setIsStarting(false); // Reset loading state on back press
        resetSession();
        return false;
      },
    );

    return () => subscription.remove();
  }, [cancelPendingStart, resetSession]);

  const ghostActive =
    ghost.expiresAt !== null && performance.now() < ghost.expiresAt;
  const overlayStateForUi =
    isStarting || !assetsLoaded ? "PLAYING" : overlayState;
  return (
    <>
      <View className="flex-1 bg-[#F7F4F0]" onLayout={handleLayout}>
        <StatusBar barStyle="dark-content" />
        <BridgeGameCanvas
          engine={engineRef.current}
          canvasHeight={canvasHeight}
          worldOffsetY={worldOffsetY}
          isAnimating={overlayState === "PLAYING" || overlayState === "REVIVE"}
          isReviving={overlayState === "REVIVE"}
          perfectCue={perfectCue}
          showGhostPreview={ghostActive}
          onInputDown={handleInputDown}
          onInputUp={handleInputUp}
          onEmitterReady={handleEmitterReady}
          onEvents={handleEvents}
          onAssetsLoaded={handleAssetsLoaded}
        />
        <BridgeGameLayout
          overlayState={overlayStateForUi}
          actualOverlayState={overlayState}
          score={score}
          ghost={ghost}
          revivePowerUp={revivePowerUp}
          dropPointAvailable={dropPointAvailable}
          runSummary={runSummary}
          highScore={bestSubmittedScore ?? 0}
          isWatchingAd={isWatchingAd}
          adLoaded={reviveAd.loaded}
          adLoading={reviveAd.loading}
          adError={reviveAd.error}
          reviveAvailable={reviveAvailable}
          consumeDropPoint={consumeDropPoint}
          consumeRevive={consumeRevive}
          onRevive={handleRevive}
          onDeclineRevive={declineRevive}
          onRestart={handleRestart}
          onExit={handleExit}
          onSubmitToLeaderboard={handleSubmitLeaderboard}
          onSubmitToRaffle={handleSubmitRaffle}
          onActivateGhost={handleActivateGhost}
          onActivateRevive={handleActivateRevive}
        />
        {isStarting || !assetsLoaded ? (
          <View className="absolute inset-0 items-center justify-center bg-white">
            <ActivityIndicator size="small" color="#D1D5DB" />
          </View>
        ) : null}
      </View>
      <TournamentSubmissionSheet
        ref={submissionSheetRef}
        score={runSummary?.score ?? score}
        currentRank={null}
        projectedRank={null}
        tournamentId={tournamentId}
        tournamentName={tournamentName}
        canUseSponsored
        walletBalance={walletBalance}
        walletHasEnoughBalance={walletHasEnoughBalance}
        sponsoredSubmissionsLeft={sponsoredSubmissionsLeftForContext}
        onAddFunds={handleAddFunds}
        rewardAmount={rewardAmount}
        estimatedFee={0.002}
        showRankChange={showRankChange}
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
