import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { ONE_MINUTE_MS } from "@/api/common/query-constants";
import { coinPricesClient } from "../common/backend-client";
import type { CoinPricesResponse } from "./types";

type Response = CoinPricesResponse;
type Variables = {
  yieldCycleId: number;
  poxCycleId: number;
};

export const useCoinPrices = createQuery<Response, Variables, AxiosError>({
  queryKey: ["coin-prices"],
  fetcher: async (variables) => {
    const { data } = await coinPricesClient.get<CoinPricesResponse>(
      "/coin-prices",
      {
        params: {
          first_yield_cycle_id: variables.yieldCycleId,
          first_pox_cycle_id: variables.poxCycleId,
        },
      },
    );
    return data;
  },
  staleTime: ONE_MINUTE_MS,
  refetchOnWindowFocus: false,
  retry: false,
});
