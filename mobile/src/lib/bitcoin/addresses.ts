import { Buffer } from "buffer";

import * as btc from "@scure/btc-signer";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { getBitcoinWalletPayment } from "./wallet";
import { getBitcoinSignerNetwork } from "./network";

/**
 * Get Bitcoin address for the current account and network
 */
export async function getBitcoinAddressForAccount(
  accountIndex: number,
  network: NetworkType,
): Promise<string> {
  const payment = await getBitcoinWalletPayment(accountIndex, network);
  return payment.address;
}

export function outputScriptHexToBitcoinAddress(
  scriptHex: string,
  network: NetworkType,
): string {
  const hex = scriptHex.startsWith("0x") ? scriptHex.slice(2) : scriptHex;
  const bytes = Uint8Array.from(Buffer.from(hex, "hex"));
  const out = btc.OutScript.decode(bytes);
  return btc.Address(getBitcoinSignerNetwork(network)).encode(out);
}
