import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  broadcastTransaction,
  deserializeTransaction,
  PostConditionMode,
} from "@stacks/transactions";

import { useUpdateDefiOperation, type SwapParamsData } from "@/api/defi";
import { getActiveWalletAccount } from "@/lib/stacks/active-account";
import { getHiroApiBase } from "@/lib/stacks/network";
import { parseSerializedContractCallParams } from "@/lib/stacks/parse-serialized-clarity";
import { buildUnsignedContractCall } from "@/lib/stacks/transaction-builder";
import { useSelectedNetwork } from "@/lib/store/settings";
import { useSignTransaction } from "@/hooks/use-sign-transaction";
import { useSponsoredStacksTransaction } from "@/hooks/use-sponsored-stacks-transaction";

type ExecuteSwapOptions = {
  swapParams: SwapParamsData;
  feeMicroStx?: number;
};

export function useSwapExecution() {
  const queryClient = useQueryClient();
  const signTransaction = useSignTransaction();
  const { selectedNetwork } = useSelectedNetwork();
  const updateDefiOperation = useUpdateDefiOperation();
  const { submitSponsoredTransaction, isSubmittingSponsored } =
    useSponsoredStacksTransaction();
  const [isExecuting, setIsExecuting] = useState(false);

  const invalidateBalances = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["stacks-user-balances"] }),
      queryClient.invalidateQueries({ queryKey: ["sbtc"] }),
      queryClient.invalidateQueries({ queryKey: ["swap-params"] }),
    ]);
  }, [queryClient]);

  const executeSwap = useCallback(
    async ({ swapParams, feeMicroStx }: ExecuteSwapOptions) => {
      setIsExecuting(true);

      try {
        const { account, accountIndex } = await getActiveWalletAccount();
        const {
          contractAddress,
          contractName,
          functionName,
          functionArgs,
          postConditions,
        } = parseSerializedContractCallParams(swapParams.contractCallParams);

        const unsignedSerializedTx = await buildUnsignedContractCall({
          contractId: `${contractAddress}.${contractName}`,
          functionName,
          functionArgs,
          postConditions,
          network: selectedNetwork,
          publicKey: account.publicKey,
          feeMicroStx,
        });

        const signedTxHex = await signTransaction(
          unsignedSerializedTx,
          accountIndex,
        );
        const txHex = signedTxHex.startsWith("0x")
          ? signedTxHex.slice(2)
          : signedTxHex;
        const response = await broadcastTransaction({
          transaction: deserializeTransaction(txHex),
          client: { baseUrl: getHiroApiBase(selectedNetwork) },
        });

        const txId =
          typeof (response as { txid?: unknown }).txid === "string"
            ? (response as { txid: string }).txid
            : null;

        if (!txId) {
          const rejectedResponse = response as {
            reason?: string;
            reason_data?: { message?: string };
          };
          throw new Error(
            rejectedResponse.reason_data?.message ??
              rejectedResponse.reason ??
              "Transaction broadcast failed.",
          );
        }

        await updateDefiOperation.mutateAsync({
          id: swapParams.operation.id,
          txId,
        });

        await invalidateBalances();

        return txId;
      } finally {
        setIsExecuting(false);
      }
    },
    [invalidateBalances, selectedNetwork, signTransaction, updateDefiOperation],
  );

  const executeSwapSponsored = useCallback(
    async ({ swapParams }: ExecuteSwapOptions) => {
      const { account, accountIndex, address } = await getActiveWalletAccount();
      const {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        postConditions,
      } = parseSerializedContractCallParams(swapParams.contractCallParams);

      const unsignedSerializedTx = await buildUnsignedContractCall({
        contractId: `${contractAddress}.${contractName}`,
        functionName,
        functionArgs,
        postConditions,
        postConditionMode: PostConditionMode.Deny,
        network: selectedNetwork,
        publicKey: account.publicKey,
        feeMicroStx: 0,
        sponsored: true,
      });

      await submitSponsoredTransaction({
        originAddress: address,
        accountIndex,
        unsignedSerializedTx,
        defiOperationId: swapParams.operation.id,
      });

      await invalidateBalances();
    },
    [invalidateBalances, selectedNetwork, submitSponsoredTransaction],
  );

  return {
    executeSwap,
    executeSwapSponsored,
    isExecuting,
    isSubmittingSponsored,
  };
}
