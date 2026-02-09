import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import type { DualStackingStatsResponse } from "./types";
import { dualStackingClient } from "../common";
import { isMainnet } from "@/lib/stacks/network";

type Response = DualStackingStatsResponse;
type Variables = { address: string };

export const useDualStackingStats = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["dual-stacking-stats"],
  fetcher: async (variables) => {
    const { data } = await dualStackingClient.get<DualStackingStatsResponse>(
      "/dual-stacking-stats",
      {
        params: {
          address: variables.address,
          network: isMainnet() ? "mainnet" : "testnet",
        },
      },
    );
    return data;
  },
});
