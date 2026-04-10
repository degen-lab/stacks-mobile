import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  type RewardedAdReward,
} from "react-native-google-mobile-ads";

import { useAdsConsentStore } from "@/lib/store/ads-consent";

type UseRewardedAdOptions = {
  adUnitId: string;
  keywords?: string[];
  requestNonPersonalizedAdsOnly?: boolean;
  serverSideVerificationOptions?: {
    userId?: string;
    customData?: string;
  };
  loadOnMount?: boolean;
  onEarnedReward?: (reward: RewardedAdReward) => void;
  onAdClosed?: () => void;
  onAdOpened?: () => void;
  onAdError?: (error: { message?: string }) => void;
};

type UseRewardedAdState = {
  loaded: boolean;
  loading: boolean;
  error: string | null;
  canRequestAds: boolean;
  loadAd: () => boolean;
  showAd: () => boolean;
};

export default function useRewardedAd({
  adUnitId,
  keywords = ["game", "reward"],
  requestNonPersonalizedAdsOnly = false,
  serverSideVerificationOptions,
  loadOnMount = true,
  onEarnedReward,
  onAdClosed,
  onAdOpened,
  onAdError,
}: UseRewardedAdOptions): UseRewardedAdState {
  const hasResolvedConsent = useAdsConsentStore((state) => state.hasResolved);
  const canRequestAds = useAdsConsentStore((state) => state.canRequestAds);
  const isMobileAdsInitialized = useAdsConsentStore(
    (state) => state.isMobileAdsInitialized,
  );
  const canUseAds =
    hasResolvedConsent && canRequestAds && isMobileAdsInitialized;

  const rewarded = useMemo(
    () =>
      RewardedAd.createForAdRequest(adUnitId, {
        keywords,
        requestNonPersonalizedAdsOnly,
        serverSideVerificationOptions,
      }),
    [
      adUnitId,
      keywords,
      requestNonPersonalizedAdsOnly,
      serverSideVerificationOptions,
    ],
  );

  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to avoid re-registering listeners when callbacks change
  const onEarnedRewardRef = useRef(onEarnedReward);
  const onAdClosedRef = useRef(onAdClosed);
  const onAdOpenedRef = useRef(onAdOpened);
  const onAdErrorRef = useRef(onAdError);
  const rewardProcessedRef = useRef(false);

  // Update refs when callbacks change
  useEffect(() => {
    onEarnedRewardRef.current = onEarnedReward;
    onAdClosedRef.current = onAdClosed;
    onAdOpenedRef.current = onAdOpened;
    onAdErrorRef.current = onAdError;
  }, [onEarnedReward, onAdClosed, onAdOpened, onAdError]);

  const loadAd = useCallback(() => {
    if (!canUseAds || loading || loaded) return false;
    setLoading(true);
    setError(null);
    rewarded.load();
    return true;
  }, [canUseAds, rewarded, loading, loaded]);

  const showAd = useCallback(() => {
    if (!canUseAds || !loaded) return false;
    rewardProcessedRef.current = false; // Reset flag when showing new ad
    rewarded.show();
    return true;
  }, [canUseAds, loaded, rewarded]);

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setLoaded(true);
        setLoading(false);
        setError(null);
      },
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        // Guard against duplicate reward calls (common in test mode)
        if (rewardProcessedRef.current) {
          console.log("[Ads] Duplicate reward event ignored");
          return;
        }
        rewardProcessedRef.current = true;
        setLoaded(false);
        onEarnedRewardRef.current?.(reward);
      },
    );

    const unsubscribeOpened = rewarded.addAdEventListener(
      AdEventType.OPENED,
      () => {
        onAdOpenedRef.current?.();
      },
    );

    const unsubscribeClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setLoaded(false);
        rewardProcessedRef.current = false; // Reset flag when ad closes
        onAdClosedRef.current?.();
        // Auto-reload for next use
        loadAd();
      },
    );

    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (adError) => {
        const message =
          adError && "message" in adError
            ? String(adError.message)
            : "Failed to load ad";
        setError(message);
        setLoading(false);
        setLoaded(false);
        rewardProcessedRef.current = false;
        onAdErrorRef.current?.(adError);
      },
    );

    if (!canUseAds) {
      setLoaded(false);
      setLoading(false);
    } else if (loadOnMount) {
      loadAd();
    }

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeOpened();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [rewarded, canUseAds, loadOnMount, loadAd]);

  return {
    loaded,
    loading,
    error,
    canRequestAds: canUseAds,
    loadAd,
    showAd,
  };
}
