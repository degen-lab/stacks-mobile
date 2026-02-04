import { createQuery } from "react-query-kit";

export type TransakFeeBreakdown = {
  name: string;
  value: number;
  id: string;
  ids: string[];
};

export type TransakQuoteResponse = {
  conversionPrice: number;
  marketConversionPrice: number;
  slippage: number;
  fiatCurrency: string;
  cryptoCurrency: string;
  paymentMethod: string;
  fiatAmount: number;
  cryptoAmount: number;
  isBuyOrSell: string;
  network: string;
  feeDecimal: number;
  totalFee: number;
  feeBreakdown: TransakFeeBreakdown[];
  nonce: number;
};

export type TransakQuoteErrorKind = "min" | "max" | "feature" | "unknown";

export class TransakQuoteError extends Error {
  kind: TransakQuoteErrorKind;
  minAmount?: number;
  maxAmount?: number;
  unit?: string;

  constructor(
    message: string,
    kind: TransakQuoteErrorKind,
    details?: { minAmount?: number; maxAmount?: number; unit?: string },
  ) {
    super(message);
    this.name = "TransakQuoteError";
    this.kind = kind;
    this.minAmount = details?.minAmount;
    this.maxAmount = details?.maxAmount;
    this.unit = details?.unit;
  }
}

type Variables = {
  fiatAmount?: number;
  cryptoAmount?: number;
  cryptoCurrency: string;
  fiatCurrency?: string;
  paymentMethod?: string;
  isBuyOrSell?: "BUY" | "SELL";
};

const TRANSAK_API_URL =
  "https://api-stg.transak.com/api/v1/pricing/public/quotes";
const DEFAULT_FIAT = "USD";
const DEFAULT_PAYMENT = "credit_debit_card";
const STAGING_API_KEY = "f29b1664-87eb-46f5-8c23-90c45e721608"; // Public Staging Key

const extractUnit = (message: string): string | undefined => {
  const matches = message.match(/\b[A-Z]{2,6}\b/g);
  return matches ? matches[matches.length - 1] : undefined;
};

const parseTransakError = (message: string) => {
  if (message.includes("feature is not enabled")) {
    return { kind: "feature" as const };
  }

  // Network fee exceeds amount (essentially a minimum amount error)
  if (message.includes("network fee is more than the source amount")) {
    return {
      kind: "min" as const,
      minAmount: undefined, // Transak doesn't provide exact minimum in this error
      unit: extractUnit(message),
    };
  }

  const minMatch = message.match(
    /minimum .*?(?:more than or equal to|>=)\s*([0-9]*\.?[0-9]+)/i,
  );
  if (minMatch) {
    return {
      kind: "min" as const,
      minAmount: Number(minMatch[1]),
      unit: extractUnit(message),
    };
  }

  const maxMatch = message.match(
    /less than (?:or equal to )?([0-9]*\.?[0-9]+)/i,
  );
  if (maxMatch) {
    return {
      kind: "max" as const,
      maxAmount: Number(maxMatch[1]),
      unit: extractUnit(message),
    };
  }

  return { kind: "unknown" as const };
};

export const useTransakQuote = createQuery<TransakQuoteResponse, Variables>({
  queryKey: ["transak-quote"],
  fetcher: async ({
    fiatAmount,
    cryptoAmount,
    cryptoCurrency,
    isBuyOrSell = "BUY",
    fiatCurrency = DEFAULT_FIAT,
    paymentMethod = DEFAULT_PAYMENT,
  }) => {
    if (
      (!fiatAmount || fiatAmount <= 0) &&
      (!cryptoAmount || cryptoAmount <= 0)
    ) {
      throw new Error("Amount must be greater than 0");
    }

    const params = new URLSearchParams({
      fiatCurrency,
      cryptoCurrency,
      paymentMethod,
      isBuyOrSell,
      partnerApiKey: STAGING_API_KEY,
      network: "mainnet",
      quoteCountryCode: "RO",
    });

    if (cryptoAmount) {
      params.append("cryptoAmount", cryptoAmount.toString());
    } else if (fiatAmount) {
      params.append("fiatAmount", fiatAmount.toString());
    }

    const url = `${TRANSAK_API_URL}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      const message = (() => {
        try {
          return JSON.parse(errorBody).error?.message || errorBody;
        } catch {
          return errorBody;
        }
      })();

      const parsed = parseTransakError(message);

      if (parsed.kind === "unknown") {
        console.error("Transak Query Failed:", {
          status: response.status,
          url,
          errorBody,
        });
      }

      throw new TransakQuoteError(message, parsed.kind, {
        minAmount: parsed.minAmount,
        maxAmount: parsed.maxAmount,
        unit: parsed.unit,
      });
    }

    const data = await response.json();
    return data.response as TransakQuoteResponse;
  },
});
