import type { BitcoinFeeRecommendation } from "./types";

export type FeeRateTier = "economy" | "standard" | "fast";

export function pickFeeRate(
  rec: BitcoinFeeRecommendation,
  tier: FeeRateTier,
): number {
  if (tier === "economy") return rec.economyFee;
  if (tier === "fast") return rec.fastestFee;
  return rec.halfHourFee;
}
