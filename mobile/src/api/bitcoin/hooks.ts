import { useMutation, useQuery } from "@tanstack/react-query";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { queryClient } from "@/api/common";
import {
  fetchBitcoinFeeRecommendation,
  fetchBitcoinUtxos,
  broadcastBitcoinTransaction,
} from "./client";

export const useBitcoinUtxos = ({
  address,
  network,
  enabled = true,
}: {
  address: string | null;
  network: NetworkType;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: ["bitcoin-utxos", network, address],
    queryFn: () => fetchBitcoinUtxos(address ?? "", network),
    enabled: enabled && !!address,
    staleTime: 15_000,
  });

export const useBitcoinFeeRecommendation = ({
  network,
  enabled = true,
}: {
  network: NetworkType;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: ["bitcoin-fee-recommendation", network],
    queryFn: () => fetchBitcoinFeeRecommendation(network),
    enabled,
    staleTime: 30_000,
  });

export const useBroadcastBitcoinTransaction = (network: NetworkType) =>
  useMutation({
    mutationFn: (rawTxHex: string) =>
      broadcastBitcoinTransaction(rawTxHex, network),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bitcoin-utxos", network] });
    },
  });
