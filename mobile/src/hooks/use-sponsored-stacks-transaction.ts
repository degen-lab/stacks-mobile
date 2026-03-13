import {
  useBroadcastSponsoredTransactionMutation,
  useCreateSponsoredTransactionMutation,
} from "@/api/game/transaction";
import { useUserProfile } from "@/api/user";
import { getRewardedAdUnitId } from "@/lib/ads/rewarded-ad-unit";
import { useSsvRewardedAdFlow } from "@/lib/ads/use-ssv-rewarded-ad-flow";
import { useCallback, useRef } from "react";
import { useSignTransaction } from "./use-sign-transaction";

type PendingSponsoredTransaction = {
  requestId: number;
  serializedTx: string;
  resolvedValue: unknown;
};

type DeferredRef = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

type SubmitSponsoredTransactionOptions = {
  originAddress: string;
  accountIndex: number;
  unsignedSerializedTx: string;
};

type SubmitPreparedSponsoredTransactionOptions<TResult> = {
  requestId: number;
  accountIndex: number;
  unsignedSerializedTx: string;
  resolveValue?: TResult | ((requestId: number) => TResult);
};

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

function getResolvedValue<TResult>(
  requestId: number,
  resolveValue?: TResult | ((requestId: number) => TResult),
) {
  if (typeof resolveValue === "function") {
    return (resolveValue as (requestId: number) => TResult)(requestId);
  }

  if (resolveValue !== undefined) {
    return resolveValue;
  }

  return requestId as TResult;
}

export function useSponsoredStacksTransaction() {
  const { data: userProfile } = useUserProfile();
  const createSponsoredTransactionMutation =
    useCreateSponsoredTransactionMutation();
  const broadcastSponsoredTransactionMutation =
    useBroadcastSponsoredTransactionMutation();
  const signTransaction = useSignTransaction();
  const deferredRef = useRef<DeferredRef | null>(null);

  const { queue: queueSponsoredAd, isActive: isSponsoredFlowActive } =
    useSsvRewardedAdFlow<PendingSponsoredTransaction>(getRewardedAdUnitId(), {
      onEarned: async (pendingTx) => {
        await broadcastSponsoredTransactionMutation.mutateAsync({
          requestId: pendingTx.requestId,
          serializedTx: pendingTx.serializedTx,
        });
        deferredRef.current?.resolve(pendingTx.resolvedValue);
        deferredRef.current = null;
      },
      onCanceled: () => {
        deferredRef.current?.reject(new Error("Ad not completed."));
        deferredRef.current = null;
      },
      onError: (error) => {
        deferredRef.current?.reject(toError(error));
        deferredRef.current = null;
      },
    });

  const submitPreparedSponsoredTransaction = useCallback(
    async <TResult = number>({
      requestId,
      accountIndex,
      unsignedSerializedTx,
      resolveValue,
    }: SubmitPreparedSponsoredTransactionOptions<TResult>): Promise<TResult> => {
      if (!userProfile?.id) {
        throw new Error("User profile not available.");
      }
      if (deferredRef.current) {
        throw new Error(
          "Another sponsored transaction is already in progress.",
        );
      }

      const signedSerializedTx = await signTransaction(
        unsignedSerializedTx,
        accountIndex,
      );
      const resolvedValue = getResolvedValue(requestId, resolveValue);

      return await new Promise<TResult>((resolve, reject) => {
        deferredRef.current = {
          resolve: resolve as (value: unknown) => void,
          reject,
        };

        queueSponsoredAd(
          {
            requestId,
            serializedTx: signedSerializedTx,
            resolvedValue,
          },
          {
            userId: String(userProfile.id),
            customData: String(requestId),
          },
        );
      });
    },
    [queueSponsoredAd, signTransaction, userProfile?.id],
  );

  const submitSponsoredTransaction = useCallback(
    async ({
      originAddress,
      accountIndex,
      unsignedSerializedTx,
    }: SubmitSponsoredTransactionOptions): Promise<number> => {
      if (!userProfile?.id) {
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
      userProfile?.id,
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
