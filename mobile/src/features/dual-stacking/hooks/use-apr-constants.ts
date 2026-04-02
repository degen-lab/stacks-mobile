import { useMemo } from "react";
import { BASE_APR, MAX_APR } from "@/lib/stacks/utils";
import { useEnrollmentStatus } from "./use-enrollment-status";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { principalArgFromAddress } from "@/lib/stacks/addresses";
import {
  useLastCycleAprs,
  useProjectRewards,
} from "@/api/dual-stacking/project-rewards";
import {
  useSbtcInWallet,
  useUserStackingDefiBalances,
} from "@/api/dual-stacking/contract";
/**
 * - Fetches weighted average APR from the API
 * - Initially returns constant values (BASE_APR, MAX_APR) until first API request completes
 * - After first request resolves, uses values from project rewards API if available
 * - Falls back to constants if API data is unavailable
 *
 */
export function useAprConstants() {
  const { stxAddress } = useWalletAddresses();
  const principal = principalArgFromAddress(stxAddress);
  const { enrolledNextCycle } = useEnrollmentStatus();

  const { data: lastCycleAprs } = useLastCycleAprs();

  const dynamicMaxAPR = lastCycleAprs?.max_defi_apr
    ? Number(lastCycleAprs.max_defi_apr)
    : MAX_APR;

  const { data: sbtcBalance } = useSbtcInWallet(principal);
  const { data: stackingDefiBalances, isError: stackingDefiReadError } =
    useUserStackingDefiBalances(principal);
  const totalSbtcDefi = stackingDefiBalances?.totalDefiSats;
  const stxStacked = stackingDefiBalances?.stxStackedUstx;

  const includeLiveBalances =
    enrolledNextCycle &&
    sbtcBalance !== undefined &&
    stxStacked !== undefined &&
    (totalSbtcDefi !== undefined || stackingDefiReadError);

  const rewardsParams = useMemo(
    () => ({
      address: stxAddress as string,
      maxApr: dynamicMaxAPR,
      ...(includeLiveBalances && {
        sbtcWallet: Number(sbtcBalance || 0),
        sbtcDefi: Number(totalSbtcDefi || 0),
        stx: Number(stxStacked || 0),
      }),
    }),
    [
      stxAddress,
      dynamicMaxAPR,
      includeLiveBalances,
      sbtcBalance,
      totalSbtcDefi,
      stxStacked,
    ],
  );

  const shouldQueryRewards =
    !!stxAddress && enrolledNextCycle && includeLiveBalances;

  const { data: projectRewards, isFetched } = useProjectRewards({
    variables: rewardsParams,
    enabled: shouldQueryRewards,
  });
  const baseAPR = useMemo(() => {
    if (isFetched && projectRewards?.baseAPR) {
      return Number(projectRewards.baseAPR);
    }
    return BASE_APR;
  }, [isFetched, projectRewards?.baseAPR]);
  const maxAPR = useMemo(() => {
    if (isFetched && projectRewards?.maxAPR) {
      return Number(projectRewards.maxAPR);
    }
    return dynamicMaxAPR;
  }, [isFetched, projectRewards?.maxAPR, dynamicMaxAPR]);

  return {
    baseAPR,
    maxAPR,
    projectRewardsMaxApr: dynamicMaxAPR,
  };
}
