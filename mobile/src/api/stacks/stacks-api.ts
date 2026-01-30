import { stacksApiClient } from "@/api/common/stacks-client";

export const endpoints = {
  INFO: "/v2/info",
  POX: "/v2/pox",
  USER_BALANCES: "/extended/v1/address/{address}/balances",
  BURNCHAIN_REWARDS: "/extended/v1/burnchain/rewards/{btcAddress}/total",
  TRANSACTIONS: "/extended/v2/addresses/{address}/transactions",
  MEMPOOL: "/extended/v1/tx/mempool?sender_address={sender}",
  TX_BY_ID: "/extended/v1/tx/{tx_id}",
  ADDRESS_REWARDS: "/extended/v1/burnchain/rewards/{address}/total",
  CONTRACT_STATUS:
    "/extended/v2/smart-contracts/status?contract_id={contractId}",
  CONTRACT_VARIABLE:
    "/v2/data_var/{contractAddress}/{contractName}/{variableName}?proof=0",
} as const;

export const constructUrl = (
  endpoint: string,
  params: Record<string, string> = {},
) =>
  Object.entries(params).reduce(
    (url, [key, value]) => url.replace(`{${key}}`, encodeURIComponent(value)),
    endpoint,
  );

export const fetchFromStacksApi = async <T = unknown>(
  endpoint: string,
  params: Record<string, string> = {},
  method: "GET" | "POST" = "GET",
  data?: unknown,
): Promise<T> => {
  const url = constructUrl(endpoint, params);
  const response = await stacksApiClient({
    url,
    method,
    data,
  });
  return response.data as T;
};
