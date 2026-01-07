import { walletKit } from "@/lib/wallet";
import { derivePrivateKey } from "@degenlab/stacks-wallet-kit-core";
import { HDKey } from "@scure/bip32";
import {
  deserializeTransaction,
  StacksTransactionWire,
  TransactionSigner,
} from "@stacks/transactions";
import { useCallback } from "react";

/**
 * Retrieve the root wallet private key from WalletKit storage.
 */
async function getWalletPrivateKey(): Promise<string> {
  // @ts-expect-error internal WalletKit API
  const storageManager = walletKit.storageManager;

  if (!storageManager?.getItem) {
    throw new Error("Wallet storage not available");
  }

  // @ts-expect-error internal wallet shape
  const wallet: WalletStorage | null = await storageManager.getItem("wallet");

  if (!wallet?.privateKey) {
    throw new Error("Wallet private key not found");
  }

  return wallet.privateKey;
}

/**
 * Hook that signs an *unsigned* serialized Stacks transaction
 */
export const useSignTransaction = () => {
  return useCallback(
    async (serializedTx: string, accountIndex: number): Promise<string> => {
      const rootPrivateKey = await getWalletPrivateKey();

      const derivedPrivateKey = derivePrivateKey(
        HDKey.fromExtendedKey(rootPrivateKey),
        accountIndex,
      );

      const had0xPrefix = serializedTx.startsWith("0x");
      const txHex = had0xPrefix ? serializedTx.slice(2) : serializedTx;

      const transaction: StacksTransactionWire = deserializeTransaction(txHex);

      // if (transaction.auth.spendingCondition?.signer?.length) {
      //   throw new Error("Transaction already signed");
      // }

      const signer = new TransactionSigner(transaction);
      signer.signOrigin(derivedPrivateKey);

      const signedTxHex = signer.transaction.serialize();

      return had0xPrefix ? `0x${signedTxHex}` : signedTxHex;
    },
    [],
  );
};
