import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { client } from "../common";
import type {
  CurrentTournamentSubmissions,
  CurrentTournamentSubmissionsResponse,
} from "../tournament/types";

type Response = CurrentTournamentSubmissions;
type Variables = void;

export const useCurrentTournamentSubmissions = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["current-tournament-submissions"],
  fetcher: async () => {
    const response = await client.get<CurrentTournamentSubmissionsResponse>(
      "user/current-tournament-submissions",
    );
    return response.data.data;
  },
});
