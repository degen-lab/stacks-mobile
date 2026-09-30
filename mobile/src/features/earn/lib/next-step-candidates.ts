import type { EarnAcquisitionAsset, EarnNextStepCard } from "../types";

export const MIN_STACKING_STX = 40;

type CandidateKind = "actionable" | "preview" | "success";

export type EarnNextStepCandidate = Omit<EarnNextStepCard, "status"> & {
  priority: number;
  kind: CandidateKind;
};

export type BuildEarnNextStepCardsArgs = {
  btcBalance: number | null;
  bridgeDepositMinimumBtc: number;
  sbtcBalance: number;
  totalStxBalance: number;
  availableStxBalance: number;
  lockedStxBalance: number;
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

function buildBridgeCandidate(): EarnNextStepCandidate {
  return {
    id: "bridge-sbtc",
    title: "Bridge BTC to sBTC",
    description: "Bridge BTC to sBTC to use your Bitcoin on Stacks.",
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

function hasEnoughBtcForBridge(
  btcBalance: number | null,
  bridgeDepositMinimumBtc: number,
) {
  if (btcBalance == null) return false;

  return bridgeDepositMinimumBtc > 0
    ? btcBalance >= bridgeDepositMinimumBtc
    : btcBalance > 0;
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
  sbtcBalance,
  totalStxBalance,
  availableStxBalance,
  lockedStxBalance,
  stackingApr,
}: BuildEarnNextStepCardsArgs): EarnNextStepCandidate[] {
  const isStacking = lockedStxBalance > 0;
  const hasSbtc = sbtcBalance > 0;
  const hasEnoughBtc = hasEnoughBtcForBridge(
    btcBalance,
    bridgeDepositMinimumBtc,
  );
  const candidates: EarnNextStepCandidate[] = [];

  if (hasEnoughBtc && !hasSbtc) {
    candidates.push(buildBridgeCandidate());
  }

  if (availableStxBalance >= MIN_STACKING_STX && !isStacking) {
    candidates.push(buildStackingCandidate(stackingApr));
  }

  if (candidates.length === 0 && !hasEnoughBtc && !hasSbtc) {
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
  totalStxBalance,
  availableStxBalance,
  lockedStxBalance,
}: Pick<
  BuildEarnNextStepCardsArgs,
  | "btcBalance"
  | "bridgeDepositMinimumBtc"
  | "sbtcBalance"
  | "totalStxBalance"
  | "availableStxBalance"
  | "lockedStxBalance"
>) {
  const isStacking = lockedStxBalance > 0;
  const hasSbtc = sbtcBalance > 0;
  const hasEnoughBtc = hasEnoughBtcForBridge(
    btcBalance,
    bridgeDepositMinimumBtc,
  );
  const candidates: EarnNextStepCandidate[] = [];

  if (
    !isStacking &&
    availableStxBalance >= MIN_STACKING_STX &&
    !hasEnoughBtc &&
    !hasSbtc
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
