import axios from "axios";
import { useMemo } from "react";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ClarityValue, cvToJSON } from "@stacks/transactions";

import { fetchReadOnly } from "@/api/stacks/read-only";
import { transformClarityValue } from "@/lib/stacks/transform-clarity-value";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import {
  CURRENT_MIGRATION_ID,
  getContractDetails,
  getContractTypeForCycle,
  meetsMinimumEnrollmentReadOnlyArgs,
} from "@/lib/stacks/utils";
import { getStacksDegenApiBase } from "@/lib/stacks/network";
import { useSelectedNetwork } from "@/lib/store/settings";
import { useDualStackingData } from "../use-dual-stacking-data";
import {
  dualStackingRowToCycleData,
  fetchCurrentBurnchainBlockHeight,
  fetchDistributionFinalizedForLatestCycle,
  fetchLatestRewardAddress,
  getLatestDualStackingCycleRow,
  isContractActiveFromDualStackingData,
  NR_CYCLES_PER_YEAR_HARDCODED,
} from "../backend";

type ContractType = keyof typeof CONTRACTS.mainnet;
type HookOptions = Partial<UseQueryOptions> & {
  requiresArgs?: boolean;
  select?: (data: any) => any;
  useDegenApi?: boolean;
};

const REFETCH_INTERVAL = 30_000;
const MAINNET_DUAL_STACKING_V3_BALANCES_CONTRACT =
  "SP1HFCRKEJ8BYW4D0E3FAWHFDX8A25PPAA83HWWZ9.dual-stacking-v3-balances";
const GET_USER_BALANCES_FN = "get-user-balances";

export type UserStackingDefiBalances = {
  stxStackedUstx: number;
  totalDefiSats: number;
};

const toSafeNumber = (value: unknown): number => {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseGetUserBalancesTuple = (raw: unknown): UserStackingDefiBalances => {
  if (!raw || typeof raw !== "object") {
    return { stxStackedUstx: 0, totalDefiSats: 0 };
  }

  const tuple = raw as Record<string, unknown>;
  return {
    stxStackedUstx: toSafeNumber(tuple["stx-stacked"]),
    totalDefiSats: toSafeNumber(tuple["total-defi"]),
  };
};

const legacyStackedToUstx = (raw: unknown): number => {
  if (raw == null) return 0;
  if (typeof raw === "bigint" || typeof raw === "number") {
    return Number(raw);
  }
  if (typeof raw === "object" && raw !== null && "total" in raw) {
    return toSafeNumber((raw as { total?: unknown }).total);
  }
  return toSafeNumber(raw);
};

const legacyDefiToSats = (raw: unknown): number => {
  return toSafeNumber((raw as { total?: unknown } | null)?.total ?? raw);
};

async function fetchContractReadOnly<T = any>(
  selectedNetwork: keyof typeof CONTRACTS,
  contractType: ContractType,
  functionName: string,
  args: ClarityValue[] = [],
  useDegenApi = false,
): Promise<T> {
  const contractId = CONTRACTS[selectedNetwork][contractType];
  const { address, name } = getContractDetails(contractId);
  const functionMap = SC_FUNCTIONS[contractType as keyof typeof SC_FUNCTIONS];
  const functionPath =
    functionMap?.readOnlyFunctions?.[
      functionName as keyof typeof functionMap.readOnlyFunctions
    ];

  if (!functionPath) {
    throw new Error(`Function ${functionName} not found in ${contractType}`);
  }

  return fetchReadOnly<T>(
    address,
    name,
    functionPath,
    args,
    address,
    useDegenApi,
  );
}

async function postStacksContractCallRead<T = unknown>(
  contractAddress: string,
  contractName: string,
  functionPath: string,
  args: string[] = [],
): Promise<T> {
  const base = getStacksDegenApiBase().replace(/\/+$/, "");
  const url = `${base}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionPath}`;

  const response = await axios.post<{
    okay?: boolean;
    cause?: string;
    result?: string;
  }>(
    url,
    {
      sender: contractAddress,
      arguments: args,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10_000,
    },
  );

  const payload = response.data;
  if (payload?.okay === false) {
    throw new Error(
      payload.cause ?? `${contractName}.${functionPath} returned okay: false`,
    );
  }
  if (typeof payload?.result !== "string") {
    throw new Error(
      `${contractName}.${functionPath} missing result in API response`,
    );
  }

  return transformClarityValue(payload.result) as T;
}

async function fetchUserStackingDefiBalances(
  selectedNetwork: keyof typeof CONTRACTS,
  args: ClarityValue[],
): Promise<UserStackingDefiBalances> {
  if (selectedNetwork === "mainnet") {
    const { address, name } = getContractDetails(
      MAINNET_DUAL_STACKING_V3_BALANCES_CONTRACT,
    );
    const raw = await fetchReadOnly(
      address,
      name,
      GET_USER_BALANCES_FN,
      args,
      address,
      true,
    );

    return parseGetUserBalancesTuple(raw);
  }

  const contractType = getContractTypeForCycle(CURRENT_MIGRATION_ID);
  const [stackedRaw, defiRaw] = await Promise.all([
    fetchContractReadOnly(
      selectedNetwork,
      contractType,
      "GET_AMOUNT_STACKED_NOW",
      args,
      true,
    ),
    fetchContractReadOnly(
      selectedNetwork,
      contractType,
      "GET_DEFI_SBTC_BALANCE",
      args,
      true,
    ),
  ]);

  return {
    stxStackedUstx: legacyStackedToUstx(stackedRaw),
    totalDefiSats: legacyDefiToSats(defiRaw),
  };
}

function extractPrincipalAddress(
  args: ClarityValue[] = [],
): string | undefined {
  const value = args[0];
  if (!value) return undefined;

  const principal = cvToJSON(value).value;
  return typeof principal === "string" ? principal : undefined;
}

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
      queryFn: () =>
        fetchContractReadOnly<T>(
          selectedNetwork,
          resolvedContractType,
          functionName,
          args,
          useDegenApi,
        ),
      staleTime,
      refetchInterval,
      select,
      enabled: requiresArgs ? !!args[0] : true,
      ...restOptions,
    });
  };
};

export const useSbtcInWallet = createQueryHook("sbtc", "GET_SBTC_BALANCE", {
  requiresArgs: true,
  refetchInterval: REFETCH_INTERVAL,
  staleTime: 10_000,
});

export function useUserStackingDefiBalances(args: ClarityValue[] = []) {
  const { selectedNetwork } = useSelectedNetwork();

  return useQuery({
    queryKey: ["user-stacking-defi-balances", selectedNetwork, ...args],
    queryFn: () => fetchUserStackingDefiBalances(selectedNetwork, args),
    staleTime: 10_000,
    refetchInterval: REFETCH_INTERVAL,
    enabled: args.length > 0,
  });
}

export function useAmountStackedNow(args: ClarityValue[] = []) {
  const { selectedNetwork } = useSelectedNetwork();

  return useQuery({
    queryKey: ["user-stacking-defi-balances", selectedNetwork, ...args],
    queryFn: () => fetchUserStackingDefiBalances(selectedNetwork, args),
    staleTime: 10_000,
    refetchInterval: REFETCH_INTERVAL,
    enabled: args.length > 0,
    select: (data: UserStackingDefiBalances) => data.stxStackedUstx,
  });
}

export function useUserTotalSbtcInDefi(args: ClarityValue[] = []) {
  const { selectedNetwork } = useSelectedNetwork();

  return useQuery({
    queryKey: ["user-stacking-defi-balances", selectedNetwork, ...args],
    queryFn: () => fetchUserStackingDefiBalances(selectedNetwork, args),
    staleTime: 10_000,
    refetchInterval: REFETCH_INTERVAL,
    enabled: args.length > 0,
    select: (data: UserStackingDefiBalances) => data.totalDefiSats,
  });
}

export const useCurrentBitcoinBlockHeight = () => {
  const { selectedNetwork } = useSelectedNetwork();

  return useQuery({
    queryKey: ["current-burnchain-block-height", selectedNetwork],
    queryFn: fetchCurrentBurnchainBlockHeight,
    staleTime: REFETCH_INTERVAL,
    refetchInterval: REFETCH_INTERVAL,
  });
};

export function useYieldCycleDataReadOnly() {
  const dualStackingQuery = useDualStackingData();
  const data = useMemo(() => {
    const row = getLatestDualStackingCycleRow(dualStackingQuery.data);
    return row ? dualStackingRowToCycleData(row) : undefined;
  }, [dualStackingQuery.data]);

  return {
    data,
    isPending: dualStackingQuery.isPending,
    isLoading: dualStackingQuery.isLoading,
    isError: dualStackingQuery.isError,
    isFetching: dualStackingQuery.isFetching,
    refetch: dualStackingQuery.refetch,
  };
}

export function useGetLatestRewardAddressUser(
  args: ClarityValue[] = [],
  enabled = true,
) {
  const { selectedNetwork } = useSelectedNetwork();
  const stacksAddress = extractPrincipalAddress(args);

  return useQuery({
    queryKey: ["latest-reward-address", selectedNetwork, stacksAddress],
    queryFn: () => fetchLatestRewardAddress(stacksAddress as string),
    enabled: enabled && Boolean(stacksAddress),
    staleTime: 60_000,
  });
}

export function useIsContractActive() {
  const dualStackingQuery = useDualStackingData();
  const bitcoinHeightQuery = useCurrentBitcoinBlockHeight();
  const data = useMemo(
    () =>
      isContractActiveFromDualStackingData(
        dualStackingQuery.data,
        bitcoinHeightQuery.data,
      ),
    [dualStackingQuery.data, bitcoinHeightQuery.data],
  );

  return {
    data,
    isPending: dualStackingQuery.isPending || bitcoinHeightQuery.isPending,
    isLoading: dualStackingQuery.isLoading || bitcoinHeightQuery.isLoading,
    isError: dualStackingQuery.isError || bitcoinHeightQuery.isError,
    isFetching: dualStackingQuery.isFetching || bitcoinHeightQuery.isFetching,
    refetch: () =>
      Promise.all([
        dualStackingQuery.refetch(),
        bitcoinHeightQuery.refetch(),
      ]).then(() => undefined),
  };
}

export function useMeetsMinimumEnrollmentAmount(walletAddress?: string | null) {
  const { selectedNetwork } = useSelectedNetwork();
  const args = useMemo(
    () => meetsMinimumEnrollmentReadOnlyArgs(walletAddress),
    [walletAddress],
  );
  const contractType = getContractTypeForCycle(CURRENT_MIGRATION_ID);
  const contractId = CONTRACTS[selectedNetwork][contractType];
  const { address, name } = getContractDetails(contractId);

  return useQuery({
    queryKey: [
      contractType,
      "GET_MEETS_MINIMUM_ENROLLMENT_AMOUNT",
      selectedNetwork,
      walletAddress,
      ...args,
    ],
    queryFn: () =>
      postStacksContractCallRead<boolean>(
        address,
        name,
        SC_FUNCTIONS[contractType].readOnlyFunctions
          .GET_MEETS_MINIMUM_ENROLLMENT_AMOUNT,
        args,
      ),
    enabled: args.length > 0,
    staleTime: 60_000,
  });
}

export const useIsDistributionFinalizedForThisCycle = () => {
  const { selectedNetwork } = useSelectedNetwork();

  return useQuery({
    queryKey: ["distribution-finalized", selectedNetwork],
    queryFn: fetchDistributionFinalizedForLatestCycle,
    staleTime: 60_000,
  });
};

export function useNrCyclesYear() {
  const { selectedNetwork } = useSelectedNetwork();

  return useQuery({
    queryKey: ["nr-cycles-year", selectedNetwork],
    queryFn: () => NR_CYCLES_PER_YEAR_HARDCODED,
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: NR_CYCLES_PER_YEAR_HARDCODED,
  });
}
