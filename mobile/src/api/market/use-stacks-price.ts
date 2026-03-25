import { createQuery } from "react-query-kit";

type StacksPriceResponse = {
  blockstack?: {
    usd?: number;
    usd_24h_change?: number;
  };
};

type Response = {
  usd: number | null;
  change24h: number | null;
};
type Variables = void;

const STACKS_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd&include_24hr_change=true";

export const useStacksPrice = createQuery<Response, Variables>({
  queryKey: ["market-price", "stacks", "usd"],
  fetcher: async () => {
    const response = await fetch(STACKS_PRICE_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch STX price");
    }
    const data = (await response.json()) as StacksPriceResponse;
    return {
      usd: data.blockstack?.usd ?? null,
      change24h: data.blockstack?.usd_24h_change ?? null,
    };
  },
});
