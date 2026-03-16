import {
  useBroadcastSponsoredTransactionMutation,
  useCreateSponsoredTransactionMutation,
} from "@/api/game/transaction";
import { useUserProfile } from "@/api/user";
import { getRewardedAdUnitId } from "@/lib/ads/rewarded-ad-unit";
import { useSsvRewardedAdFlow } from "@/lib/ads/use-ssv-rewarded-ad-flow";
import { useCallback, useRef } from "react";
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
        );
      });
    },
    [queueSponsoredAd, signTransaction, userId],
  );

  const submitSponsoredTransaction = useCallback(
    async ({
      originAddress,
      accountIndex,
      unsignedSerializedTx,
    }: SubmitSponsoredTransactionOptions): Promise<number> => {
      if (!userId) {
        throw new Error("User profile not available.");
      }

      const response = await createSponsoredTransactionMutation.mutateAsync({
        originAddress,
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
