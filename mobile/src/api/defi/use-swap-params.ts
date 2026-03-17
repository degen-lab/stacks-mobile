import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { gameClient } from "../common";
import type { ApiEnvelope, SwapQuoteData } from "./types";

type Variables = {
  tokenInId: string;
  tokenOutId: string;
  amount: string;
  senderAddress: string;
};

export const useSwapParams = createQuery<SwapQuoteData, Variables, AxiosError>({
  queryKey: ["swap-params"],
  fetcher: async (variables) => {
    const response = await gameClient.get<ApiEnvelope<SwapQuoteData>>(
      "defi/swap-params",
      {
        params: variables,
      },
    );

    return response.data.data;
  },
});
