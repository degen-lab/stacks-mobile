const STACKING_STATUS_MAP: Record<string, string> = {
  "0": "pending",
  "1": "success",
  "2": "failed",
  "3": "notBroadcasted",
  "4": "processing",
};

export function normalizeStackingStatus(
  status: string | number | null | undefined,
): string {
  if (status === null || status === undefined) return "failed";

  const raw = String(status).trim();
  if (!raw) return "failed";

  return STACKING_STATUS_MAP[raw] ?? raw;
}
