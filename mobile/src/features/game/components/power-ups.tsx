import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { View } from "@/components/ui";
import { HeartIcon } from "@/components/ui/icons/heart";
import { RulerIcon } from "@/components/ui/icons/ruler";
import PowerUpButton from "./power-up-button";
import { useGameStore } from "@/lib/store/game";
import { GAMEPLAY_CONFIG } from "../config";

type PowerUpsContainerProps = {
  dropPointAvailable: boolean;
  reviveAvailable: boolean;
  consumeDropPoint: () => void;
  consumeRevive: () => void;
};

const PowerUpsContainer = ({
  dropPointAvailable,
  reviveAvailable,
  consumeDropPoint,
  consumeRevive,
}: PowerUpsContainerProps) => {
  const overlayState = useGameStore((state) => state.overlayState);
  const ghost = useGameStore((state) => state.ghost);
  const revivePowerUp = useGameStore((state) => state.revivePowerUp);
  const activateGhostPowerUp = useGameStore((state) => state.activateGhost);
  const activateRevivePowerUp = useGameStore(
    (state) => state.activateRevivePowerUp,
  );
  const [currentTime, setCurrentTime] = useState(performance.now());

  const handleActivateGhost = useCallback(() => {
    if (ghost.used || !dropPointAvailable) return;
    const now = performance.now();
    activateGhostPowerUp(now + GAMEPLAY_CONFIG.GHOST_DURATION_MS);
    consumeDropPoint();
  }, [activateGhostPowerUp, consumeDropPoint, dropPointAvailable, ghost.used]);

  const handleActivateRevive = useCallback(() => {
    if (revivePowerUp.activated || !reviveAvailable) return;
    activateRevivePowerUp();
    consumeRevive();
  }, [
    activateRevivePowerUp,
    consumeRevive,
    reviveAvailable,
    revivePowerUp.activated,
  ]);

  const ghostActive = useMemo(
    () => ghost.expiresAt !== null && currentTime < ghost.expiresAt,
    [ghost.expiresAt, currentTime],
  );
  const showDropPoint = dropPointAvailable || ghost.used || ghostActive;
  const showRevive =
    reviveAvailable || revivePowerUp.activated || revivePowerUp.consumed;

  useEffect(() => {
    if (ghost.expiresAt !== null) {
      setCurrentTime(performance.now());
    }
  }, [ghost.expiresAt]);

  useEffect(() => {
    if (!ghostActive || !ghost.expiresAt) return;

    const interval = setInterval(() => {
      const now = performance.now();
      setCurrentTime(now);
      if (ghost.expiresAt !== null && now >= ghost.expiresAt) {
        setCurrentTime(ghost.expiresAt as number);
        clearInterval(interval);
      }
    }, GAMEPLAY_CONFIG.GHOST_TIMER_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [ghostActive, ghost.expiresAt]);

  if (overlayState !== "PLAYING") return null;

  return (
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
                  ? `${Math.ceil((ghost.expiresAt! - currentTime) / 1000)}s`
                  : ghost.used
                    ? "Used"
                    : `${GAMEPLAY_CONFIG.GHOST_DURATION_MS / 1000}s`
              }
              isActive={ghostActive}
              isUsed={ghost.used}
              disabled={ghost.used || ghostActive}
              onPress={handleActivateGhost}
            />
          ) : null}
          {showRevive ? (
            <PowerUpButton
              icon={HeartIcon}
              label="Revive"
              status={
                revivePowerUp.consumed
                  ? "Used"
                  : revivePowerUp.activated
                    ? "Active"
                    : "1x"
              }
              isActive={revivePowerUp.activated && !revivePowerUp.consumed}
              isUsed={revivePowerUp.consumed}
              disabled={revivePowerUp.activated}
              onPress={handleActivateRevive}
            />
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
};

export default memo(PowerUpsContainer);
