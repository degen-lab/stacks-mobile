import { createQuery } from "react-query-kit";
import { Env } from "@/lib/env";
import {
  TransakQuoteError,
  type TransakQuoteResponse,
  type TransakQuoteVariables,
  type TransakQuoteErrorKind,
} from "./types";
import { parseTransakError } from "./utils";

export { TransakQuoteError };
export type { TransakQuoteErrorKind };

const TRANSAK_API_URL =
  "https://api-stg.transak.com/api/v1/pricing/public/quotes";
const DEFAULT_FIAT = "USD";
const DEFAULT_PAYMENT = "credit_debit_card";
const DEFAULT_COUNTRY = "US";

export const useTransakQuote = createQuery<
  TransakQuoteResponse,
  TransakQuoteVariables
>({
  queryKey: ["transak-quote"],
  fetcher: async ({
    fiatAmount,
    cryptoAmount,
    cryptoCurrency,
    isBuyOrSell = "BUY",
    fiatCurrency = DEFAULT_FIAT,
    paymentMethod = DEFAULT_PAYMENT,
    countryCode,
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
      partnerApiKey: Env.TRANSAK_STAGING_API_KEY,
      network: "mainnet",
      quoteCountryCode: countryCode || DEFAULT_COUNTRY,
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
