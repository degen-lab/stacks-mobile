import { walletKit } from "@/lib/stacks/wallet";
import { deserializeTransaction } from "@stacks/transactions";
import { useCallback } from "react";

/**
 * Hook that signs an *unsigned* serialized Stacks transaction
 */
export const useSignTransaction = () => {
  return useCallback(
    async (serializedTx: string, accountIndex: number): Promise<string> => {
      const had0xPrefix = serializedTx.startsWith("0x");
      const txHex = had0xPrefix ? serializedTx.slice(2) : serializedTx;
      const transaction = deserializeTransaction(txHex);
      const signedTx = await walletKit.signTransaction(
        accountIndex,
        transaction,
      );
      const signedTxHex = signedTx.serialize();

      return had0xPrefix ? `0x${signedTxHex}` : signedTxHex;
    },
    [],
  );
};
