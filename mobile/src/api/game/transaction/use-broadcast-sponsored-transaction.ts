import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { gameClient, queryClient } from "../../common";
import type {
  BroadcastSponsoredTransactionRequest,
  BroadcastSponsoredTransactionResponse,
} from "./types";

type Variables = BroadcastSponsoredTransactionRequest;
type Response = BroadcastSponsoredTransactionResponse;

export const useBroadcastSponsoredTransactionMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    gameClient({
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
