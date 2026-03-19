import { createQuery } from "react-query-kit";

type BitcoinPriceResponse = {
  bitcoin?: {
    usd?: number;
  };
};

type Response = number | null;
type Variables = void;

const BITCOIN_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

export const useBtcPrice = createQuery<Response, Variables>({
  queryKey: ["market-price", "bitcoin", "usd"],
  fetcher: async () => {
    const response = await fetch(BITCOIN_PRICE_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch BTC price");
    }
    const data = (await response.json()) as BitcoinPriceResponse;
    return data.bitcoin?.usd ?? null;
  },
});
