import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { client } from "../common";
import type { TournamentData, TournamentDataResponse } from "./types";

type Response = TournamentData;
type Variables = void;

export const useTournamentData = createQuery<Response, Variables, AxiosError>({
  queryKey: ["tournament-data"],
  fetcher: async () => {
    const response = await client.get<TournamentDataResponse>(
      "tournament/tournament-data",
    );
    return response.data.data;
  },
});
