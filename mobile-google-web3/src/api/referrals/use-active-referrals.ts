import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { client } from "../common";
import type {
  ActiveReferralsData,
  ActiveReferralsResponse,
  ActiveReferralsSuccessResponse,
} from "./types";

type Response = ActiveReferralsData;
type Variables = void;

export const useActiveReferrals = createQuery<Response, Variables, AxiosError>({
  queryKey: ["active-referrals"],
  fetcher: () => {
    return client
      .get<
        ActiveReferralsResponse | { data: ActiveReferralsData }
      >(`user/active-referrals`)
      .then(
        (response) =>
          ((response.data as ActiveReferralsSuccessResponse)?.data ??
            response.data) as ActiveReferralsData,
      );
  },
});
