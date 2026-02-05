import { getBitcoinAddressesFromStacksWallet } from "@degenlab/stacks-wallet-kit-core";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import { HDKey } from "@scure/bip32";
import { walletKit } from "@/lib/stacks/wallet";

interface WalletStorage {
  privateKey: string;
}

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
 * Get Bitcoin address for the current account and network
 */
export async function getBitcoinAddressForAccount(
  accountIndex: number,
  network: NetworkType,
): Promise<string> {
  const privateKey = await getWalletPrivateKey();
  const rootKeyChain = HDKey.fromExtendedKey(privateKey);
  const addresses = await getBitcoinAddressesFromStacksWallet(
    rootKeyChain,
    accountIndex,
  );
  return network === "mainnet" ? addresses.mainnet : addresses.testnet;
}
