import { useEffect, useRef, useState } from "react";

import { initializeAds } from "@/lib/ads/initialize-ads";
import { hydrateAuth } from "@/lib/store/auth";
import { loadBalanceVisibility } from "@/lib/store/balance-visibility";
import { useConsentStore } from "@/lib/store/consent";
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
        await hydrateAuth();
        await Promise.all([
          loadBalanceVisibility(),
          loadSelectedTheme(),
          loadSettings(),
          useGameStore.getState().hydrateSelectedSkin(),
          useConsentStore.getState().hydrate(),
          initializeAds(),
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
