import { cvToHex, ClarityValue } from "@stacks/transactions";
import { stacksApiClient } from "../common/stacks-client";
import { transformClarityValue } from "@/lib/stacks/transform-clarity-value";

export const fetchReadOnly = async <T>(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[] = [],
  senderAddress: string = contractAddress,
): Promise<T> => {
  const endpoint = `/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;

  try {
    const response = await stacksApiClient.post(endpoint, {
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
