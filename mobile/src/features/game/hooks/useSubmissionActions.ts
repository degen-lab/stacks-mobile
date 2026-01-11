import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useCallback } from "react";

import {
  useBroadcastTransactionMutation,
  useCreateTransactionMutation,
} from "@/api/transaction";
import type { UserProfile } from "@/api/user/types";
import { useSignTransaction } from "@/hooks/use-sign-transaction";
import { CONTRACTS } from "@/lib/contracts";
import { SubmissionType } from "@/lib/enums";
import { walletKit } from "@/lib/wallet";

import type { SubmissionContext } from "./useSubmissionSheet";
import type { RunSummary } from "../utils/runSummary";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";

type SubmissionPayload = {
  submissionId: number;
  serializedTx: string;
};

type SubmissionDeferredRef = MutableRefObject<{
  resolve: (txId: string) => void;
  reject: (error: Error) => void;
} | null>;

type UseSubmissionActionsOptions = {
  score: number;
  runSummary: RunSummary | null;
  setRunSummary: Dispatch<SetStateAction<RunSummary | null>>;
  submissionContext: SubmissionContext;
  selectedNetwork: NetworkType;
  userProfile?: UserProfile;
  highscore: number;
  setHighscore: (score: number) => void;
  raffleSubmissionsUsed: number;
  queueSubmissionAd: (
    payload: SubmissionPayload,
    ssv: { userId: string; customData: string },
  ) => void;
  submissionDeferredRef: SubmissionDeferredRef;
};

export const useSubmissionActions = ({
  score,
  runSummary,
  setRunSummary,
  submissionContext,
  selectedNetwork,
  userProfile,
  highscore,
  setHighscore,
  raffleSubmissionsUsed,
  queueSubmissionAd,
  submissionDeferredRef,
}: UseSubmissionActionsOptions) => {
  const createTransactionMutation = useCreateTransactionMutation();
  const broadcastTransactionMutation = useBroadcastTransactionMutation();
  const signTransaction = useSignTransaction();

  const handleSubmissionSuccess = useCallback(
    (txId: string) => {
      console.info("Submission success", txId);
      setRunSummary((prev) => {
        if (!prev) return prev;
        const isRaffleSubmission = submissionContext?.kind === "raffle";
        if (prev.score > highscore) {
          setTimeout(() => {
            setHighscore(prev.score);
          }, 0);
        }
        return {
          ...prev,
          submittedHighscore: isRaffleSubmission
            ? prev.submittedHighscore
            : true,
          submittedRaffle: isRaffleSubmission ? true : prev.submittedRaffle,
          submissionsUsed: isRaffleSubmission
            ? (prev.submissionsUsed ?? raffleSubmissionsUsed) + 1
            : prev.submissionsUsed,
        };
      });
    },
    [
      highscore,
      raffleSubmissionsUsed,
      setHighscore,
      setRunSummary,
      submissionContext?.kind,
    ],
  );

  const handleSubmitSponsored = useCallback(async () => {
    return await new Promise<string>(async (resolve, reject) => {
      submissionDeferredRef.current = { resolve, reject };
      try {
        const accounts = await walletKit.getWalletAccounts();
        const account = accounts[0];
        if (!account) {
          throw new Error("Wallet not available.");
        }
        if (!userProfile?.id) {
          throw new Error("User profile not available.");
        }
        const response = await createTransactionMutation.mutateAsync({
          address: account.addresses.testnet,
          publicKey: account.publicKey,
          score: runSummary?.score ?? score,
          submissionType: SubmissionType.WeeklyContest,
          isSponsored: true,
        });
        const unsigned = response.data?.unsignedTransaction;
        if (!unsigned?.submission?.id || !unsigned.serializedTx) {
          throw new Error("Invalid transaction response.");
        }
        const signedSerializedTx = await signTransaction(
          unsigned.serializedTx,
          account.index,
        );
        queueSubmissionAd(
          {
            submissionId: unsigned.submission.id,
            serializedTx: signedSerializedTx,
          },
          {
            userId: String(userProfile.id),
            customData: String(unsigned.submission.id),
          },
        );
      } catch (error) {
        const nextError =
          error instanceof Error ? error : new Error(String(error));
        submissionDeferredRef.current = null;
        reject(nextError);
      }
    });
  }, [
    createTransactionMutation,
    queueSubmissionAd,
    runSummary?.score,
    score,
    signTransaction,
    submissionDeferredRef,
    userProfile?.id,
  ]);

  const handleSubmitWallet = useCallback(async () => {
    const accounts = await walletKit.getWalletAccounts();
    const account = accounts[0];
    if (!account) {
      throw new Error("Wallet not available.");
    }

    const submissionScore = runSummary?.score ?? score;
    const submissionType =
      submissionContext?.kind === "raffle"
        ? SubmissionType.Lottery
        : SubmissionType.WeeklyContest;
    const [address, contractName] =
      CONTRACTS[selectedNetwork]?.game?.CONTRACT?.split(".") ?? [];
    if (!address || !contractName) {
      throw new Error("Invalid contract address or name.");
    }

    const response = await createTransactionMutation.mutateAsync({
      address: account.addresses.testnet,
      publicKey: account.publicKey,
      score: submissionScore,
      submissionType,
      isSponsored: false,
    });

    const unsigned = response.data?.unsignedTransaction;
    if (!unsigned?.submission?.id || !unsigned.serializedTx) {
      throw new Error("Invalid transaction response.");
    }

    const signedSerializedTx = await signTransaction(
      unsigned.serializedTx,
      account.index,
    );

    await broadcastTransactionMutation.mutateAsync({
      submissionId: unsigned.submission.id,
      serializedTx: signedSerializedTx,
    });

    return String(unsigned.submission.id);
  }, [
    broadcastTransactionMutation,
    createTransactionMutation,
    runSummary?.score,
    score,
    selectedNetwork,
    signTransaction,
    submissionContext?.kind,
  ]);

  return { handleSubmissionSuccess, handleSubmitSponsored, handleSubmitWallet };
};
