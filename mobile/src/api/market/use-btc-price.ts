import { createQuery } from "react-query-kit";

import { ONE_MINUTE_MS } from "@/api/common/query-constants";

type BitcoinPriceResponse = {
  bitcoin?: {
    usd?: number;
    usd_24h_change?: number;
  };
};

type Response = {
  usd: number | null;
  change24h: number | null;
};
type Variables = void;

const BITCOIN_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true";

export const useBtcPrice = createQuery<Response, Variables>({
  queryKey: ["market-price", "bitcoin", "usd"],
  fetcher: async () => {
    const response = await fetch(BITCOIN_PRICE_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch BTC price");
    }
    const data = (await response.json()) as BitcoinPriceResponse;
    return {
      usd: data.bitcoin?.usd ?? null,
      change24h: data.bitcoin?.usd_24h_change ?? null,
    };
  },
  staleTime: ONE_MINUTE_MS,
  refetchOnWindowFocus: false,
  retry: false,
});
