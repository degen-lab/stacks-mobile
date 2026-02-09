import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { dualStackingClient } from "../common/backend-client";
import type { LeaderboardResponse } from "./types";

type Response = LeaderboardResponse;
type Variables = { cycleId: number };

export const useDualStackingLeaderboard = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["dual-stacking-leaderboard"],
  fetcher: async (variables) => {
    const { data } = await dualStackingClient.get<LeaderboardResponse>(
      "/dual-stacking-leaderboard",
      {
        params: { cycle_id: variables.cycleId },
      },
    );
    return data;
  },
});
