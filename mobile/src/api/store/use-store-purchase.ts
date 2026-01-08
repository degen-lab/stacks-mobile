import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { ItemType } from "@/lib/enums";
import { client } from "../common";
import type { StorePurchaseRequest, StorePurchaseResponse } from "./types";

type Variables = StorePurchaseRequest;
type Response = StorePurchaseResponse;

// 0 = Power-Up, 1 = Skin
const ITEM_TYPE_MAP: Record<ItemType, number> = {
  [ItemType.PowerUp]: 0,
  [ItemType.Skin]: 1,
};

export const useStorePurchaseMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: "store/purchase",
      method: "POST",
      data: {
        itemType: ITEM_TYPE_MAP[variables.itemType],
        quantity: variables.quantity,
        metadata: variables.metadata,
      },
    }).then((response) => response.data),
});
