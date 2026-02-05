import { useState } from "react";
import { useActiveAccountIndex } from "@/lib/store/settings";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import type { TransferAsset, TransferMode } from "../types";

export function useTransfer() {
  const [mode, setMode] = useState<TransferMode>("select");
  const [selectedAsset, setSelectedAsset] = useState<TransferAsset>("STX");

  const { activeAccountIndex } = useActiveAccountIndex();
  const { stxAddress, btcAddress } = useWalletAddresses({
    accountIndex: activeAccountIndex,
  });
  const { balance: stxBalance, isLoading: stxBalanceIsLoading } =
    useStxBalance(activeAccountIndex);

  const getCurrentBalance = () => {
    switch (selectedAsset) {
      case "STX":
        return stxBalance;
      case "BTC":
        return 0; // TODO: Implement BTC balance
      case "sBTC":
        return 0; // TODO: Implement sBTC balance
      default:
        return 0;
    }
  };

  const getCurrentBalanceIsLoading = () => {
    switch (selectedAsset) {
      case "STX":
        return stxBalanceIsLoading;
      case "BTC":
        return false; // TODO: Implement BTC balance loading
      case "sBTC":
        return false; // TODO: Implement sBTC balance loading
      default:
        return false;
    }
  };

  return {
    mode,
    setMode,
    selectedAsset,
    setSelectedAsset,
    stxAddress,
    btcAddress,
    currentBalance: getCurrentBalance(),
    currentBalanceIsLoading: getCurrentBalanceIsLoading(),
  };
}
