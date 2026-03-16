import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { dualStackingClient } from "../../common/backend-client";
import type { LastCycleAprsResponse } from "./types";

type Response = LastCycleAprsResponse;
type Variables = void;

export const useLastCycleAprs = createQuery<Response, Variables, AxiosError>({
  queryKey: ["last-cycle-aprs"],
  fetcher: async () => {
    const { data } =
      await dualStackingClient.get<LastCycleAprsResponse>("/last-cycle-aprs");
    return data;
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false,
});
