import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { getBitcoinApiBaseUrl } from "@/lib/bitcoin/network";
import { Env } from "@/lib/env";
import { CONTRACTS } from "@/lib/stacks/contracts";
import { getHiroApiBase } from "@/lib/stacks/network";

import type { SbtcBridgeConfig } from "./types";

const DEFAULT_POLLING_INTERVAL = 5_000;
const DEFAULT_RECLAIM_LOCK_TIME = 144;
const DEFAULT_WITHDRAWAL_FEE_MULTIPLIER = 4;
const DEFAULT_WITHDRAW_MIN_AMOUNT_SATS = 10_000;
const MAX_WITHDRAWAL_TX_SIZE = 180;

const getPublicMempoolUrl = (network: NetworkType) => {
  if (network === "mainnet") return "https://mempool.space";
  if (network === "testnet") return "https://mempool.space/testnet4";
  return "http://localhost:8001";
};

const getMainnetDeployer = () => {
  const contractId = CONTRACTS.mainnet.sbtc;
  return contractId ? contractId.split(".")[0] : "";
};

const normalizeUrl = (value?: string | null) => value?.replace(/\/$/, "") ?? "";

export function getSbtcBridgeConfig(network: NetworkType): SbtcBridgeConfig {
  const mainnetEmilyUrl = normalizeUrl(Env.SBTC_BRIDGE_MAINNET_EMILY_URL);
  const testnetEmilyUrl = normalizeUrl(Env.SBTC_BRIDGE_TESTNET_EMILY_URL);

  const emilyUrl =
    network === "mainnet"
      ? mainnetEmilyUrl
      : network === "testnet"
        ? testnetEmilyUrl
        : "";

  const contractDeployer =
    network === "mainnet"
      ? Env.SBTC_BRIDGE_MAINNET_CONTRACT_DEPLOYER || getMainnetDeployer()
      : network === "testnet"
        ? Env.SBTC_BRIDGE_TESTNET_CONTRACT_DEPLOYER || ""
        : "";

  return {
    network,
    isEnabled: Boolean(emilyUrl && contractDeployer),
    emilyUrl,
    contractDeployer,
    sbtcTokenContractId: contractDeployer
      ? `${contractDeployer}.sbtc-token`
      : "",
    sbtcWithdrawalContractId: contractDeployer
      ? `${contractDeployer}.sbtc-withdrawal`
      : "",
    sbtcRegistryContractId: contractDeployer
      ? `${contractDeployer}.sbtc-registry`
      : "",
    mempoolApiUrl: getBitcoinApiBaseUrl(network),
    publicMempoolUrl: getPublicMempoolUrl(network),
    hiroApiUrl: getHiroApiBase(network),
    reclaimLockTime: Number(
      Env.SBTC_BRIDGE_RECLAIM_LOCK_TIME || DEFAULT_RECLAIM_LOCK_TIME,
    ),
    pollingInterval: Number(
      Env.SBTC_BRIDGE_POLLING_INTERVAL || DEFAULT_POLLING_INTERVAL,
    ),
    withdrawalFeeMultiplier: Number(
      Env.SBTC_BRIDGE_WITHDRAWAL_FEE_MULTIPLIER ||
        DEFAULT_WITHDRAWAL_FEE_MULTIPLIER,
    ),
    withdrawMinAmountSats: Number(
      Env.SBTC_BRIDGE_WITHDRAW_MIN_AMOUNT_SATS ||
        DEFAULT_WITHDRAW_MIN_AMOUNT_SATS,
    ),
    maxWithdrawalTxSize: MAX_WITHDRAWAL_TX_SIZE,
  };
}
