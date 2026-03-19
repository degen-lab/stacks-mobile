import { HDKey } from "@scure/bip32";
import * as btc from "@scure/btc-signer";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { walletKit } from "@/lib/stacks/wallet";

import { getBitcoinCoinType, getBitcoinSignerNetwork } from "./network";

interface WalletStorage {
  privateKey: string;
}

export interface BitcoinWalletPayment {
  address: string;
  script: Uint8Array;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  derivationPath: string;
  network: ReturnType<typeof getBitcoinSignerNetwork>;
}

export async function getWalletPrivateKey(): Promise<string> {
  // @ts-expect-error internal WalletKit API
  const storageManager = walletKit.storageManager;
  if (!storageManager?.getItem) {
    throw new Error("Wallet storage not available");
  }

  const wallet: WalletStorage | null = await storageManager.getItem("wallet");
  if (!wallet?.privateKey) {
    throw new Error("Wallet private key not found");
  }

  return wallet.privateKey;
}

export function deriveBitcoinWalletPaymentFromRootKey(
  rootKeychain: HDKey,
  accountIndex: number,
  network: NetworkType,
): BitcoinWalletPayment {
  const signerNetwork = getBitcoinSignerNetwork(network);
  const coinType = getBitcoinCoinType(network);
  const accountPath = `m/84'/${coinType}'/${accountIndex}'`;
  const accountKey = rootKeychain.derive(accountPath);
  const addressKey = accountKey.deriveChild(0).deriveChild(0);

  if (!addressKey.privateKey || !addressKey.publicKey) {
    throw new Error("Unable to derive Bitcoin payment key");
  }

  const payment = btc.p2wpkh(addressKey.publicKey, signerNetwork);
  if (!payment.address) {
    throw new Error("Unable to derive Bitcoin payment address");
  }

  return {
    address: payment.address,
    script: payment.script,
    publicKey: addressKey.publicKey,
    privateKey: addressKey.privateKey,
    derivationPath: `${accountPath}/0/0`,
    network: signerNetwork,
  };
}

export function toXOnly(pubKey: Uint8Array): Uint8Array {
  return pubKey.length === 33 ? pubKey.subarray(1) : pubKey;
}

export async function getBitcoinWalletPayment(
  accountIndex: number,
  network: NetworkType,
): Promise<BitcoinWalletPayment> {
  const rootPrivateKey = await getWalletPrivateKey();
  const rootKeychain = HDKey.fromExtendedKey(rootPrivateKey);
  return deriveBitcoinWalletPaymentFromRootKey(
    rootKeychain,
    accountIndex,
    network,
  );
}
