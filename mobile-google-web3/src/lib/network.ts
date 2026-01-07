import { Env } from "@/lib/env";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";

export const network: NetworkType = Env.NETWORK as NetworkType;

export const isMainnet = network === "mainnet";
