import type { EarnAcquisitionAsset, EarnNextStepCard } from "../types";

export const MIN_STACKING_STX = 40;

type CandidateKind = "actionable" | "preview" | "success";

export type EarnNextStepCandidate = Omit<EarnNextStepCard, "status"> & {
  priority: number;
  kind: CandidateKind;
};

export type BuildEarnNextStepCardsArgs = {
  btcBalance: number;
  bridgeDepositMinimumBtc: number;
  sbtcBalance: number;
  meetsMinimumSbtcForEnrollment: boolean;
  totalStxBalance: number;
  availableStxBalance: number;
  lockedStxBalance: number;
  isEnrolledCurrentCycle: boolean;
  isEnrolledNextCycle: boolean;
  nextRewardPhaseLabel: string | null;
  stackingApr: number | null;
};

type CandidateOptions = Pick<EarnNextStepCandidate, "kind" | "priority">;

function formatStackingAprLabel(stackingApr: number | null) {
  if (stackingApr == null || !Number.isFinite(stackingApr)) {
    return "competitive APY";
  }

  const roundedApr =
    stackingApr >= 10
      ? Math.round(stackingApr)
      : Number(stackingApr.toFixed(1));

  return `up to ${roundedApr}% APY`;
}

function buildAcquireCandidate(
  asset: EarnAcquisitionAsset,
  options: CandidateOptions,
): EarnNextStepCandidate {
  if (asset === "BTC") {
    return {
      id: "get-btc",
      title: "Get BTC",
      description: "Buy or receive BTC, then bridge it to sBTC.",
      action: { type: "acquire", asset: "BTC" },
      ...options,
    };
  }

  return {
    id: "get-stx",
    title: "Get STX",
    description: `You need at least ${MIN_STACKING_STX} STX to start stacking.`,
    action: { type: "acquire", asset: "STX" },
    ...options,
  };
}

function buildDualStackingCandidate({
  isEnrolledCurrentCycle,
  isStacking,
}: {
  isEnrolledCurrentCycle: boolean;
  isStacking: boolean;
}): EarnNextStepCandidate {
  if (isEnrolledCurrentCycle) {
    return {
      id: "dual-stacking",
      title: "Dual Stacking",
      description: "Renew next cycle to keep sBTC rewards on.",
      kind: "actionable",
      priority: 1,
      action: { type: "dual-stacking" },
    };
  }

  return {
    id: "dual-stacking",
    title: "Dual Stacking",
    description: isStacking
      ? "Enroll to start boosted stacking rewards."
      : "Enroll to receive rewards for holding sBTC.",
    kind: "actionable",
    priority: 2,
    action: { type: "dual-stacking" },
  };
}

function buildBridgeCandidate(): EarnNextStepCandidate {
  return {
    id: "bridge-sbtc",
    title: "Bridge BTC to sBTC",
    description: "Bridge BTC to sBTC so you can enroll in Dual Stacking.",
    kind: "actionable",
    priority: 4,
    action: { type: "bridge" },
  };
}

function buildStackingCandidate(
  stackingApr: number | null,
): EarnNextStepCandidate {
  return {
    id: "stack-stx",
    title: "Stack your STX",
    description: `Earn ${formatStackingAprLabel(stackingApr)} in STX stacking rewards.`,
    kind: "actionable",
    priority: 1,
    action: { type: "stacking" },
  };
}

function buildStackingPreviewCandidate(): EarnNextStepCandidate {
  return {
    id: "stack-stx",
    title: "Stack your STX",
    description: `Reach ${MIN_STACKING_STX} STX to start stacking.`,
    kind: "preview",
    priority: 2,
    action: { type: "stacking" },
  };
}

function buildDualStackingPreviewCandidate(
  hasSbtcBalance: boolean,
): EarnNextStepCandidate {
  return {
    id: "dual-stacking",
    title: "Enroll in Dual Stacking",
    description: hasSbtcBalance
      ? "Add more sBTC to enroll in Dual Stacking."
      : "Use sBTC to enroll and start earning rewards.",
    kind: "preview",
    priority: 1,
    action: { type: "dual-stacking" },
  };
}

export function buildSuccessCandidate(
  nextRewardPhaseLabel: string | null,
): EarnNextStepCandidate {
  return {
    id: "all-set",
    title: "You're all set",
    description: nextRewardPhaseLabel
      ? `Next rewards phase starts in ${nextRewardPhaseLabel}.`
      : "Your earn setup is ready.",
    kind: "success",
    priority: 99,
    action: { type: "none" },
  };
}

export function buildActionableCandidates({
  btcBalance,
  bridgeDepositMinimumBtc,
  meetsMinimumSbtcForEnrollment,
  totalStxBalance,
  availableStxBalance,
  lockedStxBalance,
  isEnrolledCurrentCycle,
  isEnrolledNextCycle,
  stackingApr,
}: BuildEarnNextStepCardsArgs): EarnNextStepCandidate[] {
  const isStacking = lockedStxBalance > 0;
  const hasEnoughBtcForBridge =
    bridgeDepositMinimumBtc > 0
      ? btcBalance >= bridgeDepositMinimumBtc
      : btcBalance > 0;
  const candidates: EarnNextStepCandidate[] = [];

  if (meetsMinimumSbtcForEnrollment && !isEnrolledNextCycle) {
    candidates.push(
      buildDualStackingCandidate({ isEnrolledCurrentCycle, isStacking }),
    );
  }

  if (hasEnoughBtcForBridge && !meetsMinimumSbtcForEnrollment) {
    candidates.push(buildBridgeCandidate());
  }

  if (availableStxBalance >= MIN_STACKING_STX && !isStacking) {
    candidates.push(buildStackingCandidate(stackingApr));
  }

  if (
    candidates.length === 0 &&
    !hasEnoughBtcForBridge &&
    !meetsMinimumSbtcForEnrollment
  ) {
    if (isStacking) {
      candidates.push(
        buildAcquireCandidate("BTC", { kind: "actionable", priority: 5 }),
      );
    } else if (totalStxBalance < MIN_STACKING_STX) {
      candidates.push(
        buildAcquireCandidate("STX", { kind: "actionable", priority: 4 }),
        buildAcquireCandidate("BTC", { kind: "actionable", priority: 5 }),
      );
    }
  }

  return candidates;
}

export function buildPreviewCandidates({
  btcBalance,
  bridgeDepositMinimumBtc,
  sbtcBalance,
  meetsMinimumSbtcForEnrollment,
  totalStxBalance,
  availableStxBalance,
  lockedStxBalance,
}: Pick<
  BuildEarnNextStepCardsArgs,
  | "btcBalance"
  | "bridgeDepositMinimumBtc"
  | "sbtcBalance"
  | "meetsMinimumSbtcForEnrollment"
  | "totalStxBalance"
  | "availableStxBalance"
  | "lockedStxBalance"
>) {
  const isStacking = lockedStxBalance > 0;
  const hasEnoughBtcForBridge =
    bridgeDepositMinimumBtc > 0
      ? btcBalance >= bridgeDepositMinimumBtc
      : btcBalance > 0;
  const candidates: EarnNextStepCandidate[] = [];

  if (isStacking && !meetsMinimumSbtcForEnrollment) {
    candidates.push(buildDualStackingPreviewCandidate(sbtcBalance > 0));
  }

  if (
    !isStacking &&
    availableStxBalance >= MIN_STACKING_STX &&
    !hasEnoughBtcForBridge &&
    !meetsMinimumSbtcForEnrollment
  ) {
    candidates.push(
      buildAcquireCandidate("BTC", { kind: "preview", priority: 1 }),
    );
  }

  if (totalStxBalance < MIN_STACKING_STX && !isStacking) {
    candidates.push(
      buildAcquireCandidate("STX", { kind: "preview", priority: 1 }),
    );
    candidates.push(buildStackingPreviewCandidate());
  }

  return candidates;
}
