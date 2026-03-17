import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { gameClient } from "../common";
import type { ApiEnvelope, SwapParamsData, SwapParamsResponse } from "./types";

type Variables = {
  tokenInId: string;
  tokenOutId: string;
  amount: string;
  senderAddress: string;
};

export const usePrepareSwap = createMutation<
  SwapParamsData,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) => {
    const response = await gameClient.post<ApiEnvelope<SwapParamsResponse>>(
      "defi/swap-params",
      variables,
    );
    const { defiOperation, contractCallParams } = response.data.data;
    return { operation: defiOperation, contractCallParams };
  },
});
