import { memo } from "react";

import BridgeOverlays from "../components/overlays/overlays";
import type { RunSummary } from "../utils/runSummary";
import PowerUpsContainer from "../components/power-ups";
import ScoreDisplay from "../components/score-display";
import type {
  BridgeOverlayState,
  GhostState,
  RevivePowerUpState,
} from "../types";

type BridgeGameLayoutProps = {
  overlayState: BridgeOverlayState;
  actualOverlayState: BridgeOverlayState;
  score: number;
  ghost: GhostState;
  revivePowerUp: RevivePowerUpState;
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
  onActivateGhost: (expiresAt: number) => void;
  onActivateRevive: () => void;
};

const BridgeGameLayout = ({
  overlayState,
  actualOverlayState,
  score,
  ghost,
  revivePowerUp,
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
  onActivateGhost,
  onActivateRevive,
}: BridgeGameLayoutProps) => {
  return (
    <>
      <ScoreDisplay overlayState={overlayState} score={score} />
      <PowerUpsContainer
        overlayState={actualOverlayState}
        ghost={ghost}
        revivePowerUp={revivePowerUp}
        dropPointAvailable={dropPointAvailable}
        reviveAvailable={reviveAvailable}
        consumeDropPoint={consumeDropPoint}
        consumeRevive={consumeRevive}
        onActivateGhost={onActivateGhost}
        onActivateRevive={onActivateRevive}
      />

      <BridgeOverlays
        overlayState={overlayState}
        score={score}
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
