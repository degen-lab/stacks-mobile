import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import { getBitcoinWalletPayment } from "./wallet";

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
