import { useQuery } from "@tanstack/react-query";
import { ClarityValue } from "@stacks/transactions";

import { fetchReadOnly } from "@/api/stacks/read-only";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { getContractDetails } from "@/lib/stacks/utils";
import { useSelectedNetwork } from "@/lib/store/settings";

const REFETCH_INTERVAL = 30_000;

// Query key must start with "sbtc": transfer, swap and bridge flows invalidate ["sbtc"].
export function useSbtcInWallet(args: ClarityValue[] = []) {
  const { selectedNetwork } = useSelectedNetwork();

  return useQuery({
    queryKey: ["sbtc", "GET_SBTC_BALANCE", ...args, selectedNetwork],
    queryFn: () => {
      const { address, name } = getContractDetails(
        CONTRACTS[selectedNetwork].sbtc,
      );
      return fetchReadOnly<bigint>(
        address,
        name,
        SC_FUNCTIONS.sbtc.readOnlyFunctions.GET_SBTC_BALANCE,
        args,
        address,
      );
    },
    staleTime: 10_000,
    refetchInterval: REFETCH_INTERVAL,
    enabled: !!args[0],
  });
}
