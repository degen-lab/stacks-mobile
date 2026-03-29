export const STX_TOKEN_ID = "token-stx";
export const SBTC_TOKEN_ID = "token-sbtc";

export type AppToken = "STX" | "BTC" | "sBTC";

export function baseUnitsToDisplayString(
  value: string | number | bigint | null | undefined,
  decimals: number,
  maxFractionDigits = Math.min(decimals, 8),
) {
  if (value == null) return "0";
  const str = String(value).trim();
  if (!str) return "0";

  const n = BigInt(str);
  const sign = n < 0n ? "-" : "";
  const abs = n < 0n ? -n : n;
  const divisor = 10n ** BigInt(decimals);
  const integer = (abs / divisor).toString();
  const fraction = (abs % divisor)
    .toString()
    .padStart(decimals, "0")
    .slice(0, maxFractionDigits)
    .replace(/0+$/, "");

  return fraction ? `${sign}${integer}.${fraction}` : `${sign}${integer}`;
}

export function compareBaseUnitAmounts(left: string, right: string) {
  const leftValue = BigInt(left || "0");
  const rightValue = BigInt(right || "0");

  if (leftValue === rightValue) return 0;
  return leftValue > rightValue ? 1 : -1;
}
