import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { useCallback, useRef } from "react";
import { Alert, Platform } from "react-native";

import {
  useBroadcastSponsoredTransactionMutation,
  useCreateSponsoredTransactionMutation,
} from "@/api/game/transaction";
import { useUserProfile } from "@/api/user";
import { getRewardedAdUnitId } from "@/lib/ads/rewarded-ad-unit";
import {
  CURRENT_CONSENT_VERSION,
  type ConsentDecision,
} from "@/lib/consent/types";
import { useConsentActions } from "@/lib/consent/use-consent-actions";
import { useSsvRewardedAdFlow } from "@/lib/ads/use-ssv-rewarded-ad-flow";
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

function showIosTrackingPrePrompt() {
  return new Promise<boolean>((resolve) => {
    let settled = false;

    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      "Allow personalized ads?",
      "iOS will ask for tracking permission. If you decline, sponsored transactions will still work with non-personalized ads.",
      [
        {
          text: "Keep non-personalized ads",
          style: "cancel",
          onPress: () => settle(false),
        },
        {
          text: "Continue",
          onPress: () => settle(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => settle(false),
      },
    );
  });
}

export function useSponsoredStacksTransaction() {
  const { data: userProfile } = useUserProfile();
  const userId = userProfile?.id;
  const consent = useConsentStore((state) => state.consent);
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
    if (consent?.adsPersonalization !== true) {
      return {
        requestNonPersonalizedAdsOnly: true,
      };
    }

    if (Platform.OS !== "ios") {
      return {
        requestNonPersonalizedAdsOnly: false,
      };
    }

    const permission = await getTrackingPermissionsAsync();

    if (permission.status === "granted") {
      return {
        requestNonPersonalizedAdsOnly: false,
      };
    }

    if (permission.status !== "undetermined") {
      return {
        requestNonPersonalizedAdsOnly: true,
      };
    }

    const shouldRequestTracking = await showIosTrackingPrePrompt();
    if (!shouldRequestTracking) {
      const nextConsent: ConsentDecision = {
        analytics: consent?.analytics === true,
        adsPersonalization: false,
        version: CURRENT_CONSENT_VERSION,
      };

      await saveConsent(nextConsent);

      return {
        requestNonPersonalizedAdsOnly: true,
      };
    }

    const requestedPermission = await requestTrackingPermissionsAsync();

    return {
      requestNonPersonalizedAdsOnly: requestedPermission.status !== "granted",
    };
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
