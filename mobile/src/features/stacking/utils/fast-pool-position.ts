import type { UserStackingDataRow } from "@/api/stacking";
import type { StackingPosition } from "../types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (
  value: Record<string, unknown>,
  key: string,
): string | undefined => {
  const candidate = value[key];
  return typeof candidate === "string" ? candidate : undefined;
};

function isContractCall(
  value: unknown,
  contractId: string,
  functionName: string,
): boolean {
  if (!isRecord(value)) return false;
  const contractCallRecord = isRecord(value.contract_call)
    ? value.contract_call
    : null;
  if (!contractCallRecord) return false;
  return (
    getString(contractCallRecord, "contract_id") === contractId &&
    getString(contractCallRecord, "function_name") === functionName
  );
}

export const isFastPoolLockTransaction = (
  value: unknown,
  poolContract: string,
) => isContractCall(value, poolContract, "delegate-stx");

const isRevokedDelegationTransaction = (value: unknown, poxContract: string) =>
  isContractCall(value, poxContract, "revoke-delegate-stx");

type FastPoolPositionStateArgs = {
  currentLockTx: unknown;
  poolContract: string;
  poxContract: string;
  isStacking: boolean;
  lockedBalance: number;
  userStackingData: UserStackingDataRow[];
};

export function getFastPoolPositionState({
  currentLockTx,
  poolContract,
  poxContract,
  isStacking,
  lockedBalance,
  userStackingData,
}: FastPoolPositionStateArgs): {
  currentLockIsFastPool: boolean;
  isUnlocking: boolean;
  activePosition?: StackingPosition;
} {
  const currentLockIsFastPool = isFastPoolLockTransaction(
    currentLockTx,
    poolContract,
  );
  const isUnlocking =
    !isStacking &&
    lockedBalance > 0 &&
    (currentLockIsFastPool ||
      isRevokedDelegationTransaction(currentLockTx, poxContract));

  if (!isStacking && !isUnlocking) {
    return {
      currentLockIsFastPool,
      isUnlocking,
      activePosition: undefined,
    };
  }

  const totalRewardedStx = userStackingData.reduce(
    (total, delegation) => total + Number(delegation.rewardedStxAmount ?? 0),
    0,
  );
  const hasTrackedRewards = userStackingData.some(
    (delegation) => delegation.rewardedStxAmount != null,
  );

  return {
    currentLockIsFastPool,
    isUnlocking,
    activePosition: {
      lockedAmount: lockedBalance,
      lockDuration: 1,
      status: isUnlocking ? "UNLOCKING" : "ACTIVE",
      poolName: "Fast Pool",
      rewardedStxAmount: hasTrackedRewards ? totalRewardedStx : undefined,
    },
  };
}
