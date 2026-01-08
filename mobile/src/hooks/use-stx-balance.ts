import { useCallback, useEffect, useState } from "react";

import { useSelectedNetwork } from "@/lib/store/settings";
import { walletKit } from "@/lib/wallet";

type UseStxBalanceResult = {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const useStxBalance = (accountIndex = 0): UseStxBalanceResult => {
  const { selectedNetwork } = useSelectedNetwork();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accounts = await walletKit.getWalletAccounts();
      const account = accounts[accountIndex];

      if (!account) {
        console.warn("[Balance] No account found at index", accountIndex);
        setBalance(0);
        return;
      }

      const stacksBalance = await walletKit.getBalance(account);
      setBalance(stacksBalance);
    } catch (err) {
      console.error("[Balance] Failed to load", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [accountIndex]);

  useEffect(() => {
    void refresh();
  }, [refresh, selectedNetwork]);

  return { balance, isLoading, error, refresh };
};
