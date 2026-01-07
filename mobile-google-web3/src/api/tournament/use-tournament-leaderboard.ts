import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { client } from "../common";
import type { LeaderboardData, TournamentLeaderboardResponse } from "./types";

type Response = LeaderboardData;
type Variables = void;

export const useTournamentLeaderboard = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["tournament-leaderboard"],
  fetcher: async () => {
    const response = await client.get<TournamentLeaderboardResponse>(
      "tournament/leaderboard",
    );
    return response.data.data;
  },
});
