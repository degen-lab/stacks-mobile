import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { gameClient } from "../../common";
import type { GenerateSeedResponse } from "./types";

type Variables = void;
type Response = GenerateSeedResponse;

export const useGenerateSeedMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    gameClient({
      url: "session/generate-seed",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
});
