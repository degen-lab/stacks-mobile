import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { gameClient } from "../../common";
import type {
  CreateGameSubmissionTransactionRequest,
  CreateGameSubmissionTransactionResponse,
} from "./types";

type Variables = CreateGameSubmissionTransactionRequest;
type Response = CreateGameSubmissionTransactionResponse;

export const useCreateGameSubmissionTransactionMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    gameClient({
      url: "transaction/game-submission",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
});
