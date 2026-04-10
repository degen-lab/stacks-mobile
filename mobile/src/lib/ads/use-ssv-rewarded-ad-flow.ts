import { useCallback, useEffect, useRef, useState } from "react";
import useRewardedAd from "./use-rewarded-ad";
import { trackEvent } from "@/lib/analytics";

type SsvData = { userId: string; customData: string };

type UseSsvRewardedAdFlowCallbacks<TPayload> = {
  onEarned: (payload: TPayload) => Promise<void>;
  onCanceled: () => void;
  onError: (error: Error) => void;
};

/**
 * Encapsulates the full lifecycle of an SSV-gated rewarded ad:
 *   queue(payload, ssv) → load → show → earned/canceled/error callback
 *
 * The caller never touches loadAd/showAd directly; sequencing is handled here.
 * Callbacks are held in refs so callers don't need to memoize them.
 */
export function useSsvRewardedAdFlow<TPayload>(
  adUnitId: string,
  { onEarned, onCanceled, onError }: UseSsvRewardedAdFlowCallbacks<TPayload>,
) {
  // Keep callbacks fresh on every render without causing re-subscriptions
  const onEarnedRef = useRef(onEarned);
  onEarnedRef.current = onEarned;
  const onCanceledRef = useRef(onCanceled);
  onCanceledRef.current = onCanceled;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Payload lives in a ref — only callbacks read it, no render needed
  const pendingRef = useRef<TPayload | null>(null);
  // True between EARNED_REWARD and CLOSED so we don't call onCanceled after a reward
  const rewardedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const prevSsvRef = useRef<SsvData | null>(null);
  const [requestNonPersonalizedAdsOnly, setRequestNonPersonalizedAdsOnly] =
    useState(false);

  // ssvData is state because useRewardedAd re-creates the ad instance when it changes
  // (SSV options are baked into the ad at creation time, not at load time)
  const [ssvData, setSsvData] = useState<SsvData | null>(null);

  // Called after the full flow completes (reward, cancel, or error)
  // Note: rewardedRef is reset here AFTER onAdClosed already returned (CLOSED fires
  // during the async await in onEarnedReward, before clear() runs)
  const clear = useCallback(() => {
    pendingRef.current = null;
    setSsvData(null);
    setRequestNonPersonalizedAdsOnly(false);
    rewardedRef.current = false;
  }, []);

  const ad = useRewardedAd({
    adUnitId,
    loadOnMount: false,
    requestNonPersonalizedAdsOnly,
    serverSideVerificationOptions: ssvData ?? undefined,
    onAdOpened: () => {
      void trackEvent("sponsored_ad_shown");
    },
    onEarnedReward: async () => {
      const payload = pendingRef.current;
      if (!payload) return;
      rewardedRef.current = true;
      void trackEvent("sponsored_ad_earned");
      try {
        await onEarnedRef.current(payload);
      } catch (error) {
        onErrorRef.current(
          error instanceof Error ? error : new Error(String(error)),
        );
      } finally {
        clear();
      }
    },
    onAdClosed: () => {
      // CLOSED fires during the await in onEarnedReward — rewardedRef is still true
      if (rewardedRef.current) {
        rewardedRef.current = false;
        return;
      }
      void trackEvent("sponsored_ad_dismissed");
      onCanceledRef.current();
      clear();
    },
    onAdError: (error) => {
      void trackEvent("sponsored_ad_failed");
      onErrorRef.current(new Error(error?.message ?? "Ad failed to load."));
      clear();
    },
  });

  // Load the ad once when ssvData is first set
  useEffect(() => {
    if (!ssvData) {
      prevSsvRef.current = null;
      hasLoadedRef.current = false;
      return;
    }
    if (
      prevSsvRef.current !== ssvData &&
      !ad.loaded &&
      !ad.loading &&
      !hasLoadedRef.current
    ) {
      const didStartLoading = ad.loadAd();
      hasLoadedRef.current = didStartLoading;
    }
    prevSsvRef.current = ssvData;
  }, [ad, ssvData]);

  // Show the ad as soon as it finishes loading
  useEffect(() => {
    if (!ssvData) return;
    if (ad.loaded && hasLoadedRef.current) {
      ad.showAd();
      hasLoadedRef.current = false;
    }
  }, [ad, ssvData]);

  const queue = useCallback(
    (
      payload: TPayload,
      ssv: SsvData,
      nextRequestNonPersonalizedAdsOnly: boolean = false,
    ) => {
      pendingRef.current = payload;
      setRequestNonPersonalizedAdsOnly(nextRequestNonPersonalizedAdsOnly);
      setSsvData(ssv);
    },
    [],
  );

  return {
    queue,
    isActive: ssvData !== null || ad.loading || ad.loaded,
  };
}
