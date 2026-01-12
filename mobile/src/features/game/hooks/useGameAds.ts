import { useCallback, useRef, useState } from "react";
import { TestIds } from "react-native-google-mobile-ads";

import useRewardedAd from "@/lib/ads/use-rewarded-ad";
import { Env } from "@/lib/env";

type UseGameAdsOptions = {
  onReviveEarned: () => void;
  onReviveDeclined: () => void;
  onSubmissionEarned: (payload: {
    submissionId: number;
    serializedTx: string;
  }) => Promise<void>;
  onSubmissionFailed: (error: Error) => void;
  onSubmissionCanceled: () => void;
};

type SubmissionPayload = {
  submissionId: number;
  serializedTx: string;
};

export const useGameAds = ({
  onReviveEarned,
  onReviveDeclined,
  onSubmissionEarned,
  onSubmissionFailed,
  onSubmissionCanceled,
}: UseGameAdsOptions) => {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [pendingSubmission, setPendingSubmission] =
    useState<SubmissionPayload | null>(null);
  const [ssvData, setSsvData] = useState<{
    userId: string;
    customData: string;
  } | null>(null);
  const submissionRewardedRef = useRef(false);
  const adRewardedRef = useRef(false);

  const adUnitId =
    Env.APP_ENV === "production"
      ? Env.ANDROID_REWARDS_AD_MOBIN_KEY
      : TestIds.REWARDED;

  const handleAdEarned = useCallback(() => {
    if (pendingSubmission) return; // Don't revive if showing submission ad
    adRewardedRef.current = true;
    setIsWatchingAd(false);
    onReviveEarned();
  }, [onReviveEarned, pendingSubmission]);

  const handleAdOpened = useCallback(() => {
    setIsWatchingAd(true);
  }, []);

  const handleAdClosed = useCallback(() => {
    setIsWatchingAd(false);
    if (!adRewardedRef.current) {
      onReviveDeclined();
    }
    adRewardedRef.current = false;
  }, [onReviveDeclined]);

  const handleAdError = useCallback(() => {
    setIsWatchingAd(false);
  }, []);

  const reviveAd = useRewardedAd({
    adUnitId,
    loadOnMount: true,
    onEarnedReward: handleAdEarned,
    onAdOpened: handleAdOpened,
    onAdClosed: handleAdClosed,
    onAdError: handleAdError,
  });

  const submissionAd = useRewardedAd({
    adUnitId,
    loadOnMount: false,
    serverSideVerificationOptions: ssvData ?? undefined,
    onEarnedReward: async () => {
      if (!pendingSubmission) return;
      submissionRewardedRef.current = true;
      try {
        await onSubmissionEarned(pendingSubmission);
      } catch (error) {
        const nextError =
          error instanceof Error ? error : new Error(String(error));
        onSubmissionFailed(nextError);
      } finally {
        setPendingSubmission(null);
        setSsvData(null);
      }
    },
    onAdClosed: () => {
      if (!submissionRewardedRef.current) {
        onSubmissionCanceled();
        setPendingSubmission(null);
        setSsvData(null);
      }
      submissionRewardedRef.current = false;
    },
    onAdError: (error) => {
      onSubmissionFailed(new Error(error?.message ?? "Ad failed to load."));
      setPendingSubmission(null);
      setSsvData(null);
      submissionRewardedRef.current = false;
    },
  });

  const queueSubmissionAd = useCallback(
    (
      payload: SubmissionPayload,
      ssv: { userId: string; customData: string },
    ) => {
      setPendingSubmission(payload);
      setSsvData(ssv);
    },
    [],
  );

  const resetReviveReward = useCallback(() => {
    adRewardedRef.current = false;
  }, []);

  return {
    adUnitId,
    isWatchingAd,
    reviveAd,
    submissionAd,
    queueSubmissionAd,
    resetReviveReward,
    pendingSubmission,
    ssvData,
  };
};
