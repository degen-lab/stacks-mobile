import { useState } from "react";
import { useActiveAccountIndex } from "@/lib/store/settings";
import { useBtcBalance } from "@/hooks/use-btc-balance";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import type { TransferAsset, TransferMode } from "../types";

export function useTransfer() {
  const [mode, setMode] = useState<TransferMode>("select");

  const { activeAccountIndex } = useActiveAccountIndex();
  const { stxAddress, btcAddress } = useWalletAddresses({
    accountIndex: activeAccountIndex,
  });
  const { balance: stxBalance, isLoading: stxBalanceIsLoading } =
    useStxBalance(activeAccountIndex);
  const { balance: btcBalance, isLoading: btcBalanceIsLoading } =
    useBtcBalance(activeAccountIndex);

  const getCurrentBalance = (asset: TransferAsset | null) => {
    switch (asset) {
      case "STX":
        return stxBalance;
      case "BTC":
        return btcBalance;
      case "sBTC":
        return 0; // TODO: Implement sBTC balance
      default:
        return 0;
    }
  };

  const getCurrentBalanceIsLoading = (asset: TransferAsset | null) => {
    switch (asset) {
      case "STX":
        return stxBalanceIsLoading;
      case "BTC":
        return btcBalanceIsLoading;
      case "sBTC":
        return false; // TODO: Implement sBTC balance loading
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
