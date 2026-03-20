import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { showMessage } from "react-native-flash-message";

import type { SbtcBridgeConfig } from "@/api/sbtc-bridge";
import {
  broadcastBitcoinTransaction,
  fetchBitcoinFeeRecommendation,
  fetchBitcoinTransaction,
} from "@/api/bitcoin/client";

import { createReclaimTransaction } from "../builders/reclaim";
import { useBridgeWalletPayment } from "./use-bridge-data";
import { useDepositStatus } from "./use-deposit-flow";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function useSubmitReclaim(
  config: SbtcBridgeConfig,
  depositTxId?: string,
  depositVout?: string | number,
  reclaimAddress?: string | null,
) {
  const payment = useBridgeWalletPayment();
  const depositStatus = useDepositStatus(config, depositTxId, depositVout);

  return useMutation({
    mutationKey: ["sbtc-bridge", "submit-reclaim", config.network, depositTxId],
    mutationFn: async () => {
      if (!depositTxId || !depositStatus.depositInfo) {
        throw new Error("Deposit details are unavailable");
      }
      if (!payment.data) {
        throw new Error("Bitcoin wallet is unavailable");
      }
      if (!reclaimAddress) {
        throw new Error("Bitcoin return address is unavailable");
      }

      // Estimate fee dynamically: P2TR tapscript-path reclaim spend ~200 vbytes.
      const RECLAIM_TX_VBYTES = 200;
      const feeRecommendation = await fetchBitcoinFeeRecommendation(
        config.network,
      );
      const feeAmount = Math.ceil(
        feeRecommendation.halfHourFee * RECLAIM_TX_VBYTES,
      );

      const tx = createReclaimTransaction({
        network: config.network,
        payment: payment.data,
        depositAmount: depositStatus.depositInfo.amount,
        feeAmount,
        lockTime:
          depositStatus.depositInfo.parameters.lockTime ??
          config.reclaimLockTime,
        depositScript: depositStatus.depositInfo.depositScript,
        reclaimScript: depositStatus.depositInfo.reclaimScript,
        txId: depositStatus.depositInfo.bitcoinTxid,
        vout: depositStatus.depositInfo.bitcoinTxOutputIndex,
        bitcoinReturnAddress: reclaimAddress,
      });

      await broadcastBitcoinTransaction(tx.rawTxHex, config.network);
      return tx.txId;
    },
    onError: (error) => {
      showMessage({
        message: "Reclaim failed",
        description: getErrorMessage(error),
        type: "danger",
      });
    },
  });
}

export function useReclaimStatus(config: SbtcBridgeConfig, txId?: string) {
  const query = useQuery({
    queryKey: ["sbtc-bridge", "reclaim-status", config.network, txId],
    queryFn: async () => {
      if (!txId) throw new Error("Reclaim tx id is required");
      const tx = await fetchBitcoinTransaction(config.network, txId);
      if (!tx) {
        throw new Error("Reclaim transaction not found");
      }
      return tx;
    },
    enabled: Boolean(txId),
    refetchInterval: (query) =>
      query.state.data?.status.confirmed ? false : config.pollingInterval,
  });

  const status = useMemo(() => {
    if (!txId) return "submit" as const;
    if (!query.data) return "pending" as const;
    return query.data.status.confirmed
      ? ("confirmed" as const)
      : ("pending" as const);
  }, [query.data, txId]);

  return {
    ...query,
    status,
  };
}
