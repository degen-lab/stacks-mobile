import { useEffect, useRef } from "react";

import type { BridgeOverlayState } from "@/lib/store/game";

export const useAutoStart = (
  enabled: boolean,
  overlayState: BridgeOverlayState,
  startGame: () => void | Promise<void>,
) => {
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (enabled && overlayState === "START" && !triggeredRef.current) {
      triggeredRef.current = true;
      void startGame();
    }
    if (overlayState !== "START") {
      triggeredRef.current = false;
    }
  }, [enabled, overlayState, startGame]);
};
