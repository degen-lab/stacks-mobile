import { useQuery } from "@tanstack/react-query";

import type { ClarityValue } from "@stacks/transactions";

import {
  fetchBitcoinFeeRecommendation,
  fetchBitcoinTipHeight,
  fetchBitcoinTransaction,
  fetchMempoolProjectedBlocks,
} from "@/api/bitcoin/client";

import {
  fetchAggregateKey,
  fetchBridgeLimits,
  fetchEmilyDeposit,
  fetchEmilyDepositHistory,
  fetchEmilyWithdrawal,
  fetchEmilyWithdrawalHistory,
  fetchSbtcBalance,
  fetchSbtcSupply,
  fetchStacksTransaction,
} from "./client";
import type { SbtcBridgeConfig } from "./types";

export const useBridgeLimits = (
  config: SbtcBridgeConfig,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "limits", config.network],
    queryFn: () => fetchBridgeLimits(config),
    enabled: enabled && config.isEnabled,
    staleTime: 30_000,
  });

export const useBridgeAggregateKey = (
  config: SbtcBridgeConfig,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "aggregate-key", config.network],
    queryFn: () => fetchAggregateKey(config),
    enabled: enabled && config.isEnabled,
    staleTime: 60_000,
  });

export const useBridgeSbtcSupply = (
  config: SbtcBridgeConfig,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "supply", config.network],
    queryFn: () => fetchSbtcSupply(config),
    enabled: enabled && config.isEnabled,
    staleTime: 30_000,
  });

export const useBridgeSbtcBalance = (
  config: SbtcBridgeConfig,
  args: ClarityValue[],
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "balance", config.network, ...args],
    queryFn: () => fetchSbtcBalance(config, args),
    enabled: enabled && config.isEnabled && Boolean(args[0]),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

export const useBridgeDeposit = (
  config: SbtcBridgeConfig,
  txid: string,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "deposit", config.network, txid],
    queryFn: () => fetchEmilyDeposit(config, txid),
    enabled: enabled && config.isEnabled && Boolean(txid),
    staleTime: 0,
  });

export const useBridgeDepositHistory = (
  config: SbtcBridgeConfig,
  reclaimPubkeys: string[],
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: [
      "sbtc-bridge",
      "deposit-history",
      config.network,
      reclaimPubkeys,
    ],
    queryFn: () => fetchEmilyDepositHistory(config, reclaimPubkeys),
    enabled:
      enabled && config.isEnabled && reclaimPubkeys.filter(Boolean).length > 0,
    staleTime: 15_000,
  });

export const useBridgeWithdrawal = (
  config: SbtcBridgeConfig,
  requestId: string,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "withdrawal", config.network, requestId],
    queryFn: () => fetchEmilyWithdrawal(config, requestId),
    enabled: enabled && config.isEnabled && Boolean(requestId),
    staleTime: 0,
  });

export const useBridgeWithdrawalHistory = (
  config: SbtcBridgeConfig,
  sender: string,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "withdrawal-history", config.network, sender],
    queryFn: () => fetchEmilyWithdrawalHistory(config, sender),
    enabled: enabled && config.isEnabled && Boolean(sender),
    staleTime: 15_000,
  });

export const useStacksTransaction = (
  config: SbtcBridgeConfig,
  txid: string,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "stacks-tx", config.network, txid],
    queryFn: () => fetchStacksTransaction(config, txid),
    enabled: enabled && config.isEnabled && Boolean(txid),
    staleTime: 60_000,
  });

export const useBitcoinTransaction = (
  config: SbtcBridgeConfig,
  txid: string,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "bitcoin-tx", config.network, txid],
    queryFn: () => fetchBitcoinTransaction(config.network, txid),
    enabled: enabled && config.isEnabled && Boolean(txid),
    staleTime: 60_000,
  });

export const useBitcoinTipHeight = (
  config: SbtcBridgeConfig,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "bitcoin-tip-height", config.network],
    queryFn: () => fetchBitcoinTipHeight(config.network),
    enabled: enabled && config.isEnabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

export const useBridgeFeeRecommendation = (
  config: SbtcBridgeConfig,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "fees", config.network],
    queryFn: () => fetchBitcoinFeeRecommendation(config.network),
    enabled: enabled && config.isEnabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

export const useBridgeMempoolBlocks = (
  config: SbtcBridgeConfig,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["sbtc-bridge", "mempool-blocks", config.network],
    queryFn: () => fetchMempoolProjectedBlocks(config.network),
    enabled: enabled && config.isEnabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
