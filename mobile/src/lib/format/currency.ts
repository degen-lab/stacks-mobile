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

export const fromSatsToBTC = (sats: number) => sats / SATS_PER_BTC;

export default formatCurrency;
