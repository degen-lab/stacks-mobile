import { Platform } from "react-native";

import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import * as btc from "@scure/btc-signer";

const DEFAULT_BITCOIN_API_BASE_URLS: Record<NetworkType, string> = {
  mainnet: "https://mempool.space/api",
  testnet: "https://mempool.space/testnet4/api",
  devnet: "http://localhost:8001/api",
};

const normalizeLocalhost = (url: string) => {
  if (!url) return url;
  if (Platform.OS === "android" && __DEV__) {
    return url.replace(/localhost|127\.0\.0\.1/g, "10.0.2.2");
  }
  return url;
};

export const getBitcoinSignerNetwork = (network: NetworkType) =>
  network === "mainnet" ? btc.NETWORK : btc.TEST_NETWORK;

export const getBitcoinCoinType = (network: NetworkType) =>
  network === "mainnet" ? 0 : 1;

export const getBitcoinApiBaseUrl = (network: NetworkType) => {
  return normalizeLocalhost(
    DEFAULT_BITCOIN_API_BASE_URLS[network] ||
      DEFAULT_BITCOIN_API_BASE_URLS.testnet,
  );
};
