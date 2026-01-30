import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { gameClient } from "../common";
import type {
  CurrentTournamentSubmissions,
  CurrentTournamentSubmissionsResponse,
} from "../game/tournament/types";

type Response = CurrentTournamentSubmissions;
type Variables = void;

export const useCurrentTournamentSubmissions = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["current-tournament-submissions"],
  fetcher: async () => {
    const response = await gameClient.get<CurrentTournamentSubmissionsResponse>(
      "user/current-tournament-submissions",
    );
    return response.data.data;
  },
});
