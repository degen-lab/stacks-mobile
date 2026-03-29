import type { AxiosError } from "axios";
import type { Middleware, QueryHook } from "react-query-kit";
import { createQuery } from "react-query-kit";

import { gameClient } from "../common";
import { useAuth } from "@/lib/store/auth";
import type { UserProfile, UserProfileApiResponse } from "./types";

type Response = UserProfile;
type Variables = void;

const requireBackendSession: Middleware<
  QueryHook<Response, Variables, AxiosError>
> = (useQueryNext) => {
  return (options, queryClient) => {
    const { backendToken } = useAuth();
    const enabled = Boolean(backendToken) && options.enabled !== false;
    return useQueryNext({ ...options, enabled }, queryClient);
  };
};

export const useUserProfile = createQuery<Response, Variables, AxiosError>({
  queryKey: ["user-profile"],
  use: [requireBackendSession],
  fetcher: () => {
    return gameClient
      .get<UserProfileApiResponse | { data: UserProfile }>(`user/profile`)
      .then(
        (response) =>
          ((response.data as UserProfileApiResponse)?.data ??
            response.data) as UserProfile,
      );
  },
});
