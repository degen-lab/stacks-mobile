"use client";

import { principalArgFromAddress } from "@/lib/stacks/addresses";
import {
  useIsEnrolledCurrentCycle,
  useIsEnrolledNextCycle,
} from "@/api/dual-stacking/contract";
import { mapEnrollmentToStatus, Status } from "../types/status";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";

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
  const principalArg = principalArgFromAddress(stxAddress);
  const {
    data: isEnrolledNow,
    isLoading: isLoadingNow,
    isError: isErrorNow,
  } = useIsEnrolledCurrentCycle(principalArg);

  const {
    data: isEnrolledNext,
    isLoading: isLoadingNext,
    isError: isErrorNext,
  } = useIsEnrolledNextCycle(principalArg);

  const enrolled = !!isEnrolledNow && !!isEnrolledNext;
  return {
    status: mapEnrollmentToStatus(
      Boolean(stxAddress && isEnrolledNow),
      Boolean(stxAddress && isEnrolledNext),
    ),

    enrolled,
    enrolledCurrentCycle: isEnrolledNow as boolean,
    enrolledNextCycle: isEnrolledNext as boolean,
    isLoading: isWalletLoading || isLoadingNow || isLoadingNext,
    isError: isErrorNow || isErrorNext,
  };
}
