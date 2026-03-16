import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { gameClient } from "../common";
import type { ApiEnvelope, SwapToken } from "./types";

type Response = SwapToken[];
type Variables = void;

export const useSwapTokenList = createQuery<Response, Variables, AxiosError>({
  queryKey: ["swap-token-list"],
  fetcher: async () => {
    const response =
      await gameClient.get<ApiEnvelope<SwapToken[]>>("defi/token-list");
    return response.data.data;
  },
});
