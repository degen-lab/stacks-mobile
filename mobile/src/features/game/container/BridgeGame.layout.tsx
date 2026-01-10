import { memo } from "react";

import BridgeOverlays from "../components/overlays/overlays";
import type { RunSummary } from "../utils/runSummary";
import PowerUpsContainer from "../components/power-ups";
import ScoreDisplay from "../components/score-display";
type BridgeGameLayoutProps = {
  dropPointAvailable: boolean;
  runSummary?: RunSummary | null;
  highScore?: number;
  isWatchingAd: boolean;
  adLoaded: boolean;
  adLoading: boolean;
  adError: string | null;
  reviveAvailable: boolean;
  consumeDropPoint: () => void;
  consumeRevive: () => void;
  onRevive: () => void;
  onDeclineRevive: () => void;
  onSubmitToRaffle?: () => void;
  onSubmitToLeaderboard?: () => void;
  onRestart: () => void;
  onExit?: () => void;
};

const BridgeGameLayout = ({
  dropPointAvailable,
  runSummary,
  highScore,
  isWatchingAd,
  adLoaded,
  adLoading,
  adError,
  reviveAvailable,
  consumeDropPoint,
  consumeRevive,
  onRevive,
  onDeclineRevive,
  onSubmitToRaffle,
  onSubmitToLeaderboard,
  onRestart,
  onExit,
}: BridgeGameLayoutProps) => {
  return (
    <>
      <ScoreDisplay />
      <PowerUpsContainer
        dropPointAvailable={dropPointAvailable}
        reviveAvailable={reviveAvailable}
        consumeDropPoint={consumeDropPoint}
        consumeRevive={consumeRevive}
      />

      <BridgeOverlays
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
    </>
  );
};

export default memo(BridgeGameLayout);
