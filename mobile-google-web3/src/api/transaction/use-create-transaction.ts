import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { client } from "../common";
import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
} from "./types";

type Variables = CreateTransactionRequest;
type Response = CreateTransactionResponse;

export const useCreateTransactionMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: "transaction/create",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
});
