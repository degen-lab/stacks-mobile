import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { client } from "../../common";
import type { GenerateSeedResponse } from "./types";

type Variables = void;
type Response = GenerateSeedResponse;

export const useGenerateSeedMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: "session/generate-seed",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
});
