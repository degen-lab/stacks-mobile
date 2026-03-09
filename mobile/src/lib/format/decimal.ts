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
