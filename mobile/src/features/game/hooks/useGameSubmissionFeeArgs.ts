import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  bufferCV,
  principalCV,
  type ClarityValue,
  uintCV,
} from "@stacks/transactions";

import { fetchReadOnly } from "@/api/stacks/read-only";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { SC_FUNCTIONS } from "@/lib/stacks/contracts";

const PLACEHOLDER_SIGNATURE = new Uint8Array(65);

type UseGameSubmissionFeeArgsOptions = {
  contractId: string;
  score: number;
  tournamentId?: number | null;
  enabled?: boolean;
};

export function useGameSubmissionFeeArgs({
  contractId,
  score,
  tournamentId,
  enabled = true,
}: UseGameSubmissionFeeArgsOptions) {
  const { stxAddress, isLoading: isLoadingWalletAddress } =
    useWalletAddresses();
  const [contractAddress = "", contractName = ""] = contractId.split(".");

  const nextUserNonceQuery = useQuery({
    queryKey: [
      "game-submission-next-user-nonce",
      contractId,
      stxAddress,
      tournamentId,
    ],
    queryFn: async () => {
      if (!stxAddress || tournamentId == null) {
        throw new Error("Wallet address and tournament id are required.");
      }

      const currentUserNonce = await fetchReadOnly<number | bigint>(
        contractAddress,
        contractName,
        SC_FUNCTIONS.game.readOnlyFunctions.GET_USER_NONCE,
        [principalCV(stxAddress), uintCV(tournamentId)],
        stxAddress,
      );

      return Number(currentUserNonce) + 1;
    },
    enabled:
      enabled &&
      score > 0 &&
      Boolean(contractAddress) &&
      Boolean(contractName) &&
      Boolean(stxAddress) &&
      tournamentId != null,
    staleTime: 30_000,
  });

  const feeFunctionArgs = useMemo<ClarityValue[]>(() => {
    if (tournamentId == null || score <= 0 || nextUserNonceQuery.data == null) {
      return [];
    }

    return [
      uintCV(tournamentId),
      uintCV(score),
      uintCV(nextUserNonceQuery.data),
      bufferCV(PLACEHOLDER_SIGNATURE),
    ];
  }, [nextUserNonceQuery.data, score, tournamentId]);

  return {
    feeFunctionArgs,
    nextUserNonce: nextUserNonceQuery.data,
    isLoadingFeeArgs:
      isLoadingWalletAddress ||
      (nextUserNonceQuery.isLoading && nextUserNonceQuery.data == null),
  };
}
