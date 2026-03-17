import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { gameClient } from "../common";
import type { ApiEnvelope, SwapPossiblePairs } from "./types";

type Variables = {
  tokenId: string;
};

type Response = SwapPossiblePairs;

export const useSwapPossiblePairs = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["swap-possible-pairs"],
  fetcher: async ({ tokenId }) => {
    const response = await gameClient.get<ApiEnvelope<SwapPossiblePairs>>(
      "defi/possible-pair-list",
      {
        params: {
          tokenId,
        },
      },
    );

    return response.data.data;
  },
});
