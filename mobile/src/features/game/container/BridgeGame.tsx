import {
  useCurrentTournamentSubmissions,
  useTournamentData,
  useTournamentLeaderboard,
} from "@/api/";
import { useSponsoredSubmissionsLeft, useUserProfile } from "@/api/user";
import { getItemVariant } from "@/api/user/types";
import { GetAssetSheet } from "@/features/transfer/components/get-asset-sheet";
import { useTransferSheet } from "@/features/transfer";
import { useTransak } from "@/features/transak/context/transak-context";
import { ItemVariant, TournamentStatusEnum } from "@/lib/enums";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "nativewind";
import { BackHandler, StatusBar } from "react-native";
import { useGameAds } from "../hooks/useGameAds";
import { useBridgeLayout } from "../hooks/useBridgeLayout";
import { useAutoStart } from "../hooks/useAutoStart";
import { useGameSubmissionFeeArgs } from "../hooks/useGameSubmissionFeeArgs";
import { useGameSession } from "../hooks/useGameSession";
import { usePowerUpInventory } from "../hooks/usePowerUpInventory";
import { useRunSummary } from "../hooks/useRunSummary";
import { useSubmissionActions } from "../hooks/useSubmissionActions";
import { useSubmissionSheet } from "../hooks/useSubmissionSheet";

import { TournamentSubmissionSheet } from "@/components/tournament-submission-sheet";
import { ActivityIndicator, View, colors } from "@/components/ui";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { useAuth } from "@/lib/store/auth";
import { useGameStore } from "@/lib/store/game";
import { useSelectedNetwork } from "@/lib/store/settings";
import { StacksBridgeEngine } from "../engine";
import { VISUAL_CONFIG } from "../config";
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
  const { openTransfer } = useTransferSheet();
  const { openTransak } = useTransak();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const canvasBgColors = isDark
    ? [...VISUAL_CONFIG.DARK_SCENE.BACKGROUND_COLORS]
    : [VISUAL_CONFIG.COLORS.BG_TOP, VISUAL_CONFIG.COLORS.BG_BOT];
  const canvasBgPositions = undefined;

  const { selectedNetwork } = useSelectedNetwork();
  const { balance: walletBalance } = useStxBalance();
  const { userData } = useAuth();
  const [perfectCue, setPerfectCue] = useState<{
    x: number;
    y: number;
    createdAt: number;
  } | null>(null);
  const { canvasHeight, handleLayout, maxBridgeLength, worldOffsetY } =
    useBridgeLayout();
  const [isStarting, setIsStarting] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [getAssetSheetOpen, setGetAssetSheetOpen] = useState(false);
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

  useEffect(() => {
    engineRef.current.setMaxBridgeLength(maxBridgeLength);
  }, [maxBridgeLength]);

  const {
    submissionContext,
    submissionOpenCount,
    submissionSheetRef,
    handleSubmissionCancel,
    handleSubmitLeaderboard,
    handleSubmitRaffle,
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

  const { isWatchingAd, reviveAd, resetReviveReward } = useGameAds({
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
      highscore,
      setHighscore,
      raffleSubmissionsUsed,
    });
  const submissionScore = runSummary?.score ?? score;
  const gameContractId = CONTRACTS[selectedNetwork]?.game || "";
  const { feeFunctionArgs, isLoadingFeeArgs, nextUserNonce } =
    useGameSubmissionFeeArgs({
      contractId: gameContractId,
      score: submissionScore,
      tournamentId: tournamentData?.tournamentId,
      enabled: submissionContext !== null,
    });
  const contractArgs = useMemo(
    () => [
      ...(tournamentData?.tournamentId != null
        ? [
            {
              name: "tournament-id",
              value: String(tournamentData.tournamentId),
              type: "uint",
            },
          ]
        : []),
      {
        name: "score",
        value: String(submissionScore),
        type: "uint",
      },
      ...(nextUserNonce != null
        ? [
            {
              name: "user-nonce",
              value: String(nextUserNonce),
              type: "uint",
            },
          ]
        : []),
    ],
    [nextUserNonce, submissionScore, tournamentData?.tournamentId],
  );

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

  const handleAddFunds = useCallback(() => {
    setGetAssetSheetOpen(true);
  }, []);

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
      <View
        className="flex-1"
        style={{ backgroundColor: canvasBgColors[0] }}
        onLayout={handleLayout}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <BridgeGameCanvas
          engine={engineRef.current}
          canvasHeight={canvasHeight}
          worldOffsetY={worldOffsetY}
          bgColors={canvasBgColors}
          bgPositions={canvasBgPositions}
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
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: canvasBgColors[0] }}
          >
            <ActivityIndicator
              size="small"
              color={
                isDark
                  ? VISUAL_CONFIG.DARK_SCENE.HUD_HELPER
                  : colors.neutral[300]
              }
            />
          </View>
        ) : null}
      </View>
      <TournamentSubmissionSheet
        ref={submissionSheetRef}
        score={submissionScore}
        currentRank={null}
        projectedRank={null}
        tournamentId={tournamentId}
        tournamentName={tournamentName}
        canUseSponsored
        walletBalance={walletBalance}
        walletHasEnoughBalance={walletHasEnoughBalance}
        sponsoredSubmissionsLeft={sponsoredSubmissionsLeftForContext}
        onAddFunds={handleAddFunds}
        showRankChange={showRankChange}
        userDisplayName={displayName}
        userAvatarSource={avatarSource}
        onSubmitSponsored={handleSubmitSponsored}
        onSubmitWallet={handleSubmitWallet}
        onCancel={handleSubmissionCancel}
        onSuccess={handleSubmissionSuccess}
        canSubmit={canSubmitTournament}
        resetKey={submissionOpenCount}
        weeklyContestSubmissionsLeft={weeklyContestSubmissionsLeft}
        raffleSubmissionsLeft={raffleSubmissionsLeft}
        network={
          selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1)
        }
        contractAddress={gameContractId || "Not configured"}
        functionName={SC_FUNCTIONS.game.publicFunctions.SUBMIT_SCORE}
        contractArgs={contractArgs}
        feeFunctionArgs={feeFunctionArgs}
        isLoadingFeeArgs={isLoadingFeeArgs}
      />
      <GetAssetSheet
        open={getAssetSheetOpen}
        asset={getAssetSheetOpen ? "STX" : null}
        onClose={() => setGetAssetSheetOpen(false)}
        onBuy={() => openTransak("STX", "buy")}
        onReceive={() =>
          openTransfer({ mode: "receive", receive: { asset: "STX" } })
        }
      />
    </>
  );
};

export default BridgeGame;
