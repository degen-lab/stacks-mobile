import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { dualStackingClient } from "../common/backend-client";
import type { DualStackingDataResponse } from "./types";

type Response = DualStackingDataResponse;
type Variables = void;

export const useDualStackingData = createQuery<Response, Variables, AxiosError>(
  {
    queryKey: ["dual-stacking-data"],
    fetcher: async () => {
      const { data } = await dualStackingClient.get<DualStackingDataResponse>(
        "/dual-stacking-data",
      );
      return data;
    },
  },
);
