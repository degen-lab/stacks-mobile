import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { dualStackingClient } from "../../common/backend-client";
import type { EnrolledUsersWithBalancesResponse } from "./types";

type Response = EnrolledUsersWithBalancesResponse;
type Variables = void;

export const useEnrolledUsers = createQuery<Response, Variables, AxiosError>({
  queryKey: ["enrolled-users-with-balances"],
  fetcher: async () => {
    const { data } =
      await dualStackingClient.get<EnrolledUsersWithBalancesResponse>(
        "/enrolled-with-balances",
      );
    return data;
  },
});
