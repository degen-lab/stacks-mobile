import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { gameClient } from "../../common";
import type { DailyStreakData, DailyStreakResponse } from "./types";

type Response = DailyStreakData;
type Variables = void;

export const useDailyStreak = createQuery<Response, Variables, AxiosError>({
  queryKey: ["daily-streak"],
  fetcher: async () => {
    return gameClient
      .get<
        DailyStreakResponse | { data: DailyStreakData }
      >("session/daily-streak")
      .then(
        (response) =>
          ((response.data as DailyStreakResponse)?.data ??
            response.data) as DailyStreakData,
      );
  },
});
