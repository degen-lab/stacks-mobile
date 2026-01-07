import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { View } from "@/components/ui";
import { HeartIcon } from "@/components/ui/icons/heart";
import { RulerIcon } from "@/components/ui/icons/ruler";
import BridgeCanvas from "../components/BridgeCanvas";
import BridgeOverlays, { OverlayState } from "../components/BridgeOverlays";
import HeadsUpDisplay from "../components/HeadsUpDisplay";
import PowerUpButton from "../components/PowerUpButton";
import type { RunSummary } from "../overlays";
import type { RenderState } from "../types";

type BridgeGameLayoutProps = {
  onLayout: (event: LayoutChangeEvent) => void;
  renderState: RenderState;
  canvasHeight: number;
  worldOffsetY: number;
  renderTick: number;
  perfectCue: { x: number; y: number; createdAt: number } | null;
  ghostUsed: boolean;
  ghostExpiresAt: number | null;
  dropPointAvailable: boolean;
  uiState: OverlayState;
  uiScore: number;
  runSummary?: RunSummary | null;
  highScore?: number;
  isWatchingAd: boolean;
  adLoaded: boolean;
  adLoading: boolean;
  adError: string | null;
  onInputDown: () => void;
  onInputUp: () => void;
  onEmitterReady?: (
    spawn: (x: number, y: number, color: string, count?: number) => void,
  ) => void;
  onActivateGhost: () => void;
  reviveAvailable: boolean;
  revivePowerUpUsed: boolean;
  revivePowerUpConsumed: boolean;
  onActivateRevive: () => void;
  onRevive: () => void;
  onDeclineRevive: () => void;
  onSubmitToRaffle?: () => void;
  onSubmitToLeaderboard?: () => void;
  onRestart: () => void;
  onExit?: () => void;
};

const BridgeGameLayout = ({
  onLayout,
  renderState,
  canvasHeight,
  worldOffsetY,
  renderTick,
  perfectCue,
  ghostUsed,
  ghostExpiresAt,
  dropPointAvailable,
  uiState,
  uiScore,
  runSummary,
  highScore,
  isWatchingAd,
  adLoaded,
  adLoading,
  adError,
  onInputDown,
  onInputUp,
  onEmitterReady,
  onActivateGhost,
  reviveAvailable,
  revivePowerUpUsed,
  revivePowerUpConsumed,
  onActivateRevive,
  onRevive,
  onDeclineRevive,
  onSubmitToRaffle,
  onSubmitToLeaderboard,
  onRestart,
  onExit,
}: BridgeGameLayoutProps) => {
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState(performance.now());

  const ghostActive = useMemo(
    () => ghostExpiresAt !== null && currentTime < ghostExpiresAt,
    [ghostExpiresAt, currentTime],
  );
  const showDropPoint = dropPointAvailable || ghostUsed || ghostActive;
  const showRevive =
    reviveAvailable || revivePowerUpUsed || revivePowerUpConsumed;

  useEffect(() => {
    if (ghostExpiresAt !== null) {
      setCurrentTime(performance.now());
    }
  }, [ghostExpiresAt]);

  useEffect(() => {
    if (!ghostActive || !ghostExpiresAt) return;

    const interval = setInterval(() => {
      const now = performance.now();
      setCurrentTime(now);
      if (now >= ghostExpiresAt) {
        setCurrentTime(ghostExpiresAt);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [ghostActive, ghostExpiresAt]);

  return (
    <View className="flex-1 bg-[#F7F4F0]" onLayout={onLayout}>
      <StatusBar barStyle="dark-content" />
      <BridgeCanvas
        state={renderState}
        canvasHeight={canvasHeight}
        worldOffsetY={worldOffsetY}
        renderTick={renderTick}
        isAnimating={uiState === "PLAYING"}
        perfectCue={perfectCue}
        showGhostPreview={ghostActive}
        onInputDown={onInputDown}
        onInputUp={onInputUp}
        onEmitterReady={onEmitterReady}
      />

      {uiState === "PLAYING" ? (
        <HeadsUpDisplay topInset={insets.top} score={uiScore} />
      ) : null}

      {uiState === "PLAYING" ? (
        <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0">
          <LinearGradient
            pointerEvents="box-none"
            colors={["rgba(255, 152, 53, 0.8)", "rgba(255, 152, 53, 0.01)"]}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={{
              height: 140,
              paddingBottom: 0,
              paddingTop: 20,
              paddingHorizontal: 20,
            }}
          >
            <View className="w-full flex-row items-center justify-center gap-6 mt-4">
              {showDropPoint ? (
                <PowerUpButton
                  icon={RulerIcon}
                  label="Drop Point"
                  status={
                    ghostActive
                      ? `${Math.ceil((ghostExpiresAt! - currentTime) / 1000)}s`
                      : ghostUsed
                        ? "Used"
                        : "30s"
                  }
                  isActive={ghostActive}
                  isUsed={ghostUsed}
                  disabled={ghostUsed || ghostActive}
                  onPress={onActivateGhost}
                />
              ) : null}
              {showRevive ? (
                <PowerUpButton
                  icon={HeartIcon}
                  label="Revive"
                  status={
                    revivePowerUpConsumed
                      ? "Used"
                      : revivePowerUpUsed
                        ? "Active"
                        : "1x"
                  }
                  isActive={revivePowerUpUsed && !revivePowerUpConsumed}
                  isUsed={revivePowerUpConsumed}
                  disabled={revivePowerUpUsed}
                  onPress={onActivateRevive}
                />
              ) : null}
            </View>
          </LinearGradient>
        </View>
      ) : null}

      <BridgeOverlays
        uiState={uiState}
        uiScore={uiScore}
        runSummary={runSummary}
        highScore={highScore}
        onRestart={onRestart}
        onRevive={onRevive}
        onDeclineRevive={onDeclineRevive}
        onSubmitToRaffle={onSubmitToRaffle}
        onSubmitToLeaderboard={onSubmitToLeaderboard}
        onExit={onExit}
        isWatchingAd={isWatchingAd}
        adLoaded={adLoaded}
        adLoading={adLoading}
        adError={adError}
      />
    </View>
  );
};

export default BridgeGameLayout;
