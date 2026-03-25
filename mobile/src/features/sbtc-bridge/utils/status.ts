import { hexToCV } from "@stacks/transactions";

import type { HiroTransaction } from "@/api/sbtc-bridge";

export const BRIDGE_STATUSES = [
  "pending",
  "accepted",
  "confirmed",
  "failed",
] as const;

export type BridgeStatus = (typeof BRIDGE_STATUSES)[number];

export type EmilyDepositStatus = Exclude<BridgeStatus, "failed">;

export type BridgeDisplayStatus =
  | BridgeStatus
  | "expired"
  | "registration pending"
  | "reclaimed";

export type BridgeChipTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

const BRIDGE_STATUS_SET = new Set<string>(BRIDGE_STATUSES);

const BRIDGE_STATUS_TONES: Record<BridgeDisplayStatus, BridgeChipTone> = {
  pending: "warning",
  accepted: "warning",
  confirmed: "success",
  failed: "danger",
  expired: "danger",
  "registration pending": "warning",
  reclaimed: "info",
};

export function isBridgeStatus(value: string): value is BridgeStatus {
  return BRIDGE_STATUS_SET.has(value);
}

export function parseBridgeStatus(
  status: string | null | undefined,
  fallback: BridgeStatus = "pending",
): BridgeStatus {
  const normalized = status?.trim().toLowerCase();
  if (!normalized) return fallback;
  return isBridgeStatus(normalized) ? normalized : fallback;
}

export function getBridgeStatusChipTone(
  status: BridgeDisplayStatus,
): BridgeChipTone {
  return BRIDGE_STATUS_TONES[status];
}

export function formatBridgeStatusLabel(status: BridgeDisplayStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export const calculateDepositUnlockBlock = (
  confirmationHeight: number,
  lockTime: number,
) => lockTime + confirmationHeight - 1;

export const deriveDepositStatus = ({
  emilyStatus,
  bitcoinConfirmed,
  currentBlockHeight,
  confirmationHeight,
  lockTime,
}: {
  emilyStatus: EmilyDepositStatus;
  bitcoinConfirmed: boolean;
  currentBlockHeight?: number;
  confirmationHeight?: number;
  lockTime: number;
}): BridgeStatus => {
  if (!bitcoinConfirmed) return "pending";
  if (emilyStatus === "confirmed") return "confirmed";
  if (emilyStatus === "accepted") return "accepted";
  if (
    currentBlockHeight != null &&
    confirmationHeight != null &&
    currentBlockHeight >=
      calculateDepositUnlockBlock(confirmationHeight, lockTime)
  ) {
    return "failed";
  }
  return "pending";
};

export const estimateWithdrawalMaxFee = ({
  fastestFee,
  multiplier,
  txSize,
}: {
  fastestFee: number;
  multiplier: number;
  txSize: number;
}) => Math.ceil(fastestFee * multiplier * txSize);

export function extractRequestIdFromTransaction(tx: HiroTransaction) {
  const requestLogEvent = tx.events?.find((event) => {
    if (event.event_type !== "smart_contract_log") return false;
    const hex = event.contract_log?.value.hex;
    if (!hex) return false;
    try {
      const clarityValue = hexToCV(hex);
      return (
        "value" in clarityValue && "request-id" in (clarityValue as any).value
      );
    } catch {
      return false;
    }
  });

  if (!requestLogEvent?.contract_log?.value.hex) {
    return null;
  }

  const clarityValue = hexToCV(requestLogEvent.contract_log.value.hex) as any;
  const requestId = clarityValue?.value?.["request-id"]?.value;
  if (requestId == null) return null;
  return String(requestId);
}

export const getWithdrawalStatusFromRegistryValue = (
  status: boolean | null,
): BridgeStatus => {
  if (status == null) return "pending" as const;
  return status ? ("confirmed" as const) : ("failed" as const);
};
