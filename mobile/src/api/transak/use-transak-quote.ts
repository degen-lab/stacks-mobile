import { createQuery } from "react-query-kit";
import { gameClient } from "@/api/common/backend-client";
import {
  TransakQuoteError,
  type TransakQuoteResponse,
  type TransakQuoteVariables,
  type TransakQuoteErrorKind,
} from "./types";
import { parseTransakError } from "./utils";

export { TransakQuoteError };
export type { TransakQuoteErrorKind };

const DEFAULT_FIAT = "USD";
const DEFAULT_PAYMENT = "credit_debit_card";
const DEFAULT_COUNTRY = "US";

type TransakQuoteApiResponse = {
  success: boolean;
  message: string;
  data: TransakQuoteResponse;
};

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

    try {
      const response = await gameClient.post<TransakQuoteApiResponse>(
        "/purchase/quote",
        {
          fiatAmount,
          cryptoAmount,
          cryptoCurrency,
          fiatCurrency,
          paymentMethod,
          isBuyOrSell,
          countryCode: countryCode || DEFAULT_COUNTRY,
        },
      );

      return response.data.data;
    } catch (error) {
      const message = (() => {
        const responseData =
          typeof error === "object" && error !== null && "response" in error
            ? (error as { response?: { data?: unknown } }).response?.data
            : undefined;

        if (
          typeof responseData === "object" &&
          responseData !== null &&
          "error" in responseData
        ) {
          const errorData = (responseData as { error?: { message?: string } })
            .error;
          if (errorData?.message) return errorData.message;
        }

        if (
          typeof responseData === "object" &&
          responseData !== null &&
          "message" in responseData
        ) {
          const responseMessage = (responseData as { message?: string })
            .message;
          if (responseMessage) return responseMessage;
        }

        return error instanceof Error ? error.message : "Unable to fetch quote";
      })();

      const parsed = parseTransakError(message);

      if (parsed.kind === "unknown") {
        console.error("Transak Query Failed:", {
          error,
        });
      }

      throw new TransakQuoteError(message, parsed.kind, {
        minAmount: parsed.minAmount,
        maxAmount: parsed.maxAmount,
        unit: parsed.unit,
      });
    }
  },
});
