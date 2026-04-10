import { useCallback, useRef } from "react";
import { Platform } from "react-native";

import {
  useBroadcastSponsoredTransactionMutation,
  useCreateSponsoredTransactionMutation,
} from "@/api/game/transaction";
import { useUserProfile } from "@/api/user";
import { requestIosAdTracking } from "@/lib/ads/ios-tracking-permission";
import { getRewardedAdUnitId } from "@/lib/ads/rewarded-ad-unit";
import { useSsvRewardedAdFlow } from "@/lib/ads/use-ssv-rewarded-ad-flow";
import { useAdsConsentStore } from "@/lib/store/ads-consent";
import { useSignTransaction } from "./use-sign-transaction";

type QueuedSponsoredTransaction = {
  requestId: number;
  serializedTx: string;
  dependsOnRequestId?: number;
};

type PendingSponsoredRequest = {
  resolve: (requestId: number) => void;
  reject: (error: Error) => void;
};

type SubmitSponsoredTransactionOptions = {
  originAddress: string;
  accountIndex: number;
  unsignedSerializedTx: string;
  defiOperationId?: number;
  dependsOnRequestId?: number;
};

type SubmitPreparedSponsoredTransactionOptions = {
  requestId: number;
  accountIndex: number;
  unsignedSerializedTx: string;
  dependsOnRequestId?: number;
};

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

export function useSponsoredStacksTransaction() {
  const { data: userProfile } = useUserProfile();
  const userId = userProfile?.id;
  const hasResolvedAdsConsent = useAdsConsentStore(
    (state) => state.hasResolved,
  );
  const canRequestAds = useAdsConsentStore((state) => state.canRequestAds);
  const adsPersonalization = useAdsConsentStore(
    (state) => state.adsPersonalization,
  );
  const isMobileAdsInitialized = useAdsConsentStore(
    (state) => state.isMobileAdsInitialized,
  );
  const createSponsoredTransactionMutation =
    useCreateSponsoredTransactionMutation();
  const broadcastSponsoredTransactionMutation =
    useBroadcastSponsoredTransactionMutation();
  const signTransaction = useSignTransaction();
  const pendingRequestRef = useRef<PendingSponsoredRequest | null>(null);

  const clearPendingRequest = useCallback(() => {
    pendingRequestRef.current = null;
  }, []);

  const resolvePendingRequest = useCallback(
    (requestId: number) => {
      pendingRequestRef.current?.resolve(requestId);
      clearPendingRequest();
    },
    [clearPendingRequest],
  );

  const rejectPendingRequest = useCallback(
    (error: unknown) => {
      pendingRequestRef.current?.reject(toError(error));
      clearPendingRequest();
    },
    [clearPendingRequest],
  );

  const { queue: queueSponsoredAd, isActive: isSponsoredFlowActive } =
    useSsvRewardedAdFlow<QueuedSponsoredTransaction>(getRewardedAdUnitId(), {
      onEarned: async (pendingTx) => {
        await broadcastSponsoredTransactionMutation.mutateAsync({
          requestId: pendingTx.requestId,
          serializedTx: pendingTx.serializedTx,
          dependsOnRequestId: pendingTx.dependsOnRequestId,
        });
        resolvePendingRequest(pendingTx.requestId);
      },
      onCanceled: () => {
        rejectPendingRequest(new Error("Ad not completed."));
      },
      onError: (error) => {
        rejectPendingRequest(error);
      },
    });

  const ensureSponsoredAdsAvailable = useCallback(() => {
    if (!hasResolvedAdsConsent) {
      throw new Error("Ads are still preparing. Please try again in a moment.");
    }

    if (!canRequestAds || !isMobileAdsInitialized) {
      throw new Error("Sponsored transactions are unavailable right now.");
    }
  }, [canRequestAds, hasResolvedAdsConsent, isMobileAdsInitialized]);

  const getRewardedAdRequestOptions = useCallback(async () => {
    ensureSponsoredAdsAvailable();

    if (adsPersonalization !== true || Platform.OS !== "ios") {
      return {
        requestNonPersonalizedAdsOnly: adsPersonalization !== true,
      };
    }

    const tracking = await requestIosAdTracking();

    return { requestNonPersonalizedAdsOnly: tracking !== "granted" };
  }, [adsPersonalization, ensureSponsoredAdsAvailable]);

  const submitPreparedSponsoredTransaction = useCallback(
    async ({
      requestId,
      accountIndex,
      unsignedSerializedTx,
      dependsOnRequestId,
    }: SubmitPreparedSponsoredTransactionOptions): Promise<number> => {
      if (!userId) {
        throw new Error("User profile not available.");
      }
      if (pendingRequestRef.current) {
        throw new Error(
          "Another sponsored transaction is already in progress.",
        );
      }

      const { requestNonPersonalizedAdsOnly } =
        await getRewardedAdRequestOptions();
      const signedSerializedTx = await signTransaction(
        unsignedSerializedTx,
        accountIndex,
      );

      return new Promise<number>((resolve, reject) => {
        pendingRequestRef.current = {
          resolve,
          reject,
        };

        queueSponsoredAd(
          {
            requestId,
            serializedTx: signedSerializedTx,
            dependsOnRequestId,
          },
          {
            userId: String(userId),
            customData: String(requestId),
          },
          requestNonPersonalizedAdsOnly,
        );
      });
    },
    [getRewardedAdRequestOptions, queueSponsoredAd, signTransaction, userId],
  );

  const submitSponsoredTransaction = useCallback(
    async ({
      originAddress,
      accountIndex,
      unsignedSerializedTx,
      defiOperationId,
      dependsOnRequestId,
    }: SubmitSponsoredTransactionOptions): Promise<number> => {
      if (!userId) {
        throw new Error("User profile not available.");
      }
      ensureSponsoredAdsAvailable();

      const response = await createSponsoredTransactionMutation.mutateAsync({
        originAddress,
        defiOperationId,
      });
      const requestId = response.data?.requestId;
      if (!requestId) {
        throw new Error("Unable to create sponsored transaction request.");
      }

      return await submitPreparedSponsoredTransaction({
        requestId,
        accountIndex,
        unsignedSerializedTx,
        dependsOnRequestId,
      });
    },
    [
      createSponsoredTransactionMutation,
      ensureSponsoredAdsAvailable,
      submitPreparedSponsoredTransaction,
      userId,
    ],
  );

  return {
    submitSponsoredTransaction,
    submitPreparedSponsoredTransaction,
    isSubmittingSponsored:
      createSponsoredTransactionMutation.isPending ||
      broadcastSponsoredTransactionMutation.isPending ||
      isSponsoredFlowActive,
  };
}
