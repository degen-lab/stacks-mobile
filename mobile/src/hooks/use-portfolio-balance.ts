import { useBridgeSbtcBalance } from "@/api/sbtc-bridge";
import { useUserTotalSbtcInDefi } from "@/api/dual-stacking/contract/hooks";
import { getSbtcBridgeConfig } from "@/api/sbtc-bridge/config";
import { fromSatsToBtc } from "@/lib/format/currency";
import { principalArgFromAddress } from "@/lib/stacks/addresses";
import { divisorNetwork } from "@/lib/stacks/utils";
import { useMemo } from "react";

import { useBtcPrice } from "@/api/market/use-btc-price";
import { useStacksPrice } from "@/api/market/use-stacks-price";
import {
  useActiveAccountIndex,
  useSelectedNetwork,
} from "@/lib/store/settings";

import { useBtcBalance } from "./use-btc-balance";
import { useStxBalance } from "./use-stx-balance";
import { useWalletAddresses } from "./use-wallet-addresses";

type UsePortfolioBalanceResult = {
  usdBalance: number;
  usdBalanceOrNull: number | null;
  hasBalance: boolean;
  stxBalance: number;
  stxLockedBalance: number;
  stxAvailableBalance: number;
  btcBalance: number;
  sbtcBalance: number;
  sbtcDefiBalance: number;
  stxPriceUsd: number | null;
  btcPriceUsd: number | null;
  stxChange24hPercent: number | null;
  btcChange24hPercent: number | null;
  isLoading: boolean;
  isBalanceLoading: boolean;
  isPriceLoading: boolean;
};

export function usePortfolioBalance(): UsePortfolioBalanceResult {
  const { activeAccountIndex } = useActiveAccountIndex();
  const { selectedNetwork } = useSelectedNetwork();
  const {
    balance: stxBalance,
    lockedBalance: stxLockedBalance,
    availableBalance: stxAvailableBalance,
    isLoading: loadingStx,
  } = useStxBalance(activeAccountIndex);
  const { balance: btcBalance, isLoading: loadingBtc } =
    useBtcBalance(activeAccountIndex);
  const config = useMemo(
    () => getSbtcBridgeConfig(selectedNetwork),
    [selectedNetwork],
  );
  const { stxAddress } = useWalletAddresses({
    accountIndex: activeAccountIndex,
  });
  const principal = useMemo(
    () => principalArgFromAddress(stxAddress),
    [stxAddress],
  );
  const { data: sbtcBalanceSats, isLoading: loadingSbtc } =
    useBridgeSbtcBalance(config, principal, !!stxAddress);
  const sbtcBalance = useMemo(
    () => fromSatsToBtc(sbtcBalanceSats ?? 0n),
    [sbtcBalanceSats],
  );
  const { data: sbtcDefiBalanceSats, isLoading: loadingSbtcDefi } =
    useUserTotalSbtcInDefi(principal);
  const sbtcDefiBalance = useMemo(
    () => fromSatsToBtc(sbtcDefiBalanceSats ?? 0) / divisorNetwork,
    [sbtcDefiBalanceSats],
  );
  const { data: stxMarketData, isLoading: loadingStxPrice } = useStacksPrice();
  const { data: btcMarketData, isLoading: loadingBtcPrice } = useBtcPrice();
  const stxPriceUsd = stxMarketData?.usd ?? null;
  const btcPriceUsd = btcMarketData?.usd ?? null;
  const stxChange24hPercent = stxMarketData?.change24h ?? null;
  const btcChange24hPercent = btcMarketData?.change24h ?? null;

  const usdBalanceOrNull = useMemo(() => {
    if (stxPriceUsd === null || stxPriceUsd === undefined) return null;
    if (btcPriceUsd === null || btcPriceUsd === undefined) return null;

    const bitcoinBalance = btcBalance + sbtcBalance + sbtcDefiBalance;

    return stxBalance * stxPriceUsd + bitcoinBalance * btcPriceUsd;
  }, [
    btcBalance,
    btcPriceUsd,
    sbtcBalance,
    sbtcDefiBalance,
    stxBalance,
    stxPriceUsd,
  ]);

  const usdBalance = usdBalanceOrNull ?? 0;

  const hasBalance = useMemo(
    () =>
      stxBalance > 0 ||
      btcBalance > 0 ||
      sbtcBalance > 0 ||
      sbtcDefiBalance > 0,
    [btcBalance, sbtcBalance, sbtcDefiBalance, stxBalance],
  );

  const isBalanceLoading =
    loadingStx || loadingBtc || loadingSbtc || loadingSbtcDefi;
  const isPriceLoading = loadingStxPrice || loadingBtcPrice;

  return {
    usdBalance,
    usdBalanceOrNull,
    hasBalance,
    stxBalance,
    stxLockedBalance,
    stxAvailableBalance,
    btcBalance,
    sbtcBalance,
    sbtcDefiBalance,
    stxPriceUsd,
    btcPriceUsd,
    stxChange24hPercent,
    btcChange24hPercent,
    isLoading: isBalanceLoading || isPriceLoading,
    isBalanceLoading,
    isPriceLoading,
  };
}
