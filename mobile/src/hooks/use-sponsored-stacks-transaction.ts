import { useCallback, useRef } from "react";
import { Platform } from "react-native";

import {
  useBroadcastSponsoredTransactionMutation,
  useCreateSponsoredTransactionMutation,
} from "@/api/game/transaction";
import { useUserProfile } from "@/api/user";
import { requestIosAdTracking } from "@/lib/ads/ios-tracking-permission";
import { getRewardedAdUnitId } from "@/lib/ads/rewarded-ad-unit";
import { CURRENT_CONSENT_VERSION } from "@/lib/consent/types";
import { useConsentActions } from "@/lib/consent/use-consent-actions";
import { useSsvRewardedAdFlow } from "@/lib/ads/use-ssv-rewarded-ad-flow";
import { useAuth } from "@/lib/store/auth";
import { useConsentStore } from "@/lib/store/consent";
import { useSignTransaction } from "./use-sign-transaction";

type QueuedSponsoredTransaction = {
  requestId: number;
  serializedTx: string;
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
};

type SubmitPreparedSponsoredTransactionOptions = {
  requestId: number;
  accountIndex: number;
  unsignedSerializedTx: string;
};

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

export function useSponsoredStacksTransaction() {
  const { data: userProfile } = useUserProfile();
  const userId = userProfile?.id;
  const { backendUserData } = useAuth();
  const pendingSync = useConsentStore((state) => state.pendingSync);
  const consent = pendingSync?.localConsent ?? backendUserData?.consent ?? null;
  const createSponsoredTransactionMutation =
    useCreateSponsoredTransactionMutation();
  const broadcastSponsoredTransactionMutation =
    useBroadcastSponsoredTransactionMutation();
  const { saveConsent } = useConsentActions();
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

  const getRewardedAdRequestOptions = useCallback(async () => {
    if (consent?.adsPersonalization !== true || Platform.OS !== "ios") {
      return {
        requestNonPersonalizedAdsOnly: consent?.adsPersonalization !== true,
      };
    }

    const tracking = await requestIosAdTracking();

    if (tracking === "declined") {
      await saveConsent({
        analytics: consent?.analytics === true,
        adsPersonalization: false,
        version: CURRENT_CONSENT_VERSION,
      });
    }

    return { requestNonPersonalizedAdsOnly: tracking !== "granted" };
  }, [consent?.adsPersonalization, consent?.analytics, saveConsent]);

  const submitPreparedSponsoredTransaction = useCallback(
    async ({
      requestId,
      accountIndex,
      unsignedSerializedTx,
    }: SubmitPreparedSponsoredTransactionOptions): Promise<number> => {
      if (!userId) {
        throw new Error("User profile not available.");
      }
      if (pendingRequestRef.current) {
        throw new Error(
          "Another sponsored transaction is already in progress.",
        );
      }

      const signedSerializedTx = await signTransaction(
        unsignedSerializedTx,
        accountIndex,
      );
      const { requestNonPersonalizedAdsOnly } =
        await getRewardedAdRequestOptions();

      return new Promise<number>((resolve, reject) => {
        pendingRequestRef.current = {
          resolve,
          reject,
        };

        queueSponsoredAd(
          {
            requestId,
            serializedTx: signedSerializedTx,
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
    }: SubmitSponsoredTransactionOptions): Promise<number> => {
      if (!userId) {
        throw new Error("User profile not available.");
      }

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
      });
    },
    [
      createSponsoredTransactionMutation,
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
