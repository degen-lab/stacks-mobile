import { useMemo } from "react";

import { useBitcoinUtxos } from "@/api/bitcoin";
import { fromSatsToBtc } from "@/lib/format/currency";
import { useActiveAccountIndex } from "@/lib/store/settings";

import { useWalletAddresses } from "./use-wallet-addresses";

type UseBtcBalanceResult = {
  balance: number;
  balanceSats: number;
  isLoading: boolean;
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

  const { data, isLoading, error, refetch } = useBitcoinUtxos({
    address: btcAddress,
    network,
    enabled: !!btcAddress,
  });

  const balanceSats = useMemo(
    () => data?.reduce((sum, utxo) => sum + utxo.value, 0) ?? 0,
    [data],
  );

  return {
    balance: fromSatsToBtc(balanceSats),
    balanceSats,
    isLoading: isWalletLoading || isLoading,
    error: error?.message ?? null,
    refresh: refetch,
  };
};
