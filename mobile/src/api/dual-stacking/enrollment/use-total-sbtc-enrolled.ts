import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { dualStackingClient } from "../../common/backend-client";
import type { TotalSbtcEnrolledResponse } from "./types";

type Response = TotalSbtcEnrolledResponse;
type Variables = void;

export const useTotalSbtcEnrolled = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["total-sbtc-enrolled"],
  fetcher: async () => {
    const { data } = await dualStackingClient.get<TotalSbtcEnrolledResponse>(
      "/total-sbtc-enrolled",
    );
    return data;
  },
});
