import { createQuery } from "react-query-kit";

import { endpoints, fetchFromStacksApi } from "@/api/stacks/stacks-api";
import { PoxInfo } from "@/api/stacks/types/pox-info";

type StacksApiResponse = Record<string, unknown>;

type AddressVars = { address: string };
type BtcAddressVars = { btcAddress: string };
type ContractIdVars = { contractId: string };
type ContractVariableVars = { contractId: string; variableName: string };
type TxIdVars = { txId: string };
type AddressOrNullVars = { address: string | null };

export const useApiInfo = createQuery<StacksApiResponse, void>({
  queryKey: ["stacks-api-info"],
  fetcher: () => fetchFromStacksApi(endpoints.INFO),
});

export const usePoxData = createQuery<PoxInfo, void>({
  queryKey: ["stacks-pox-data"],
  fetcher: () => fetchFromStacksApi<PoxInfo>(endpoints.POX),
});

export const useUserBalances = createQuery<StacksApiResponse, AddressVars>({
  queryKey: ["stacks-user-balances"],
  fetcher: ({ address }) =>
    fetchFromStacksApi(endpoints.USER_BALANCES, { address }),
});

export const useBurnchainRewards = createQuery<
  StacksApiResponse,
  BtcAddressVars
>({
  queryKey: ["stacks-burnchain-rewards"],
  fetcher: ({ btcAddress }) =>
    fetchFromStacksApi(endpoints.BURNCHAIN_REWARDS, { btcAddress }),
});

export const useTransactions = createQuery<StacksApiResponse, AddressVars>({
  queryKey: ["stacks-address-transactions"],
  fetcher: ({ address }) =>
    fetchFromStacksApi(endpoints.TRANSACTIONS, { address }),
});

export const useTxById = createQuery<StacksApiResponse, TxIdVars>({
  queryKey: ["stacks-tx-by-id"],
  fetcher: ({ txId }) =>
    fetchFromStacksApi(endpoints.TX_BY_ID, { tx_id: txId }),
});

export const useTotalRewardsForAddress = createQuery<
  StacksApiResponse | number,
  AddressOrNullVars
>({
  queryKey: ["stacks-total-rewards"],
  fetcher: ({ address }) =>
    address ? fetchFromStacksApi(endpoints.ADDRESS_REWARDS, { address }) : 0,
});

export const useContractStatus = createQuery<StacksApiResponse, ContractIdVars>(
  {
    queryKey: ["stacks-contract-status"],
    fetcher: ({ contractId }) =>
      fetchFromStacksApi(endpoints.CONTRACT_STATUS, { contractId }),
  },
);

export const useContractVariable = createQuery<
  StacksApiResponse,
  ContractVariableVars
>({
  queryKey: ["stacks-contract-variable"],
  fetcher: ({ contractId, variableName }) => {
    const [contractAddress, contractName] = contractId.split(".");

    return fetchFromStacksApi(endpoints.CONTRACT_VARIABLE, {
      contractAddress,
      contractName,
      variableName,
    });
  },
});
