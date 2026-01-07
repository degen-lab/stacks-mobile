import "../../polyfill";

import { Env } from "@/lib/env";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import { MobileClient } from "@degenlab/stacks-wallet-kit-mobile";

const GOOGLE_SCOPES = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/drive.appdata",
];

const DEVNET_API_URL = __DEV__
  ? "http://10.0.2.2:3999/" // Android emulator - change to your IP for physical device
  : "http://192.168.68.104:3999/"; // Physical device fallback

console.log("[SDK Config] Initializing SDK with devnet URL:", DEVNET_API_URL);

const initialNetwork = (): NetworkType => {
  const value = Env.NETWORK;
  if (value === "mainnet" || value === "testnet" || value === "devnet") {
    return value as NetworkType;
  }
  return NetworkType.Testnet;
};

export const walletKit = new MobileClient(
  Env.GOOGLE_WEB_CLIENT_ID,
  Env.GOOGLE_IOS_CLIENT_ID,
  initialNetwork(),
  {
    scopes: GOOGLE_SCOPES,
    // devnetUrl: DEVNET_API_URL,
  },
);
