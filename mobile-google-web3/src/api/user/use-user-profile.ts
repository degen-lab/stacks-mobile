import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { client } from "../common";
import type { UserProfile, UserProfileApiResponse } from "./types";

type Response = UserProfile;
type Variables = void;

export const useUserProfile = createQuery<Response, Variables, AxiosError>({
  queryKey: ["user-profile"],
  fetcher: () => {
    return client
      .get<UserProfileApiResponse | { data: UserProfile }>(`user/profile`)
      .then(
        (response) =>
          ((response.data as UserProfileApiResponse)?.data ??
            response.data) as UserProfile,
      );
  },
});
