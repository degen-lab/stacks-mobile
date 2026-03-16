import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { gameClient, queryClient } from "../../common";
import type {
  BroadcastTransactionRequest,
  BroadcastTransactionResponse,
} from "./types";

type Variables = BroadcastTransactionRequest;
type Response = BroadcastTransactionResponse;

export const useBroadcastTransactionMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    gameClient({
      url: "transaction/broadcast",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tournament-leaderboard"] });
    queryClient.invalidateQueries({
      queryKey: ["current-tournament-submissions"],
    });
  },
});
