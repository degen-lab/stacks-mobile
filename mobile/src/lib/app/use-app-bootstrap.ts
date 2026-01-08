import { useEffect, useRef, useState } from "react";

import { initializeAds } from "@/lib/ads";
import { hydrateAuth } from "@/lib/store/auth";
import { useGameStore } from "@/lib/store/game";
import { loadSettings } from "@/lib/store/settings";
import { loadSelectedTheme } from "@/lib/theme/use-selected-theme";

export function useAppBootstrap() {
  const hasInitializedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initApp = async () => {
      try {
        await Promise.all([
          hydrateAuth(),
          loadSelectedTheme(),
          loadSettings(),
          useGameStore.getState().hydrateSelectedSkin(),
          // TODO: add consent before initializing ads
          initializeAds(), // Initialize Google Mobile Ads SDK
        ]);
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setIsReady(true);
      }
    };

    initApp();
  }, []);

  return isReady;
}
