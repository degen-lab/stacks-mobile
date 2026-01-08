import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { client } from "../common";
import type { IsNewUserApiResponse, IsNewUserData } from "./types";

type Response = IsNewUserData;
type Variables = { googleId: string };

export const useIsNewUser = createQuery<Response, Variables, AxiosError>({
  queryKey: ["is-new-user"],
  fetcher: async (variables) => {
    const response = await client.get<IsNewUserApiResponse>(
      "user/is-new-user",
      {
        params: variables,
      },
    );
    return response.data.data;
  },
});
