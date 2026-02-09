import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { fetchReadOnly } from "@/api/stacks/read-only";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { useSelectedNetwork } from "@/lib/store/settings";
import { ClarityValue } from "@stacks/transactions";
import {
  CURRENT_MIGRATION_ID,
  FUTURE_MIGRATION_ID,
  getContractDetails,
  getContractTypeForCycle,
} from "@/lib/stacks/utils";

type ContractType = keyof typeof CONTRACTS.mainnet;
type HookOptions = Partial<UseQueryOptions> & {
  requiresArgs?: boolean; // Enable query only when args are provided (e.g., user address)
  select?: (data: any) => any;
  useDegenApi?: boolean;
};

const createQueryHook = <T = any>(
  contractType: ContractType | ((cycleId: number) => ContractType),
  functionName: string,
  options: HookOptions & { defaultCycleId?: number } = {},
) => {
  const {
    requiresArgs = false,
    staleTime = 60_000,
    refetchInterval = 0,
    select,
    defaultCycleId = CURRENT_MIGRATION_ID,
    useDegenApi = false,
    ...restOptions
  } = options;

  return (args: ClarityValue[] = [], cycleId?: number) => {
    const { selectedNetwork } = useSelectedNetwork();

    // Resolve contract type (static or dynamic based on migration)
    const resolvedContractType =
      typeof contractType === "function"
        ? contractType(cycleId ?? defaultCycleId)
        : contractType;

    return useQuery({
      queryKey: [
        resolvedContractType,
        functionName,
        ...args,
        selectedNetwork,
        cycleId,
      ],
      queryFn: async () => {
        const contractId = CONTRACTS[selectedNetwork][resolvedContractType];
        const { address, name } = getContractDetails(contractId);
        const functionMap =
          SC_FUNCTIONS[resolvedContractType as keyof typeof SC_FUNCTIONS];
        const fn =
          functionMap?.readOnlyFunctions?.[
            functionName as keyof typeof functionMap.readOnlyFunctions
          ];

        if (!fn) {
          throw new Error(
            `Function ${functionName} not found in ${resolvedContractType}`,
          );
        }

        return fetchReadOnly<T>(address, name, fn, args, address, useDegenApi);
      },
      staleTime,
      refetchInterval,
      select,
      // Only enable query if args are provided (when requiresArgs is true)
      enabled: requiresArgs ? !!args[0] : true,
      ...restOptions,
    });
  };
};

// ============================================================================
// SBTC HOOKS
// ============================================================================

export const useSbtcInWallet = createQueryHook("sbtc", "GET_SBTC_BALANCE", {
  requiresArgs: true, // Requires user address
  refetchInterval: 30_000,
  staleTime: 10_000,
});

// ============================================================================
// YIELD / DUAL STACKING HOOKS
// ============================================================================
// These hooks support dynamic contract selection based on migration/cycle ID
// Usage: useAmountStackedNow([principalCV(address)], CURRENT_MIGRATION_ID)
// The second parameter (cycleId) determines which contract version to use

export const useAmountStackedNow = createQueryHook(
  getContractTypeForCycle,
  "GET_AMOUNT_STACKED_NOW",
  {
    requiresArgs: true, // Requires user address
    refetchInterval: 30_000,
    staleTime: 10_000,
  },
);

export const useUserTotalSbtcInDefi = createQueryHook<{
  total?: number | bigint;
}>("yieldV2", "GET_DEFI_SBTC_BALANCE", {
  requiresArgs: true,
  refetchInterval: 30_000,
  staleTime: 10_000,
  select: (data) => Number(data?.total ?? 0),
  useDegenApi: true, // DegenLab API to avoid CostBalanceExceeded error
});

export const useIsEnrolledCurrentCycle = createQueryHook(
  getContractTypeForCycle,
  "IS_ENROLLED_THIS_CYCLE",
  {
    requiresArgs: true,
  },
);

export const useIsEnrolledNextCycle = createQueryHook(
  getContractTypeForCycle,
  "IS_ENROLLED_NEXT_CYCLE",
  {
    requiresArgs: true,
    defaultCycleId: FUTURE_MIGRATION_ID,
  },
);

export const useCurrentBitcoinBlockHeight = createQueryHook(
  getContractTypeForCycle,
  "GET_CURRENT_BITCOIN_HEIGHT",
);

export const useYieldCycleDataReadOnly = createQueryHook(
  getContractTypeForCycle,
  "GET_CYCLE_DATA",
);

export const useGetLatestRewardAddressUser = createQueryHook(
  getContractTypeForCycle,
  "GET_LATEST_REWARD_ADDRESS",
  {
    requiresArgs: true,
    defaultCycleId: FUTURE_MIGRATION_ID,
  },
);

export const useIsContractActive = createQueryHook(
  getContractTypeForCycle,
  "GET_IS_CONTRACT_ACTIVE",
);

export const useMinHoldForEnrollment = createQueryHook(
  getContractTypeForCycle,
  "GET_MIN_HOLD_FOR_ENROLLMENT",
  {
    staleTime: 300_000, // 5 minutes
  },
);

export const useIsDistributionFinalizedForThisCycle = createQueryHook(
  getContractTypeForCycle,
  "IS_DISTRIBUTION_FINALIZED_FOR_CURRENT_CYCLE",
);

export const useNrCyclesYear = createQueryHook(
  getContractTypeForCycle,
  "GET_NR_CYCLES_YEAR",
  {
    staleTime: 3600_000, // 1 hour
  },
);
