import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import type { TournamentData, TournamentDataResponse } from "./types";
import { gameClient } from "@/api/common";

type Response = TournamentData;
type Variables = void;

export const useTournamentData = createQuery<Response, Variables, AxiosError>({
  queryKey: ["tournament-data"],
  fetcher: async () => {
    const response = await gameClient.get<TournamentDataResponse>(
      "tournament/tournament-data",
    );
    return response.data.data;
  },
});
