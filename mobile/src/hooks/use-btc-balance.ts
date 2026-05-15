import { useMemo } from "react";

import { useBitcoinAddressInfo } from "@/api/bitcoin";
import { fromSatsToBtc } from "@/lib/format/currency";
import { useActiveAccountIndex } from "@/lib/store/settings";

import { useWalletAddresses } from "./use-wallet-addresses";

type UseBtcBalanceResult = {
  balance: number;
  balanceOrNull: number | null;
  balanceSats: number;
  hasLoadedBalance: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refresh: () => void;
};

export const useBtcBalance = (
  requestedAccountIndex?: number,
): UseBtcBalanceResult => {
  const { activeAccountIndex } = useActiveAccountIndex();
  const accountIndex = requestedAccountIndex ?? activeAccountIndex;
  const {
    btcAddress,
    network,
    isLoading: isWalletLoading,
  } = useWalletAddresses({
    accountIndex,
  });

  const btcQuery = useBitcoinAddressInfo({
    address: btcAddress,
    network,
    enabled: !!btcAddress,
  });
  const { data, isLoading, isFetching, error, refetch } = btcQuery;
  const hasLoadedBalance = data != null;

  const balanceSats = useMemo(
    () =>
      data
        ? data.chain_stats.funded_txo_sum -
          data.chain_stats.spent_txo_sum +
          data.mempool_stats.funded_txo_sum -
          data.mempool_stats.spent_txo_sum
        : 0,
    [data],
  );
  const balanceOrNull = hasLoadedBalance ? fromSatsToBtc(balanceSats) : null;

  return {
    balance: balanceOrNull ?? 0,
    balanceOrNull,
    balanceSats,
    hasLoadedBalance,
    isLoading: isWalletLoading || (isLoading && !hasLoadedBalance),
    isFetching: isWalletLoading || isFetching,
    error: error?.message ?? null,
    refresh: refetch,
  };
};
