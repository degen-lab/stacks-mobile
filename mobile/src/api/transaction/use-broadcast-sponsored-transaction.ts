import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { client, queryClient } from "../common";
import type {
  BroadcastTransactionRequest,
  BroadcastTransactionResponse,
} from "./types";

type Variables = BroadcastTransactionRequest;
type Response = BroadcastTransactionResponse;

export const useBroadcastSponsoredTransactionMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: "transaction/broadcast-sponsored",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tournament-leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["sponsored-submissions-left"] });
    queryClient.invalidateQueries({
      queryKey: ["current-tournament-submissions"],
    });
  },
});
