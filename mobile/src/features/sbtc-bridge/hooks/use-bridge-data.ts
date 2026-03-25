import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { principalCV } from "@stacks/transactions";

import { useBtcPrice } from "@/api/market";
import {
  useBridgeDepositHistory,
  useBridgeLimits,
  useBridgeSbtcBalance,
  useBridgeSbtcSupply,
} from "@/api/sbtc-bridge";
import { useBridgeWithdrawalHistory } from "@/api/sbtc-bridge/hooks";
import { fetchBitcoinTipHeight } from "@/api/bitcoin/client";
import { getSbtcBridgeConfig } from "@/api/sbtc-bridge/config";
import { getBitcoinWalletPayment } from "@/lib/bitcoin/wallet";
import { fromSatsToBtc } from "@/lib/format/currency";
import {
  useActiveAccountIndex,
  useSelectedNetwork,
} from "@/lib/store/settings";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";

import { bytesToHex, toXOnly } from "../utils/bytes";
import { listStoredBridgeDeposits } from "../storage/deposits";

export function getBridgeReclaimPubkey(publicKey?: Uint8Array | null) {
  return publicKey ? bytesToHex(toXOnly(publicKey)) : null;
}

export function useBridgeConfig() {
  const { selectedNetwork } = useSelectedNetwork();
  return useMemo(() => getSbtcBridgeConfig(selectedNetwork), [selectedNetwork]);
}

export function useBridgeWalletPayment() {
  const { activeAccountIndex } = useActiveAccountIndex();
  const { selectedNetwork } = useSelectedNetwork();

  return useQuery({
    queryKey: [
      "sbtc-bridge",
      "wallet-payment",
      selectedNetwork,
      activeAccountIndex,
    ],
    queryFn: () => getBitcoinWalletPayment(activeAccountIndex, selectedNetwork),
    staleTime: 60_000,
  });
}

export function useBridgeCurrentCap() {
  const config = useBridgeConfig();
  const limits = useBridgeLimits(config);
  const supply = useBridgeSbtcSupply(config);

  const currentCap = useMemo(() => {
    const perDepositCap = Number(limits.data?.perDepositCap ?? 0);
    const pegCap = Number(limits.data?.pegCap ?? 0);
    const totalSupply = Number(supply.data ?? 0n);
    return Math.max(0, Math.min(perDepositCap, pegCap - totalSupply));
  }, [limits.data?.pegCap, limits.data?.perDepositCap, supply.data]);

  return {
    config,
    limits,
    supply,
    currentCap,
  };
}

export function useBridgeBalances() {
  const config = useBridgeConfig();
  const { stxAddress, btcAddress } = useWalletAddresses();
  const sbtcBalance = useBridgeSbtcBalance(
    config,
    stxAddress ? [principalCV(stxAddress)] : [],
  );

  return {
    config,
    stxAddress,
    btcAddress,
    sbtcBalance,
  };
}

export function useBridgeOverviewMetrics() {
  const { config, limits, supply, currentCap } = useBridgeCurrentCap();
  const btcPrice = useBtcPrice();

  const supplyBtc = useMemo(
    () => fromSatsToBtc(Number(supply.data ?? 0n)),
    [supply.data],
  );
  const currentCapBtc = useMemo(() => fromSatsToBtc(currentCap), [currentCap]);
  const minDepositBtc = useMemo(
    () => fromSatsToBtc(limits.data?.perDepositMinimum ?? 0),
    [limits.data?.perDepositMinimum],
  );
  const marketCapUsd = useMemo(() => {
    if (btcPrice.data?.usd == null) return null;
    return supplyBtc * btcPrice.data.usd;
  }, [btcPrice.data?.usd, supplyBtc]);

  return {
    config,
    limits,
    supply,
    btcPrice,
    supplyBtc,
    currentCapBtc,
    minDepositBtc,
    marketCapUsd,
  };
}

export function useBridgeHistoryData() {
  const config = useBridgeConfig();
  const { stxAddress } = useWalletAddresses();
  const payment = useBridgeWalletPayment();
  const reclaimPubkey = useMemo(
    () => getBridgeReclaimPubkey(payment.data?.publicKey),
    [payment.data?.publicKey],
  );
  const reclaimPubkeys = useMemo(
    () => (reclaimPubkey ? [reclaimPubkey] : []),
    [reclaimPubkey],
  );

  const deposits = useBridgeDepositHistory(config, reclaimPubkeys);
  const withdrawals = useBridgeWithdrawalHistory(config, stxAddress ?? "");
  const localDeposits = useQuery({
    queryKey: ["sbtc-bridge", "local-deposits", config.network, reclaimPubkey],
    queryFn: () => listStoredBridgeDeposits(config.network, reclaimPubkey!),
    enabled: config.isEnabled && Boolean(reclaimPubkey),
    staleTime: 0,
  });
  const bitcoinTipHeight = useQuery({
    queryKey: ["sbtc-bridge", "bitcoin-tip-height", config.network],
    queryFn: () => fetchBitcoinTipHeight(config.network),
    enabled: config.isEnabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
  const items = useMemo(() => {
    const currentBlockHeight = bitcoinTipHeight.data ?? null;

    // Build a map of local deposits by txid:vout for cross-referencing reclaim state
    const localDepositMap = new Map(
      (localDeposits.data ?? []).map((d) => [`${d.txId}:${d.vout}`, d]),
    );

    const depositItems = (deposits.data ?? []).map((item) => {
      const depositKey = `${item.bitcoinTxid}:${item.bitcoinTxOutputIndex}`;
      const localDeposit = localDepositMap.get(depositKey);

      // Emily never returns "failed" — derive it client-side from lock time expiry
      let status = item.status as string;
      if (localDeposit?.reclaimTxId) {
        status = "reclaimed";
      } else if (
        status === "pending" &&
        currentBlockHeight != null &&
        item.lastUpdateHeight > 0 &&
        item.parameters?.lockTime != null &&
        currentBlockHeight >= item.lastUpdateHeight + item.parameters.lockTime
      ) {
        status = "failed";
      }

      return {
        type: "deposit" as const,
        data: { ...item, status },
      };
    });

    const remoteDepositKeys = new Set(
      depositItems.map(
        (item) => `${item.data.bitcoinTxid}:${item.data.bitcoinTxOutputIndex}`,
      ),
    );
    const localDepositItems = (localDeposits.data ?? [])
      .filter(
        (item) =>
          item.broadcasted &&
          !remoteDepositKeys.has(`${item.txId}:${item.vout}`),
      )
      .map((item) => ({
        type: "deposit" as const,
        data: {
          bitcoinTxid: item.txId,
          bitcoinTxOutputIndex: item.vout,
          recipient: item.recipient,
          amount: item.amountSats,
          lastUpdateHeight: 0,
          lastUpdateBlockHash: "",
          statusMessage: item.emilyRegistered
            ? "Pending bridge processing"
            : "Registration pending",
          parameters: {
            maxFee: item.maxFee,
            lockTime: item.lockTime,
          },
          reclaimScript: item.reclaimScript,
          depositScript: item.depositScript,
          status: item.reclaimTxId
            ? "reclaimed"
            : item.emilyRegistered
              ? "pending"
              : "registration-pending",
        },
      }));
    const withdrawalItems = (withdrawals.data ?? []).map((item) => ({
      type: "withdrawal" as const,
      data: item,
    }));

    return [...depositItems, ...localDepositItems, ...withdrawalItems].sort(
      (left, right) =>
        Number(right.data.lastUpdateHeight) -
        Number(left.data.lastUpdateHeight),
    );
  }, [
    deposits.data,
    localDeposits.data,
    withdrawals.data,
    bitcoinTipHeight.data,
  ]);

  return {
    config,
    stxAddress,
    payment,
    reclaimPubkey,
    reclaimPubkeys,
    deposits,
    localDeposits,
    withdrawals,
    items,
  };
}
