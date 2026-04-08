import {
  formatMicroStx,
  fromStxToUstx,
  fromUstxToStx,
  MICRO_STX,
} from "@/lib/format/currency";
import type { StackingPosition } from "../types";

const MIN_LOCKED_STX = 40;
const STACKING_BUFFER_STX = 1;

const MIN_LOCKED_MICRO_STX = MIN_LOCKED_STX * MICRO_STX;
const STACKING_BUFFER_MICRO_STX = STACKING_BUFFER_STX * MICRO_STX;
const NEXT_CYCLE_MIN_INCREMENT_MICRO_STX = MICRO_STX;

const toClampedUstx = (amountStx: number) =>
  Math.max(0, Math.floor(fromStxToUstx(amountStx)));

type StackingAmountStateArgs = {
  activePosition?: StackingPosition;
  pendingAmount?: number;
  stxBalance: number;
  availableStxBalance: number;
  burnchainUnlockHeight: number;
  nextCycleRewardPhaseStartBurnHeight?: number;
  hasChanges: boolean;
};

export function getStackingAmountState({
  activePosition,
  pendingAmount,
  stxBalance,
  availableStxBalance,
  burnchainUnlockHeight,
  nextCycleRewardPhaseStartBurnHeight,
  hasChanges,
}: StackingAmountStateArgs) {
  const currentLockedAmountMicroStx = toClampedUstx(
    activePosition?.lockedAmount ?? 0,
  );
  const pendingAmountMicroStx =
    pendingAmount !== undefined
      ? toClampedUstx(pendingAmount)
      : currentLockedAmountMicroStx;
  const delegateAmountMicroStx =
    pendingAmountMicroStx > 0
      ? pendingAmountMicroStx + STACKING_BUFFER_MICRO_STX
      : 0;
  const delegateAmountStx = fromUstxToStx(delegateAmountMicroStx);
  const isUnlocking = activePosition?.status === "UNLOCKING";
  const isLockedThroughNextCycle =
    typeof nextCycleRewardPhaseStartBurnHeight === "number" &&
    burnchainUnlockHeight > nextCycleRewardPhaseStartBurnHeight;
  const maxFundingBalanceMicroStx = toClampedUstx(
    activePosition ? stxBalance : availableStxBalance,
  );
  const maxLockableAmountMicroStx = Math.max(
    0,
    maxFundingBalanceMicroStx - STACKING_BUFFER_MICRO_STX,
  );
  const maxLockableAmountStx = fromUstxToStx(maxLockableAmountMicroStx);
  const availableToAddAmountMicroStx = activePosition
    ? Math.max(0, maxLockableAmountMicroStx - currentLockedAmountMicroStx)
    : maxLockableAmountMicroStx;
  const availableToAddAmountStx = fromUstxToStx(availableToAddAmountMicroStx);
  const nextCycleMinimumLockedAmountMicroStx =
    currentLockedAmountMicroStx + NEXT_CYCLE_MIN_INCREMENT_MICRO_STX;
  const nextCycleMinimumLockedAmountLabel = formatMicroStx(
    nextCycleMinimumLockedAmountMicroStx,
  );
  const nextCycleMinimumRequiredBalanceMicroStx =
    nextCycleMinimumLockedAmountMicroStx + STACKING_BUFFER_MICRO_STX;
  const nextCycleMinimumRequiredBalanceLabel = formatMicroStx(
    nextCycleMinimumRequiredBalanceMicroStx,
  );
  const minimumRequiredLockedAmountMicroStx =
    activePosition && isUnlocking && isLockedThroughNextCycle
      ? nextCycleMinimumLockedAmountMicroStx
      : MIN_LOCKED_MICRO_STX;
  const minimumRequiredLockedAmountStx = fromUstxToStx(
    minimumRequiredLockedAmountMicroStx,
  );
  const minimumRequiredLockedAmountLabel = formatMicroStx(
    minimumRequiredLockedAmountMicroStx,
  );
  const calculatorMinimumAmountStx =
    activePosition?.status === "ACTIVE"
      ? activePosition.lockedAmount
      : minimumRequiredLockedAmountStx;
  const effectiveLockedAmountMicroStx =
    pendingAmount !== undefined
      ? Math.min(delegateAmountMicroStx, maxLockableAmountMicroStx)
      : undefined;
  const isDecreaseBlocked = Boolean(
    activePosition &&
    pendingAmount !== undefined &&
    delegateAmountMicroStx < currentLockedAmountMicroStx,
  );
  const isIncreaseAttempt = Boolean(
    activePosition &&
    pendingAmount !== undefined &&
    pendingAmountMicroStx > currentLockedAmountMicroStx,
  );
  const hasEffectiveIncrease = Boolean(
    activePosition &&
    effectiveLockedAmountMicroStx !== undefined &&
    effectiveLockedAmountMicroStx >= nextCycleMinimumLockedAmountMicroStx,
  );
  const requiresAdditionalFundsForIncrease = Boolean(
    activePosition &&
    (hasChanges || isIncreaseAttempt) &&
    !isDecreaseBlocked &&
    isLockedThroughNextCycle &&
    nextCycleMinimumRequiredBalanceMicroStx > maxFundingBalanceMicroStx,
  );
  const isAlreadyStackedForNextCycle = Boolean(
    activePosition &&
    !isDecreaseBlocked &&
    isLockedThroughNextCycle &&
    !hasEffectiveIncrease,
  );
  const blockedStackingReason = isDecreaseBlocked
    ? "Fast Pool only supports increasing. To decrease, leave Fast Pool and stack again after your unlock date."
    : isAlreadyStackedForNextCycle
      ? requiresAdditionalFundsForIncrease
        ? `To increase for next cycle, you need ${nextCycleMinimumLockedAmountLabel} STX locked, which requires ${nextCycleMinimumRequiredBalanceLabel} STX total so 1 STX stays unlocked.`
        : ``
      : undefined;
  const hasSufficientFunds =
    pendingAmount !== undefined && pendingAmount > 0
      ? delegateAmountMicroStx <= maxFundingBalanceMicroStx
      : true;

  return {
    delegateAmountMicroStx,
    delegateAmountStx,
    minimumRequiredLockedAmountLabel,
    calculatorMinimumAmountStx,
    maxLockableAmountStx,
    availableToAddAmountStx,
    isDecreaseBlocked,
    isAlreadyStackedForNextCycle,
    requiresAdditionalFundsForIncrease,
    blockedStackingReason,
    hasSufficientFunds,
  };
}
