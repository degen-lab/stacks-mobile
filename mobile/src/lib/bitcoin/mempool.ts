import type { MempoolTransaction, MempoolProjectedBlock } from "./types";

export const BITCOIN_CONFIRMATION_TARGET = 6;
export const BITCOIN_BLOCK_TIME_MS = 10 * 60_000;

export function deriveConfirmationCount(
  currentTipHeight?: number | null,
  confirmationBlockHeight?: number | null,
): number {
  if (confirmationBlockHeight == null) return 0;
  if (currentTipHeight == null) return 1;
  return Math.max(1, currentTipHeight - confirmationBlockHeight + 1);
}

export function getBitcoinTransactionFeeRate(
  tx: Pick<
    MempoolTransaction,
    "fee" | "vsize" | "adjusted_vsize" | "weight"
  > | null,
): number | null {
  if (!tx?.fee) return null;
  const vsize =
    tx.adjusted_vsize ??
    tx.vsize ??
    (tx.weight != null ? Math.ceil(tx.weight / 4) : null);
  if (!vsize || vsize <= 0) return null;
  return tx.fee / vsize;
}

export function estimateBitcoinConfirmationMinutes({
  feeRate,
  mempoolProjectedBlocks,
}: {
  feeRate?: number | null;
  mempoolProjectedBlocks?: MempoolProjectedBlock[] | null;
}): number | null {
  if (!feeRate || !mempoolProjectedBlocks?.length) return null;
  const blockIndex = mempoolProjectedBlocks.findIndex((block) => {
    if (!block.feeRange.length) return false;
    const minFee = Math.min(...block.feeRange);
    return Number.isFinite(minFee) && feeRate >= minFee;
  });
  return blockIndex >= 0
    ? (blockIndex + 1) * 10
    : mempoolProjectedBlocks.length * 10;
}
