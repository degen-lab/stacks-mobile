import { useBroadcastTransactionMutation } from "@/api/game/transaction";
import { useCallback } from "react";
import { useSignTransaction } from "./use-sign-transaction";

type SubmitWalletTransactionOptions = {
  accountIndex: number;
  unsignedSerializedTx: string;
  linkedSubmissionId?: number;
};

/**
 * Submits a signed transaction via the game backend.
 * Used exclusively for game score submissions where the backend needs to
 * For non-game contract calls use walletKit.makeContractCall() directly.
 */
export function useSubmitStacksTransaction() {
  const broadcastTransactionMutation = useBroadcastTransactionMutation();
  const signTransaction = useSignTransaction();

  const submitWalletTransaction = useCallback(
    async ({
      accountIndex,
      unsignedSerializedTx,
      linkedSubmissionId,
    }: SubmitWalletTransactionOptions) => {
      const signedSerializedTx = await signTransaction(
        unsignedSerializedTx,
        accountIndex,
      );

      const response = await broadcastTransactionMutation.mutateAsync({
        serializedTx: signedSerializedTx,
        submissionId: linkedSubmissionId,
      });

      return response.data?.transactionResult?.txid;
    },
    [broadcastTransactionMutation, signTransaction],
  );

  return {
    submitWalletTransaction,
    isSubmittingWallet: broadcastTransactionMutation.isPending,
  };
}
