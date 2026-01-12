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
import { AppState, BackHandler, StatusBar } from "react-native";
import { useGameAds } from "../hooks/useGameAds";
import { useAutoStart } from "../hooks/useAutoStart";
import { useBridgeLayout } from "../hooks/useBridgeLayout";
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
import { useEngineRunner } from "../hooks/useEngineRunner";
import type { EngineEvent, PlayerMove, RenderState } from "../types";
import BridgeGameCanvas from "../components/canvas";
import BridgeGameLayout from "./BridgeGame.layout";

type BridgeGameProps = {
  autoStart?: boolean;
};

const BridgeGame = ({ autoStart = true }: BridgeGameProps) => {
  const router = useRouter();

  const { selectedNetwork } = useSelectedNetwork();
  const { balance: walletBalance } = useStxBalance();
  const { userData } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { data: leaderboardData } = useTournamentLeaderboard();
  const { data: tournamentData } = useTournamentData();
  const { data: currentTournamentSubmissions } =
    useCurrentTournamentSubmissions();
  const { data: sponsoredSubmissionsLeft } = useSponsoredSubmissionsLeft();
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
  const isMountedRef = useRef(true);
  const overlayState = useGameStore((state) => state.overlayState);
  const score = useGameStore((state) => state.score);
  const highscore = useGameStore((state) => state.highscore);
  const ghost = useGameStore((state) => state.ghost);
  const revivePowerUp = useGameStore((state) => state.revivePowerUp);
  const setHighscore = useGameStore((state) => state.setHighscore);
  const hydrateHighscore = useGameStore((state) => state.hydrateHighscore);
  const resetSession = useGameStore((state) => state.resetSession);
  const setOverlay = useGameStore((state) => state.setOverlay);
  const updateScore = useGameStore((state) => state.updateScore);
  const applyEngineEvents = useGameStore((state) => state.applyEngineEvents);
  const resetPowerUps = useGameStore((state) => state.resetPowerUps);
  const consumeRevivePowerUp = useGameStore(
    (state) => state.consumeRevivePowerUp,
  );
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
  const isPlaying = overlayState === "PLAYING";

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

  useEffect(() => {
    if (!ssvData) return;
    if (!submissionAd.loaded && !submissionAd.loading) {
      submissionAd.loadAd();
    }
  }, [ssvData, submissionAd]);

  useEffect(() => {
    if (!ssvData) return;
    if (submissionAd.loaded) {
      submissionAd.showAd();
    }
  }, [ssvData, submissionAd]);

  const handleAddFunds = useCallback(() => {
    router.push("/add-funds" as RelativePathString); // TOOD: when we add this screen we should need a way to navigate back to the game and still let user submit
  }, [router]);

  const { renderTick } = useEngineRunner({
    engine: engineRef.current,
    isPlaying,
    onEvents: handleEvents,
  });

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
    resetSession();
    router.back();
  }, [resetSession, router]);

  // reset session when restarting the game
  const handleRestart = useCallback(() => {
    resetSession();
    void startGameWithLoading();
  }, [resetSession, startGameWithLoading]);

  const handleOpenContractDetails = useCallback(() => {
    contractDetailsSheetRef.current?.present();
  }, []);

  useEffect(() => {
    void hydrateHighscore();
  }, [hydrateHighscore]);

  useAutoStart(autoStart, overlayState, startGameWithLoading);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" || isWatchingAd) return;
      cancelPendingStart();
      resetSession();
      setOverlay("START");
      setRunSummary(null);
      setPerfectCue(null);
    });

    return () => subscription.remove();
  }, [
    cancelPendingStart,
    isWatchingAd,
    resetSession,
    setOverlay,
    setPerfectCue,
    setRunSummary,
  ]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        cancelPendingStart();
        resetSession();
        return false;
      },
    );

    return () => subscription.remove();
  }, [cancelPendingStart, resetSession]);

  const state: RenderState = engineRef.current.getRenderState();
  const ghostActive =
    ghost.expiresAt !== null && performance.now() < ghost.expiresAt;
  return (
    <>
      <View className="flex-1 bg-[#F7F4F0]" onLayout={handleLayout}>
        <StatusBar barStyle="dark-content" />
        <BridgeGameCanvas
          state={state}
          canvasHeight={canvasHeight}
          worldOffsetY={worldOffsetY}
          renderTick={renderTick}
          isAnimating={overlayState === "PLAYING"}
          perfectCue={perfectCue}
          showGhostPreview={ghostActive}
          onInputDown={handleInputDown}
          onInputUp={handleInputUp}
          onEmitterReady={handleEmitterReady}
        />
        <BridgeGameLayout
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
        />
        {isStarting ? (
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
