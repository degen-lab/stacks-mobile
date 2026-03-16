import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { gameClient } from "../../common";
import type {
  CreateSponsoredTransactionRequest,
  CreateSponsoredTransactionResponse,
} from "./types";

type Variables = CreateSponsoredTransactionRequest;
type Response = CreateSponsoredTransactionResponse;

export const useCreateSponsoredTransactionMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    gameClient({
      url: "transaction/sponsored-request",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
});
