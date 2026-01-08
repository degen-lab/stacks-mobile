import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { client } from "../common";
import type { AuthRequest, AuthResponse } from "./types";

type Variables = AuthRequest;
type Response = AuthResponse;

export const useAuthMutation = createMutation<Response, Variables, AxiosError>({
  mutationFn: async (variables) =>
    client({
      url: "user/auth",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
});
