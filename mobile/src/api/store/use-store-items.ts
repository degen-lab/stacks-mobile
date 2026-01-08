import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { client } from "../common";
import type { StoreItem, StoreItemsResponse } from "./types";

type Response = StoreItem[];
type Variables = void;

export const useStoreItems = createQuery<Response, Variables, AxiosError>({
  queryKey: ["store-items"],
  fetcher: async () => {
    const response = await client.get<StoreItemsResponse>(
      "store/available-items",
    );
    return response.data.data.items;
  },
});
