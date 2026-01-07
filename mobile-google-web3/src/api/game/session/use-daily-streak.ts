import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { client } from "../../common";
import type { DailyStreakData, DailyStreakResponse } from "./types";

type Response = DailyStreakData;
type Variables = void;

export const useDailyStreak = createQuery<Response, Variables, AxiosError>({
  queryKey: ["daily-streak"],
  fetcher: () => {
    return client
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
