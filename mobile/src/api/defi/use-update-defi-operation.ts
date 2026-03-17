import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { gameClient } from "../common";
import type {
  UpdateDefiOperationRequest,
  UpdateDefiOperationResponse,
} from "./types";

type Variables = UpdateDefiOperationRequest;
type Response = UpdateDefiOperationResponse;

export const useUpdateDefiOperation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async ({ id, txId }) =>
    gameClient
      .patch<UpdateDefiOperationResponse>(`defi/update-defi-operation/${id}`, {
        txId,
      })
      .then((response) => response.data),
});
