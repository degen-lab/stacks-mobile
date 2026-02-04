import { useEffect, useMemo, useState } from "react";

import { useUserBalances } from "@/api/stacks/use-stacks-api";
import { useSelectedNetwork } from "@/lib/store/settings";
import { walletKit } from "@/lib/stacks/wallet";
import { MICRO_STX } from "@/lib/format/currency";

type UseStxBalanceResult = {
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

export const useStxBalance = (accountIndex = 0): UseStxBalanceResult => {
  const { selectedNetwork } = useSelectedNetwork();
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    walletKit.getWalletAccounts().then((accounts) => {
      const networkKey = selectedNetwork as "mainnet" | "testnet";
      const addr = accounts[accountIndex]?.addresses?.[networkKey];
      setAddress(addr || null);
    });
  }, [accountIndex, selectedNetwork]);

  const { data, isLoading, error, refetch } = useUserBalances({
    variables: { address: address ?? "" },
    enabled: !!address,
  });

  const balanceData = useMemo(() => {
    if (!data?.stx) {
      return {
        balance: 0,
        lockedBalance: 0,
        availableBalance: 0,
      };
    }

    const balance = Number(data.stx.balance) / MICRO_STX;
    const locked = Number(data.stx.locked) / MICRO_STX;
    const available = balance - locked;

    return {
      balance,
      lockedBalance: locked,
      availableBalance: available,
    };
  }, [data]);

  return {
    ...balanceData,
    isLoading,
    error: error?.message ?? null,
    refresh: refetch,
  };
};
