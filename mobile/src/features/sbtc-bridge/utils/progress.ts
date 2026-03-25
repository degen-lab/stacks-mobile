import type { MempoolProjectedBlock } from "@/lib/bitcoin/types";
import {
  BITCOIN_CONFIRMATION_TARGET,
  BITCOIN_BLOCK_TIME_MS,
  deriveConfirmationCount,
  estimateBitcoinConfirmationMinutes,
} from "@/lib/bitcoin/mempool";

import type { BridgeStatus } from "./status";

export const BRIDGE_PROGRESS_MINUTE_MS = 60_000;

const ETA_TEXT = {
  depositAwaitingFirstConfirmation: "Waiting for first confirmation",
  depositAwaitingMoreConfirmations:
    "Waiting for remaining Bitcoin confirmations",
  depositSigners: "Usually ~5–10 min remaining",
  depositMinting: "Usually ~5 min remaining",
  withdrawalStacks: "Usually ~10 min remaining",
  withdrawalSigners: "Usually ~20 min remaining",
} as const;

const DEPOSIT_STATUS_DESCRIPTION = {
  previewLock: "Deposit your BTC to the bridge address",
  confirmedBitcoin: "The Bitcoin network confirmed your deposit.",
  moreBitcoinConfirmations: "Waiting for the remaining Bitcoin confirmations",
  signersAccepted: "sBTC signers accepted the deposit.",
  signersExpired:
    "The signer confirmation window expired before minting completed.",
  registrationPending:
    "The bridge has not acknowledged this deposit yet, so signers cannot process minting.",
} as const;

const WITHDRAWAL_STATUS_DESCRIPTION = {
  previewInitiate: "Initiate a withdrawal of your sBTC",
  confirmedStacks: "The Stacks network confirmed your withdrawal request.",
  signersProcessed: "sBTC signers accepted and processed the withdrawal.",
  payoutFinalized: "BTC was sent to your Bitcoin address.",
  failed: "The withdrawal was not fulfilled within the allowed window.",
  signersActive: "Waiting for sBTC signers to finalize the payout",
} as const;

export type BridgeProgressMode = "detail" | "preview";

export type BridgeProgressStepState =
  | "complete"
  | "active"
  | "pending"
  | "failed";

export type BridgeProgressStepTiming =
  | { kind: "countdown"; remainingMs: number }
  | { kind: "estimate"; text: string };

export type BridgeProgressStepLink = {
  label: string;
  href: string;
};

export type BridgeProgressStep = {
  id: string;
  title: string;
  description?: string;
  state: BridgeProgressStepState;
  isTerminal?: boolean;
  link?: BridgeProgressStepLink;
  timing?: BridgeProgressStepTiming;
};

type StepDefinition = Pick<BridgeProgressStep, "id" | "title"> &
  Partial<Pick<BridgeProgressStep, "description" | "isTerminal">>;

type StepOverride = Pick<BridgeProgressStep, "state"> &
  Partial<
    Pick<BridgeProgressStep, "description" | "isTerminal" | "link" | "timing">
  >;

type StepId<T extends readonly StepDefinition[]> = T[number]["id"];

type DepositConfirmationTimingArgs = {
  currentBitcoinTipHeight?: number | null;
  bitcoinConfirmationBlockHeight?: number | null;
  bitcoinConfirmationBlockTime?: number | null;
};

type BuildDepositProgressStepsArgs = {
  status: BridgeStatus;
  bitcoinConfirmed: boolean;
  isRegistrationPending?: boolean;
  bitcoinTxId?: string;
  stacksTxId?: string;
  mempoolUrl: string;
  stacksExplorerUrl?: string;
  currentBitcoinTipHeight?: number | null;
  bitcoinConfirmationBlockHeight?: number | null;
  bitcoinConfirmationBlockTime?: number | null;
  bitcoinTransactionFeeRate?: number | null;
  mempoolProjectedBlocks?: MempoolProjectedBlock[] | null;
};

type BuildWithdrawalProgressStepsArgs = {
  status: BridgeStatus;
  stacksTxId?: string;
  bitcoinTxId?: string;
  mempoolUrl: string;
  stacksExplorerUrl?: string;
};

const DEPOSIT_STEPS = [
  {
    id: "lock",
    title: "Lock BTC on Bitcoin",
    description: "Your BTC deposit transaction has been broadcast.",
  },
  {
    id: "bitcoin-confirmation",
    title: "Confirming deposit",
    description: "Waiting for Bitcoin network confirmation",
  },
  {
    id: "signers",
    title: "Signers confirming deposit",
    description: "Waiting for Stacks Signers to confirm your deposit",
  },
  {
    id: "minting",
    title: "Minting sBTC on Stacks",
    description: "Waiting for the mint transaction to finalize on Stacks",
  },
  {
    id: "complete",
    title: "Transfer complete",
    description: "sBTC received on Stacks address",
    isTerminal: true,
  },
] as const satisfies readonly StepDefinition[];

const WITHDRAWAL_STEPS = [
  {
    id: "initiate",
    title: "Initiate withdrawal",
    description: "Your sBTC withdrawal request was broadcast.",
  },
  {
    id: "stacks-confirmation",
    title: "Stacks confirmation",
    description: "Waiting for the Stacks network to confirm your request",
  },
  {
    id: "signers",
    title: "Signers processing",
    description: "Waiting for sBTC signers to process the withdrawal",
  },
  {
    id: "bitcoin-payout",
    title: "Bitcoin payout",
    description: "BTC was sent to your Bitcoin address.",
  },
  {
    id: "complete",
    title: "Transfer complete",
    description: "BTC received in your Bitcoin wallet",
    isTerminal: true,
  },
] as const satisfies readonly StepDefinition[];

function buildSteps<T extends readonly StepDefinition[]>(
  definitions: T,
  overrides: Partial<Record<StepId<T>, StepOverride>>,
): BridgeProgressStep[] {
  return definitions.map((step) => ({
    ...step,
    state: "pending",
    ...overrides[step.id as StepId<T>],
  }));
}

function buildEstimate(text: string): BridgeProgressStepTiming {
  return { kind: "estimate", text };
}

function buildCountdown(remainingMs: number): BridgeProgressStepTiming {
  return { kind: "countdown", remainingMs: Math.max(0, remainingMs) };
}

function getBitcoinConfirmationCount({
  bitcoinConfirmed,
  currentBitcoinTipHeight,
  bitcoinConfirmationBlockHeight,
}: {
  bitcoinConfirmed: boolean;
  currentBitcoinTipHeight?: number | null;
  bitcoinConfirmationBlockHeight?: number | null;
}) {
  if (!bitcoinConfirmed) return 0;

  return deriveConfirmationCount(
    currentBitcoinTipHeight,
    bitcoinConfirmationBlockHeight,
  );
}

function createBitcoinLink(mempoolUrl: string, bitcoinTxId?: string) {
  if (!bitcoinTxId) return undefined;

  return {
    label: "View on Bitcoin Mempool",
    href: `${mempoolUrl}/tx/${bitcoinTxId}`,
  };
}

function createStacksLink(stacksExplorerUrl?: string, stacksTxId?: string) {
  if (!stacksTxId || !stacksExplorerUrl) return undefined;

  return {
    label: "View on Stacks Explorer",
    href: stacksExplorerUrl,
  };
}

export function getDepositConfirmationTiming({
  currentBitcoinTipHeight,
  bitcoinConfirmationBlockHeight,
  bitcoinConfirmationBlockTime,
}: DepositConfirmationTimingArgs): BridgeProgressStepTiming {
  if (
    bitcoinConfirmationBlockHeight == null &&
    bitcoinConfirmationBlockTime == null
  ) {
    return buildEstimate(ETA_TEXT.depositAwaitingMoreConfirmations);
  }

  const currentConfirmations = deriveConfirmationCount(
    currentBitcoinTipHeight,
    bitcoinConfirmationBlockHeight,
  );

  if (currentConfirmations >= BITCOIN_CONFIRMATION_TARGET) {
    return buildCountdown(0);
  }

  if (bitcoinConfirmationBlockTime != null) {
    const firstConfirmationMs = bitcoinConfirmationBlockTime * 1000;
    const targetMs =
      firstConfirmationMs +
      (BITCOIN_CONFIRMATION_TARGET - 1) * BITCOIN_BLOCK_TIME_MS;

    return buildCountdown(targetMs - Date.now());
  }

  const remainingConfirmations = Math.max(
    BITCOIN_CONFIRMATION_TARGET - Math.max(currentConfirmations, 1),
    0,
  );

  return buildCountdown(remainingConfirmations * BITCOIN_BLOCK_TIME_MS);
}

export function getUnconfirmedDepositTiming({
  bitcoinTransactionFeeRate,
  mempoolProjectedBlocks,
}: {
  bitcoinTransactionFeeRate?: number | null;
  mempoolProjectedBlocks?: MempoolProjectedBlock[] | null;
}): BridgeProgressStepTiming {
  const estimatedMinutes = estimateBitcoinConfirmationMinutes({
    feeRate: bitcoinTransactionFeeRate,
    mempoolProjectedBlocks,
  });

  if (estimatedMinutes == null) {
    return buildEstimate(ETA_TEXT.depositAwaitingFirstConfirmation);
  }

  return buildEstimate(`Estimated time left: ~${estimatedMinutes} min`);
}

export function getDepositPreviewSteps(): BridgeProgressStep[] {
  return buildSteps(DEPOSIT_STEPS, {
    lock: {
      state: "active",
      description: DEPOSIT_STATUS_DESCRIPTION.previewLock,
    },
  });
}

export function buildDepositProgressSteps({
  status,
  bitcoinConfirmed,
  isRegistrationPending = false,
  bitcoinTxId,
  stacksTxId,
  mempoolUrl,
  stacksExplorerUrl,
  currentBitcoinTipHeight,
  bitcoinConfirmationBlockHeight,
  bitcoinConfirmationBlockTime,
  bitcoinTransactionFeeRate,
  mempoolProjectedBlocks,
}: BuildDepositProgressStepsArgs): BridgeProgressStep[] {
  const bitcoinLink = createBitcoinLink(mempoolUrl, bitcoinTxId);
  const stacksLink = createStacksLink(stacksExplorerUrl, stacksTxId);
  const bitcoinConfirmationCount = getBitcoinConfirmationCount({
    bitcoinConfirmed,
    currentBitcoinTipHeight,
    bitcoinConfirmationBlockHeight,
  });
  const hasReachedBitcoinConfirmationTarget =
    bitcoinConfirmationCount >= BITCOIN_CONFIRMATION_TARGET;

  if (status === "confirmed") {
    return buildSteps(DEPOSIT_STEPS, {
      lock: { state: "complete" },
      "bitcoin-confirmation": { state: "complete", link: bitcoinLink },
      signers: { state: "complete" },
      minting: { state: "complete" },
      complete: { state: "complete", link: stacksLink },
    });
  }

  if (status === "accepted") {
    return buildSteps(DEPOSIT_STEPS, {
      lock: { state: "complete" },
      "bitcoin-confirmation": { state: "complete", link: bitcoinLink },
      signers: { state: "complete" },
      minting: {
        state: "active",
        timing: buildEstimate(ETA_TEXT.depositMinting),
      },
    });
  }

  if (status === "failed") {
    return buildSteps(DEPOSIT_STEPS, {
      lock: { state: "complete" },
      "bitcoin-confirmation": { state: "complete", link: bitcoinLink },
      signers: {
        state: "failed",
        description: DEPOSIT_STATUS_DESCRIPTION.signersExpired,
      },
    });
  }

  if (!bitcoinConfirmed) {
    return buildSteps(DEPOSIT_STEPS, {
      lock: { state: "complete" },
      "bitcoin-confirmation": {
        state: "active",
        link: bitcoinLink,
        timing: getUnconfirmedDepositTiming({
          bitcoinTransactionFeeRate,
          mempoolProjectedBlocks,
        }),
      },
    });
  }

  if (!hasReachedBitcoinConfirmationTarget) {
    return buildSteps(DEPOSIT_STEPS, {
      lock: { state: "complete" },
      "bitcoin-confirmation": {
        state: "active",
        description: DEPOSIT_STATUS_DESCRIPTION.moreBitcoinConfirmations,
        link: bitcoinLink,
        timing: getDepositConfirmationTiming({
          currentBitcoinTipHeight,
          bitcoinConfirmationBlockHeight,
          bitcoinConfirmationBlockTime,
        }),
      },
    });
  }

  return buildSteps(DEPOSIT_STEPS, {
    lock: { state: "complete" },
    "bitcoin-confirmation": { state: "complete", link: bitcoinLink },
    signers: {
      state: "active",
      ...(isRegistrationPending && {
        description: DEPOSIT_STATUS_DESCRIPTION.registrationPending,
      }),
      timing: buildEstimate(ETA_TEXT.depositSigners),
    },
  });
}

export function getWithdrawalPreviewSteps(): BridgeProgressStep[] {
  return buildSteps(WITHDRAWAL_STEPS, {
    initiate: {
      state: "active",
      description: WITHDRAWAL_STATUS_DESCRIPTION.previewInitiate,
    },
  });
}

export function buildWithdrawalProgressSteps({
  status,
  stacksTxId,
  bitcoinTxId,
  mempoolUrl,
  stacksExplorerUrl,
}: BuildWithdrawalProgressStepsArgs): BridgeProgressStep[] {
  const stacksLink = createStacksLink(stacksExplorerUrl, stacksTxId);
  const bitcoinLink = createBitcoinLink(mempoolUrl, bitcoinTxId);

  if (status === "confirmed") {
    return buildSteps(WITHDRAWAL_STEPS, {
      initiate: { state: "complete" },
      "stacks-confirmation": { state: "complete", link: stacksLink },
      signers: { state: "complete" },
      "bitcoin-payout": { state: "complete" },
      complete: { state: "complete", link: bitcoinLink },
    });
  }

  if (status === "accepted") {
    return buildSteps(WITHDRAWAL_STEPS, {
      initiate: { state: "complete" },
      "stacks-confirmation": { state: "complete", link: stacksLink },
      signers: {
        state: "active",
        description: WITHDRAWAL_STATUS_DESCRIPTION.signersActive,
        timing: buildEstimate(ETA_TEXT.withdrawalSigners),
      },
    });
  }

  if (status === "failed") {
    return buildSteps(WITHDRAWAL_STEPS, {
      initiate: { state: "complete" },
      "stacks-confirmation": { state: "complete", link: stacksLink },
      signers: {
        state: "failed",
        description: WITHDRAWAL_STATUS_DESCRIPTION.failed,
      },
    });
  }

  return buildSteps(WITHDRAWAL_STEPS, {
    initiate: { state: "complete" },
    "stacks-confirmation": {
      state: "active",
      link: stacksLink,
      timing: buildEstimate(ETA_TEXT.withdrawalStacks),
    },
  });
}
