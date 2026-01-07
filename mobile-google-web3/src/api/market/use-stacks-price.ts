import { createQuery } from "react-query-kit";

type StacksPriceResponse = {
  blockstack?: {
    usd?: number;
  };
};

type Response = number | null;
type Variables = void;

const STACKS_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd";

export const useStacksPrice = createQuery<Response, Variables>({
  queryKey: ["market-price", "stacks", "usd"],
  fetcher: async () => {
    const response = await fetch(STACKS_PRICE_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch STX price");
    }
    const data = (await response.json()) as StacksPriceResponse;
    return data.blockstack?.usd ?? null;
  },
});
