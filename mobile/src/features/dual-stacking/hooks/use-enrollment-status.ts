import { useQuery } from "@tanstack/react-query";

import { fetchIsEnrolled } from "@/api/dual-stacking/backend";
import { useYieldCycleDataReadOnly } from "@/api/dual-stacking/contract";
import { mapEnrollmentToStatus, Status } from "../types/status";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import type { CycleData } from "@/api/dual-stacking/backend";
import { IS_ENROLLED_QUERY_KEY } from "./use-track-enroll-tx";

const ENROLL_REFETCH_MS = 30_000;

type UseEnrollmentStatus = {
  status: Status;
  enrolled: boolean;
  enrolledCurrentCycle: boolean;
  enrolledNextCycle: boolean;
  isLoading: boolean;
  isError: boolean;
};

export function useEnrollmentStatus(): UseEnrollmentStatus {
  const { stxAddress, isLoading: isWalletLoading } = useWalletAddresses();
  const {
    data: cycleData,
    isLoading: cycleLoading,
    isError: cycleError,
  } = useYieldCycleDataReadOnly();

  const cycleId =
    cycleData != null
      ? Number((cycleData as CycleData)["cycle-id"])
      : undefined;

  const enrollEnabled =
    Boolean(stxAddress) && cycleId !== undefined && !Number.isNaN(cycleId);

  const {
    data: enrolledData,
    isPending: enrollPending,
    isError: enrollError,
  } = useQuery({
    queryKey: [IS_ENROLLED_QUERY_KEY, stxAddress, cycleId],
    queryFn: () => fetchIsEnrolled(stxAddress as string, cycleId as number),
    enabled: enrollEnabled,
    staleTime: ENROLL_REFETCH_MS,
    refetchInterval: ENROLL_REFETCH_MS,
  });

  const isEnrolledNow = enrolledData?.isEnrolledCurrentCycle;
  const isEnrolledNext = enrolledData?.isEnrolledNextCycle;
  return {
    status: mapEnrollmentToStatus(
      Boolean(stxAddress && isEnrolledNow),
      Boolean(stxAddress && isEnrolledNext),
    ),

    enrolled: !!isEnrolledNow && !!isEnrolledNext,
    enrolledCurrentCycle: Boolean(isEnrolledNow),
    enrolledNextCycle: Boolean(isEnrolledNext),
    isLoading:
      isWalletLoading ||
      (Boolean(stxAddress) && cycleLoading) ||
      (enrollEnabled && enrollPending),
    isError: cycleError || enrollError,
  };
}
