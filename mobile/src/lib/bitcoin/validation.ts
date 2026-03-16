import * as btc from "@scure/btc-signer";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { getBitcoinSignerNetwork } from "./network";

export const validateBitcoinAddress = (
  address: string,
  network: NetworkType,
): boolean => {
  if (!address.trim()) return false;

  try {
    btc.Address(getBitcoinSignerNetwork(network)).decode(address.trim());
    return true;
  } catch {
    return false;
  }
};

export const getBitcoinAddressError = (
  address: string,
  network: NetworkType,
): string | null => {
  if (!address.trim()) {
    return "Recipient address is required";
  }
  if (!validateBitcoinAddress(address, network)) {
    return network === "mainnet"
      ? "Enter a valid mainnet Bitcoin address"
      : "Enter a valid testnet Bitcoin address";
  }
  return null;
};
