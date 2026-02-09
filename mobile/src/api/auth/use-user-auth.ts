import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { gameClient } from "../common";
import type { AuthRequest, AuthResponse } from "./types";

type Variables = AuthRequest;
type Response = AuthResponse;

export const useAuthMutation = createMutation<Response, Variables, AxiosError>({
  mutationFn: async (variables) =>
    gameClient({
      url: "user/auth",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
});
