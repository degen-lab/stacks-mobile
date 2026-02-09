import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { gameClient } from "../../common";
import type { StoreItem, StoreItemsResponse } from "./types";

type Response = StoreItem[];
type Variables = void;

export const useStoreItems = createQuery<Response, Variables, AxiosError>({
  queryKey: ["store-items"],
  fetcher: async () => {
    const response = await gameClient.get<StoreItemsResponse>(
      "store/available-items",
    );
    return response.data.data.items;
  },
});
