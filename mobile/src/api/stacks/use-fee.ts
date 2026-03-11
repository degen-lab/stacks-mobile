import { useQuery } from "@tanstack/react-query";
import {
  makeUnsignedContractCall,
  ClarityValue,
  PostCondition,
  serializePayload,
} from "@stacks/transactions";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import { fetchFromStacksApi, endpoints } from "./stacks-api";
import { FeeResponse } from "./types/fee";
import { isAxiosError } from "axios";

const feeEstimationRetry = (failureCount: number, error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 400) return false;
  return failureCount < 1;
};

interface UseFeeEstimationOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network: NetworkType;
  postConditions?: PostCondition[];
  enabled?: boolean;
}

export const useFeeEstimation = ({
  contractAddress,
  contractName,
  functionName,
  functionArgs,
  network,
  postConditions = [],
  enabled = true,
}: UseFeeEstimationOptions) => {
  const argsKey = JSON.stringify(functionArgs, (_, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );

  return useQuery({
    queryKey: [
      "fee-estimation",
      contractAddress,
      contractName,
      functionName,
      argsKey,
      network,
    ],
    queryFn: async () => {
      const transaction = await makeUnsignedContractCall({
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        postConditions,
        network: network === "mainnet" ? "mainnet" : "testnet",
        publicKey:
          "000000000000000000000000000000000000000000000000000000000000000000",
        fee: 0,
        nonce: 0,
      });

      const payloadBytes = serializePayload(transaction.payload);
      const response = await fetchFromStacksApi<FeeResponse>(
        endpoints.FEE_TRANSACTION,
        {},
        "POST",
        {
          transaction_payload: payloadBytes.toString(),
          estimated_len: payloadBytes.length + 180,
        },
      );
      return response.estimations;
    },
    enabled,
    staleTime: 30000,
    retry: feeEstimationRetry,
  });
};
