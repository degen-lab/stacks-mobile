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
  hasBalance: boolean;
  stxBalance: number;
  btcBalance: number;
  sbtcBalance: number;
  sbtcDefiBalance: number;
};

export function usePortfolioBalance(): UsePortfolioBalanceResult {
  const { activeAccountIndex } = useActiveAccountIndex();
  const { selectedNetwork } = useSelectedNetwork();
  const { balance: stxBalance } = useStxBalance(activeAccountIndex);
  const { balance: btcBalance } = useBtcBalance(activeAccountIndex);
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
  const { data: sbtcBalanceSats } = useBridgeSbtcBalance(
    config,
    principal,
    !!stxAddress,
  );
  const sbtcBalance = useMemo(
    () => fromSatsToBtc(sbtcBalanceSats ?? 0n),
    [sbtcBalanceSats],
  );
  const { data: sbtcDefiBalanceSats } = useUserTotalSbtcInDefi(principal);
  const sbtcDefiBalance = useMemo(
    () => fromSatsToBtc(sbtcDefiBalanceSats ?? 0) / divisorNetwork,
    [sbtcDefiBalanceSats],
  );
  const { data: stxPriceUsd } = useStacksPrice();
  const { data: btcPriceUsd } = useBtcPrice();

  const usdBalance = useMemo(() => {
    const bitcoinBalance = btcBalance + sbtcBalance + sbtcDefiBalance;

    return (
      stxBalance * (stxPriceUsd ?? 0) + bitcoinBalance * (btcPriceUsd ?? 0)
    );
  }, [
    btcBalance,
    btcPriceUsd,
    sbtcBalance,
    sbtcDefiBalance,
    stxBalance,
    stxPriceUsd,
  ]);

  const hasBalance = useMemo(
    () =>
      stxBalance > 0 ||
      btcBalance > 0 ||
      sbtcBalance > 0 ||
      sbtcDefiBalance > 0,
    [btcBalance, sbtcBalance, sbtcDefiBalance, stxBalance],
  );

  return {
    usdBalance,
    hasBalance,
    stxBalance,
    btcBalance,
    sbtcBalance,
    sbtcDefiBalance,
  };
}
