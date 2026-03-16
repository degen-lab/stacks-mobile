import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { gameClient } from "../common";
import type { UserStackingDataResponse, UserStackingDataRow } from "./types";
import { normalizeStackingStatus } from "./status";

type Variables = { userId: number };
type Response = UserStackingDataRow[];

export const useUserStackingData = createQuery<Response, Variables, AxiosError>(
  {
    queryKey: ["stacking-user-data"],
    fetcher: async (variables) => {
      const response = await gameClient.get<UserStackingDataResponse>(
        `stacking/user/${variables.userId}`,
      );

      const rows =
        response.data.data ??
        (response.data as { data: UserStackingDataRow[] })?.data ??
        [] ??
        [];

      return rows.map((row) => ({
        ...row,
        txStatus: normalizeStackingStatus(row.txStatus),
      }));
    },
  },
);
