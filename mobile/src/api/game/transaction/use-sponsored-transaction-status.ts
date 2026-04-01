import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { gameClient } from "../../common";
import type {
  GetSponsoredTransactionStatusRequest,
  GetSponsoredTransactionStatusResponse,
} from "./types";

type Variables = GetSponsoredTransactionStatusRequest;
type Response = GetSponsoredTransactionStatusResponse;

export const useSponsoredTransactionStatus = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["sponsored-transaction-status"],
  fetcher: ({ requestId }) =>
    gameClient
      .get(`transaction/sponsored-request/${requestId}`)
      .then((response) => response.data),
});
