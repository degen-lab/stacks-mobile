import { useCallback } from "react";

import { getActiveWalletAccount } from "@/lib/stacks/active-account";

import { useSponsoredStacksTransaction } from "./use-sponsored-stacks-transaction";
import { useSubmitStacksTransaction } from "./use-submit-stacks-transaction";

type ActiveWalletAccount = Awaited<ReturnType<typeof getActiveWalletAccount>>;

type BuildUnsignedTransaction = (
  activeWalletAccount: ActiveWalletAccount,
) => Promise<string>;

type SubmitBuiltWalletTransactionOptions = {
  buildUnsignedTransaction: BuildUnsignedTransaction;
  linkedSubmissionId?: number;
};

type SubmitBuiltSponsoredTransactionOptions = {
  buildUnsignedTransaction: BuildUnsignedTransaction;
};

export function useBuildAndSubmitStacksTransaction() {
  const { submitSponsoredTransaction, isSubmittingSponsored } =
    useSponsoredStacksTransaction();
  const { submitWalletTransaction, isSubmittingWallet } =
    useSubmitStacksTransaction();

  const submitBuiltWalletTransaction = useCallback(
    async ({
      buildUnsignedTransaction,
      linkedSubmissionId,
    }: SubmitBuiltWalletTransactionOptions) => {
      const activeWalletAccount = await getActiveWalletAccount();
      const unsignedSerializedTx =
        await buildUnsignedTransaction(activeWalletAccount);
      const txId = await submitWalletTransaction({
        accountIndex: activeWalletAccount.accountIndex,
        unsignedSerializedTx,
        linkedSubmissionId,
      });

      if (!txId) {
        throw new Error("Missing STX transaction id");
      }

      return txId;
    },
    [submitWalletTransaction],
  );

  const submitBuiltSponsoredTransaction = useCallback(
    async ({
      buildUnsignedTransaction,
    }: SubmitBuiltSponsoredTransactionOptions) => {
      const activeWalletAccount = await getActiveWalletAccount();
      const unsignedSerializedTx =
        await buildUnsignedTransaction(activeWalletAccount);

      return await submitSponsoredTransaction({
        originAddress: activeWalletAccount.address,
        accountIndex: activeWalletAccount.accountIndex,
        unsignedSerializedTx,
      });
    },
    [submitSponsoredTransaction],
  );

  return {
    submitBuiltWalletTransaction,
    submitBuiltSponsoredTransaction,
    isSubmittingWallet,
    isSubmittingSponsored,
  };
}
