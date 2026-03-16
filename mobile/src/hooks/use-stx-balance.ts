import { useMemo } from "react";

import { useUserBalances } from "@/api/stacks/use-stacks-api";
import { MICRO_STX } from "@/lib/format/currency";
import { useWalletAddresses } from "./use-wallet-addresses";

type UseStxBalanceResult = {
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

export const useStxBalance = (accountIndex = 0): UseStxBalanceResult => {
  const { stxAddress: address } = useWalletAddresses({ accountIndex });

  const { data, isLoading, error, refetch } = useUserBalances({
    variables: { address: address ?? "" },
    enabled: !!address,
    refetchInterval: 30_000,
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
