import { useState } from "react";
import { useSbtcInWallet } from "@/api/dual-stacking/contract";
import { useBtcBalance } from "@/hooks/use-btc-balance";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { fromSatsToBtc } from "@/lib/format/currency";
import { principalArgFromAddress } from "@/lib/stacks/addresses";
import { useActiveAccountIndex } from "@/lib/store/settings";
import type { TransferMode } from "../types";
import { AppToken } from "@/lib/assets/tokens";

export function useTransfer() {
  const [mode, setMode] = useState<TransferMode>("select");

  const { activeAccountIndex } = useActiveAccountIndex();
  const { stxAddress, btcAddress } = useWalletAddresses({
    accountIndex: activeAccountIndex,
  });
  const {
    availableBalance: stxAvailableBalance,
    isLoading: stxBalanceIsLoading,
  } = useStxBalance(activeAccountIndex);
  const { balance: btcBalance, isLoading: btcBalanceIsLoading } =
    useBtcBalance(activeAccountIndex);
  const { data: sbtcBalanceSats, isLoading: sbtcBalanceIsLoading } =
    useSbtcInWallet(principalArgFromAddress(stxAddress));
  const sbtcBalance = fromSatsToBtc(sbtcBalanceSats ?? 0n);

  const getCurrentBalance = (asset: AppToken | null) => {
    switch (asset) {
      case "STX":
        return stxAvailableBalance;
      case "BTC":
        return btcBalance;
      case "sBTC":
        return sbtcBalance;
      default:
        return 0;
    }
  };

  const getCurrentBalanceIsLoading = (asset: AppToken | null) => {
    switch (asset) {
      case "STX":
        return stxBalanceIsLoading;
      case "BTC":
        return btcBalanceIsLoading;
      case "sBTC":
        return sbtcBalanceIsLoading;
      default:
        return false;
    }
  };

  return {
    mode,
    setMode,
    stxAddress,
    btcAddress,
    getCurrentBalance,
    getCurrentBalanceIsLoading,
  };
}
