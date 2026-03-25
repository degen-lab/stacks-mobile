export const USTX_DECIMALS = 6;
export const SATS_DECIMALS = 8;
export const MICRO_STX = Math.pow(10, USTX_DECIMALS);
export const SATS_PER_BTC = Math.pow(10, SATS_DECIMALS);

const formatCurrency = (amount: number) => {
  const formatted = amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  const decimalIndex = formatted.indexOf(".");
  if (decimalIndex === -1) return { dollars: formatted, cents: ".00" };

  const dollars = formatted.substring(0, decimalIndex);
  const cents = formatted.substring(decimalIndex);

  return { dollars, cents };
};

export const formatMicroStx = (amountInMicroStx: number) => {
  return (amountInMicroStx / MICRO_STX).toLocaleString("en-US", {
    maximumFractionDigits: USTX_DECIMALS,
  });
};

export const toSats = (amountBtc: number) =>
  Math.round(amountBtc * SATS_PER_BTC);

export const fromSatsToBtc = (v: number | string | bigint | null | undefined) =>
  Number(v ?? 0) / SATS_PER_BTC;
export const fromBtcToSats = (v: number | string | bigint | null | undefined) =>
  Math.round(Number(v ?? 0) * SATS_PER_BTC);
export const fromStxToUstx = (v: string | number | null | undefined) =>
  Number(v ?? 0) * MICRO_STX;
export const fromUstxToStx = (v: string | number | null | undefined) =>
  Number(v ?? 0) / MICRO_STX;

/**
 * Format a BTC value for display, up to SATS_DECIMALS decimal places, no trailing zeros.
 * e.g. 0.001 -> "0.001", 1.5 -> "1.5"
 */
export function formatBtcAmount(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: SATS_DECIMALS,
  });
}

/**
 * Format a BTC value as a fixed-SATS_DECIMALS string with trailing zeros stripped.
 * Suitable for populating input fields.
 * e.g. 0.001 -> "0.001", 1.0 -> "1"
 */
export function formatBtcInput(value: number) {
  return value
    .toFixed(SATS_DECIMALS)
    .replace(/\.?0+$/, "")
    .replace(/^$/, "0");
}

/**
 * Format a BTC metric for overview display, up to 2 decimal places.
 * e.g. 1234.5678 -> "1,234.57"
 */
export function formatBtcMetric(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

type FormatUsdOptions = {
  /** Use compact notation (e.g. "$1.2K") when |value| >= 1000. Default false. */
  compact?: boolean;
  maximumFractionDigits?: number;
};

/**
 * Format a USD value for display.
 * Returns "—" for null / non-finite values.
 * e.g. 1234.5 -> "$1,234.50", 1_200_000 with compact -> "$1.2M"
 */
export function formatUsd(
  value: number | null,
  { compact = false, maximumFractionDigits = 2 }: FormatUsdOptions = {},
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  if (compact && Math.abs(value) >= 1_000) {
    const sign = value < 0 ? "-" : "";
    const compactValue = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(Math.abs(value));
    return `${sign}$${compactValue}`;
  }

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

/**
 * Format a USD value in compact notation.
 * e.g. 1_200_000 -> "$1.2M"
 */
export function formatUsdCompact(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "...";
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default formatCurrency;
