import { stripHexPrefix } from "@/features/sbtc-bridge/utils/bytes";

export function normalizeAggregateKey(value: string) {
  const normalized = stripHexPrefix(value);

  if (normalized.length < 64) {
    throw new Error("Deposits are temporarily unavailable");
  }

  if (normalized.length === 64) {
    return normalized;
  }

  if (
    normalized.length === 66 &&
    (normalized.startsWith("02") || normalized.startsWith("03"))
  ) {
    return normalized.slice(2);
  }

  throw new Error("Deposits are temporarily unavailable");
}
