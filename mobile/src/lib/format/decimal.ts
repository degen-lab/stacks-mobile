const DEFAULT_MAX_DECIMALS = 8;

const TRAILING_ZEROES = /(\.\d*?[1-9])0+$|\\.0+$/;

export function sanitizeDecimal(
  input: string,
  maxDecimals = DEFAULT_MAX_DECIMALS,
) {
  if (!input) return "";

  const normalized = input.replace(/,/g, "").replace(/[^\d.]/g, "");
  const [integerPart = "", ...fractionParts] = normalized.split(".");
  const fractionPart = fractionParts.join("").slice(0, maxDecimals);
  const trimmedInteger = integerPart.replace(/^0+(?=\d)/, "");

  if (normalized.startsWith(".")) {
    return fractionPart.length > 0 ? `0.${fractionPart}` : "0.";
  }

  if (normalized.includes(".")) {
    return `${trimmedInteger || "0"}.${fractionPart}`;
  }

  return trimmedInteger;
}

export function formatDecimal(
  value: number,
  maxDecimals = DEFAULT_MAX_DECIMALS,
) {
  if (!Number.isFinite(value)) return "0";

  return value.toFixed(maxDecimals).replace(TRAILING_ZEROES, "$1");
}

/**
 *   950 -> "950"
 *   1200 -> "1.2k"
 *   50000 -> "50k"
 *   1250000 -> "1.25M"
 *   0.234 -> "0.23"
 */
export function formatCompactNumber(value?: number | null): string {
  if (value == null || isNaN(value)) return "0";

  // If below 1, return with 2 fixed decimals
  if (Math.abs(value) < 1) {
    return value.toFixed(4);
  }

  const abs = Math.abs(value);
  let formatted: string;

  if (abs >= 1_000_000_000) {
    formatted = (value / 1_000_000_000).toFixed(2).replace(/\.0+$/, "") + "B";
  } else if (abs >= 1_000_000) {
    formatted = (value / 1_000_000).toFixed(2).replace(/\.0+$/, "") + "M";
  } else if (abs >= 1_000) {
    formatted = (value / 1_000).toFixed(1).replace(/\.0+$/, "") + "k";
  } else {
    formatted = value.toString();
  }

  return formatted;
}
