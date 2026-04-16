import { useCallback, useRef, useState } from "react";

import { getRewardedAdUnitId } from "@/lib/ads/rewarded-ad-unit";
import useRewardedAd from "@/lib/ads/use-rewarded-ad";
import { trackEvent } from "@/lib/analytics";
import { Env } from "@/lib/env";

type UseGameAdsOptions = {
  onReviveEarned: () => void;
  onReviveDeclined: () => void;
};

export const useGameAds = ({
  onReviveEarned,
  onReviveDeclined,
}: UseGameAdsOptions) => {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const adRewardedRef = useRef(false);

  const handleAdEarned = useCallback(() => {
    adRewardedRef.current = true;
    setIsWatchingAd(false);
    void trackEvent("revive_ad_earned");
    onReviveEarned();
  }, [onReviveEarned]);

  const handleAdOpened = useCallback(() => {
    setIsWatchingAd(true);
    void trackEvent("revive_ad_shown");
  }, []);

  const handleAdClosed = useCallback(() => {
    setIsWatchingAd(false);
    if (!adRewardedRef.current) {
      void trackEvent("revive_ad_dismissed");
      onReviveDeclined();
    }
    adRewardedRef.current = false;
  }, [onReviveDeclined]);

  const handleAdError = useCallback(() => {
    setIsWatchingAd(false);
  }, []);

  const reviveAd = useRewardedAd({
    adUnitId: getRewardedAdUnitId(),
    loadOnMount: Env.ADS_ENABLED === "true",
    onEarnedReward: handleAdEarned,
    onAdOpened: handleAdOpened,
    onAdClosed: handleAdClosed,
    onAdError: handleAdError,
  });

  const resetReviveReward = useCallback(() => {
    adRewardedRef.current = false;
  }, []);

  return {
    isWatchingAd,
    reviveAd,
    resetReviveReward,
  };
};
