import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import type { LeaderboardData, TournamentLeaderboardResponse } from "./types";
import { gameClient } from "@/api/common";

type Response = LeaderboardData;
type Variables = void;

export const useTournamentLeaderboard = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["tournament-leaderboard"],
  fetcher: async () => {
    const response = await gameClient.get<TournamentLeaderboardResponse>(
      "tournament/leaderboard",
    );
    return response.data.data;
  },
});
