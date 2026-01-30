import { Platform } from "react-native";

import { Env } from "@/lib/env";
import { useSettingsStore } from "@/lib/store/settings";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";

export type AppEnv = "development" | "staging" | "production";

export type BackendServiceType =
  | "dual-stacking"
  | "defi"
  | "coin-prices"
  | "project-rewards"
  | "game";

const getCurrentEnv = (): AppEnv => Env.APP_ENV as AppEnv;

const getCurrentNetwork = (): NetworkType => {
  try {
    return useSettingsStore.getState().network;
  } catch (error) {
    console.warn("[network] Falling back to Env.NETWORK", error);
    return Env.NETWORK as NetworkType;
  }
};

export const isMainnet = () => getCurrentNetwork() === "mainnet";

type ApiUrl = Record<NetworkType, string>;
type ExplorerUrl = Record<NetworkType, [string, string]>;
type BackendConfig = Partial<Record<BackendServiceType, string>>;

type TransactionMapping = (txId: string) => {
  apiUrl: string;
  explorerUrl: string;
};
type ExplorerUserAddressUrl = (userAddress: string) => { explorerUrl: string };
type ExplorerTxUrl = (txId: string) => { explorerUrl: string };

const validateUrl = (url: string | undefined, key: string) => {
  if (!url) {
    throw new Error(`URL is not defined correctly for ${key}`);
  }
  return url;
};

const adjustUrlForAndroid = (url: string) => {
  if (!url) return "";
  if (Platform.OS === "android" && __DEV__) {
    return url.replace(/localhost|127\.0\.0\.1/g, "10.0.2.2");
  }
  return url;
};

const explorerUrlConfig: ExplorerUrl = {
  mainnet: ["https://explorer.hiro.so", "mainnet"],
  testnet: ["https://explorer.hiro.so", "testnet"],
  devnet: ["http://localhost:8000", "testnet"],
};

export const apiUrl: Record<AppEnv, ApiUrl> = {
  development: {
    mainnet: validateUrl("https://api.mainnet.hiro.so", "mainnet"),
    testnet: validateUrl("https://api.testnet.hiro.so", "testnet"),
    devnet: validateUrl("http://localhost:3999", "devnet"),
  },
  staging: {
    mainnet: validateUrl("https://api.mainnet.hiro.so", "mainnet"),
    testnet: validateUrl("https://api.testnet.hiro.so", "testnet"),
    devnet: validateUrl("https://services.degenlab.io", "devnet"),
  },
  production: {
    mainnet: validateUrl("https://api.mainnet.hiro.so", "mainnet"),
    testnet: validateUrl("https://api.testnet.hiro.so", "testnet"),
    devnet: validateUrl("https://services.degenlab.io", "devnet"),
  },
};

export const getStacksApiBase = (
  network: NetworkType = getCurrentNetwork(),
  env: AppEnv = getCurrentEnv(),
) => apiUrl[env][network];

export const btcExploreUrl = (network: NetworkType, btcAddress: string) => {
  if (network === "mainnet") {
    return `https://mempool.space/address/${btcAddress}`;
  } else if (network === "testnet") {
    return `https://mempool.space/testnet/address/${btcAddress}`;
  } else {
    return `http://localhost:8001/address/${btcAddress}`;
  }
};

const BACKEND_URLS: Record<AppEnv, Record<NetworkType, BackendConfig>> = {
  development: {
    mainnet: {
      "dual-stacking":
        "https://dual-stacking-v2-server.degenlab.io/dual-stacking-server",
      defi: "https://dual-stacking-server.degenlab.io/defi-server",
      "coin-prices": "https://dual-stacking-server.degenlab.io/coin-prices",
      "project-rewards": "https://testnet-services.degenlab.io/mocked-mainnet",
      game: Env.API_URL || "http://localhost:7070",
    },
    testnet: {
      "dual-stacking": "http://localhost:8080",
      defi: "http://localhost:8081",
      "coin-prices": "http://localhost:8082",
      "project-rewards": "https://testnet-services.degenlab.io/mocked-mainnet",
      game: Env.API_URL || "http://localhost:7070",
    },
    devnet: {
      "dual-stacking": "http://localhost:8080",
      defi: "http://localhost:8081",
      "coin-prices": "http://localhost:8082",
      "project-rewards": "https://testnet-services.degenlab.io/mocked-mainnet",
      game: Env.API_URL || "http://localhost:7070",
    },
  },
  staging: {
    mainnet: {
      "dual-stacking":
        "https://dual-stacking-v2-server.degenlab.io/dual-stacking-server",
      defi: "https://dual-stacking-server.degenlab.io/defi-server",
      "coin-prices": "https://dual-stacking-server.degenlab.io/coin-prices",
      "project-rewards": "https://testnet-services.degenlab.io/mocked-mainnet",
      // TODO: Update with real staging URL
      game: "https://staging-api.blokx.com",
    },
    testnet: {
      "dual-stacking": "https://testnet-services.degenlab.io/yield-server",
      defi: "https://testnet-services.degenlab.io/defi-server",
      "coin-prices": "https://testnet-services.degenlab.io/coin-prices",
      "project-rewards": "https://testnet-services.degenlab.io/mocked-mainnet",
      // TODO: Update with real staging URL
      game: "https://staging-api.blokx.com",
    },
    devnet: {
      "dual-stacking": "https://testnet-services.degenlab.io/yield-server",
      defi: "https://testnet-services.degenlab.io/defi-server",
      "coin-prices": "https://testnet-services.degenlab.io/coin-prices",
      game: "https://staging-api.blokx.com",
    },
  },
  production: {
    mainnet: {
      "dual-stacking":
        "https://dual-stacking-v2-server.degenlab.io/dual-stacking-server",
      defi: "https://dual-stacking-server.degenlab.io/defi-server",
      "coin-prices": "https://dual-stacking-server.degenlab.io/coin-prices",
      "project-rewards": "https://testnet-services.degenlab.io/mocked-mainnet",
      // TODO: Update with real prod URL
      game: "https://api.blokx.com",
    },
    testnet: {
      "dual-stacking": "https://testnet-services.degenlab.io/yield-server",
      defi: "https://testnet-services.degenlab.io/defi-server",
      "coin-prices": "https://testnet-services.degenlab.io/coin-prices",
      game: "https://api.blokx.com",
    },
    devnet: {
      "dual-stacking": "https://testnet-services.degenlab.io/yield-server",
      defi: "https://testnet-services.degenlab.io/defi-server",
      "coin-prices": "https://testnet-services.degenlab.io/coin-prices",
      game: "https://api.blokx.com",
    },
  },
};

export const getBackendServer = (
  service: BackendServiceType,
  network: NetworkType = getCurrentNetwork(),
  env: AppEnv = getCurrentEnv(),
) => {
  const baseUrl = BACKEND_URLS[env][network]?.[service];

  if (!baseUrl) {
    throw new Error(
      `Service '${service}' not supported for Env: '${env}' / Network: '${network}'`,
    );
  }
  return adjustUrlForAndroid(baseUrl);
};

export const getChain = (network: NetworkType) => {
  if (network === "mainnet") {
    return "mainnet";
  }
  return "testnet";
};

export const transactionUrl: TransactionMapping = (txId: string) => {
  const env = getCurrentEnv();
  const network = getCurrentNetwork();
  const apiBase = apiUrl[env][network];
  const [explorerBase, chainType] = explorerUrlConfig[network];

  return {
    apiUrl: `${apiBase}/extended/v1/tx/${txId}`,
    explorerUrl: `${explorerBase}/txid/${txId}?chain=${chainType}&api=${apiBase}`,
  };
};

export const getExplorerUrl: ExplorerUserAddressUrl = (userAddress) => {
  const env = getCurrentEnv();
  const network = getCurrentNetwork();
  const apiBase = apiUrl[env][network];
  const [explorerBase, chainType] = explorerUrlConfig[network];

  return {
    explorerUrl: `${explorerBase}/address/${userAddress}?chain=${chainType}&api=${apiBase}`,
  };
};

export const getExplorerTxUrl: ExplorerTxUrl = (txId: string) => {
  const network = getCurrentNetwork();
  const [explorerBase, chainType] = explorerUrlConfig[network];

  return {
    explorerUrl: `${explorerBase}/txid/${txId}?chain=${chainType}`,
  };
};
