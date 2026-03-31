import { useQuery } from "@tanstack/react-query";
import {
  fetchFeeEstimateTransfer,
  makeUnsignedContractCall,
  noneCV,
  standardPrincipalCV,
  uintCV,
} from "@stacks/transactions";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import { MICRO_STX } from "@/lib/format/currency";
import { getHiroApiBase } from "@/lib/stacks/network";

const DUMMY_PUBLIC_KEY =
  "000000000000000000000000000000000000000000000000000000000000000000";

type Params = {
  contractId: string;
  recipient: string;
  amount: string;
  decimals: number;
  senderAddress: string;
  network: NetworkType;
  enabled?: boolean;
};

export type PreparedFtSend = {
  feeMicroStx: number;
  feeDisplay: string;
};

export function usePrepareFtSend({
  contractId,
  recipient,
  amount,
  decimals,
  senderAddress,
  network,
  enabled = true,
}: Params) {
  return useQuery({
    queryKey: [
      "ft-send-fee",
      contractId,
      network,
      recipient,
      amount,
      senderAddress,
    ],
    queryFn: async (): Promise<PreparedFtSend> => {
      const [contractAddress, contractName] = contractId.split(".");
      const amountBaseUnits = Math.round(Number(amount) * 10 ** decimals);
      const tx = await makeUnsignedContractCall({
        contractAddress,
        contractName,
        functionName: "transfer",
        functionArgs: [
          uintCV(amountBaseUnits),
          standardPrincipalCV(senderAddress),
          standardPrincipalCV(recipient),
          noneCV(),
        ],
        network: network === "mainnet" ? "mainnet" : "testnet",
        publicKey: DUMMY_PUBLIC_KEY,
        fee: 0,
        nonce: 0,
      });

      const baseUrl = getHiroApiBase(network);
      const feeMicroStx = Number(
        await fetchFeeEstimateTransfer({
          transaction: tx,
          client: { baseUrl },
        }),
      );

      return {
        feeMicroStx,
        feeDisplay: (feeMicroStx / MICRO_STX).toFixed(6),
      };
    },
    enabled:
      enabled &&
      !!recipient.trim() &&
      !!amount.trim() &&
      Number(amount) > 0 &&
      !!senderAddress,
    staleTime: 30_000,
    retry: false,
  });
}
