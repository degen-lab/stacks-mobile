import { cvToHex, ClarityValue } from "@stacks/transactions";
import { hiroApiClient, stacksApiDegenClient } from "../common/stacks-client";
import { transformClarityValue } from "@/lib/stacks/transform-clarity-value";

export const fetchReadOnly = async <T>(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[] = [],
  senderAddress: string = contractAddress,
  useDegenApi: boolean = false, // Use DegenLab Stacks API instead of Hiro API
): Promise<T> => {
  const endpoint = `/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
  const apiClient = useDegenApi ? stacksApiDegenClient : hiroApiClient;

  try {
    const response = await apiClient.post(endpoint, {
      sender: senderAddress,
      arguments: functionArgs.map((arg) => cvToHex(arg)),
    });

    if (!response.data.okay) {
      throw new Error(response.data.cause || "Unknown Stacks Node Error");
    }
    return transformClarityValue(response.data.result) as T;
  } catch (error) {
    console.error(`[ReadOnly] ${contractName}.${functionName} failed:`, error);
    throw error;
  }
};
