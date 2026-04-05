import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import {
  makeUnsignedContractCall,
  makeUnsignedSTXTokenTransfer,
  PostConditionMode,
  serializeTransaction,
  type ClarityValue,
  type PostCondition,
} from "@stacks/transactions";

const resolveStacksNetwork = (network: NetworkType) =>
  network === "mainnet" ? "mainnet" : "testnet";

type BuildUnsignedContractCallOptions = {
  contractId: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network: NetworkType;
  publicKey: string;
  feeMicroStx?: number;
  sponsored?: boolean;
  postConditionMode?: PostConditionMode;
  postConditions?: PostCondition[];
  nonce?: number;
};

type BuildUnsignedStxTransferOptions = {
  recipient: string;
  amountMicroStx: number;
  network: NetworkType;
  publicKey: string;
  memo?: string;
  feeMicroStx?: number;
  sponsored?: boolean;
};

export async function buildUnsignedContractCall({
  contractId,
  functionName,
  functionArgs,
  network,
  publicKey,
  feeMicroStx,
  sponsored = false,
  postConditionMode = PostConditionMode.Allow,
  postConditions = [],
  nonce,
}: BuildUnsignedContractCallOptions): Promise<string> {
  const [contractAddress, contractName] = contractId.split(".");
  if (!contractAddress || !contractName) {
    throw new Error("Invalid contract identifier");
  }

  const transaction = await makeUnsignedContractCall({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    network: resolveStacksNetwork(network),
    publicKey,
    fee: feeMicroStx,
    sponsored,
    postConditionMode,
    postConditions,
    ...(nonce !== undefined && { nonce: BigInt(nonce) }),
  });

  return `0x${serializeTransaction(transaction)}`;
}

export async function buildUnsignedStxTransfer({
  recipient,
  amountMicroStx,
  network,
  publicKey,
  memo,
  feeMicroStx,
  sponsored = false,
}: BuildUnsignedStxTransferOptions): Promise<string> {
  const transaction = await makeUnsignedSTXTokenTransfer({
    recipient,
    amount: amountMicroStx,
    network: resolveStacksNetwork(network),
    publicKey,
    memo,
    fee: feeMicroStx,
    sponsored,
  });

  return `0x${serializeTransaction(transaction)}`;
}
