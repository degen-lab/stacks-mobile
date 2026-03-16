import { useQuery } from "@tanstack/react-query";
import {
  fetchFeeEstimateTransfer,
  makeUnsignedSTXTokenTransfer,
} from "@stacks/transactions";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import { MICRO_STX } from "@/lib/format/currency";
import { getHiroApiBase } from "@/lib/stacks/network";

const DUMMY_PUBLIC_KEY =
  "000000000000000000000000000000000000000000000000000000000000000000";

type Params = {
  recipient: string;
  amount: string;
  network: NetworkType;
  enabled?: boolean;
};

export type PreparedStxSend = {
  feeMicroStx: number;
  feeDisplay: string;
};

export function usePrepareStxSend({
  recipient,
  amount,
  network,
  enabled = true,
}: Params) {
  return useQuery({
    queryKey: ["stx-send-fee", network, recipient, amount],
    queryFn: async (): Promise<PreparedStxSend> => {
      const amountMicroStx = Math.round((Number(amount) || 0) * MICRO_STX);
      const tx = await makeUnsignedSTXTokenTransfer({
        recipient,
        amount: amountMicroStx,
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
      enabled && !!recipient.trim() && !!amount.trim() && Number(amount) > 0,
    staleTime: 30_000,
    retry: false,
  });
}
