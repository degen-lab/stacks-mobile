import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { dualStackingClient } from "../../common/backend-client";
import type { CheckTermsResponse } from "./types";

type Response = boolean;
type Variables = { address: string };

export const useCheckTerms = createQuery<Response, Variables, AxiosError>({
  queryKey: ["check-terms"],
  fetcher: async (variables) => {
    const { data } = await dualStackingClient.get<CheckTermsResponse>(
      "/check-terms",
      {
        params: { address: variables.address },
      },
    );
    return data.exists ?? false;
  },
});
