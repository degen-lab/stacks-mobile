import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";

import { trackEvent } from "@/lib/analytics";

import { useCreateGameSubmissionTransactionMutation } from "@/api/game/transaction";
import { useSponsoredStacksTransaction } from "@/hooks/use-sponsored-stacks-transaction";
import { useSubmitStacksTransaction } from "@/hooks/use-submit-stacks-transaction";
import { SubmissionType } from "@/lib/enums";
import { getActiveWalletAccount } from "@/lib/stacks/active-account";

import type { SubmissionContext } from "./useSubmissionSheet";
import type { RunSummary } from "../utils/runSummary";

type UseSubmissionActionsOptions = {
  score: number;
  runSummary: RunSummary | null;
  setRunSummary: Dispatch<SetStateAction<RunSummary | null>>;
  submissionContext: SubmissionContext;
  highscore: number;
  setHighscore: (score: number) => void;
  raffleSubmissionsUsed: number;
};

export const useSubmissionActions = ({
  score,
  runSummary,
  setRunSummary,
  submissionContext,
  highscore,
  setHighscore,
  raffleSubmissionsUsed,
}: UseSubmissionActionsOptions) => {
  const createGameSubmissionTransactionMutation =
    useCreateGameSubmissionTransactionMutation();
  const { submitPreparedSponsoredTransaction } =
    useSponsoredStacksTransaction();
  const { submitWalletTransaction } = useSubmitStacksTransaction();

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
    const {
      account,
      accountIndex,
      address: originAddress,
    } = await getActiveWalletAccount();
    const submissionScore = runSummary?.score ?? score;
    if (submissionScore <= 0) {
      throw new Error("Score must be greater than 0.");
    }
    const submissionType =
      submissionContext?.kind === "raffle"
        ? SubmissionType.Lottery
        : SubmissionType.WeeklyContest;
    const response = await createGameSubmissionTransactionMutation.mutateAsync({
      address: originAddress,
      publicKey: account.publicKey,
      score: submissionScore,
      submissionType,
      isSponsored: true,
    });
    const unsigned = response.data?.unsignedGameSubmissionTransaction;
    if (!unsigned?.requestId || !unsigned.serializedTx) {
      throw new Error("Invalid transaction response.");
    }

    const requestId = await submitPreparedSponsoredTransaction({
      requestId: unsigned.requestId,
      accountIndex,
      unsignedSerializedTx: unsigned.serializedTx,
    });
    return String(requestId);
  }, [
    createGameSubmissionTransactionMutation,
    runSummary?.score,
    score,
    submissionContext?.kind,
    submitPreparedSponsoredTransaction,
  ]);

  const handleSubmitWallet = useCallback(async () => {
    const {
      account,
      accountIndex,
      address: originAddress,
    } = await getActiveWalletAccount();
    const submissionScore = runSummary?.score ?? score;
    if (submissionScore <= 0) {
      throw new Error("Score must be greater than 0.");
    }
    const submissionType =
      submissionContext?.kind === "raffle"
        ? SubmissionType.Lottery
        : SubmissionType.WeeklyContest;
    const response = await createGameSubmissionTransactionMutation.mutateAsync({
      address: originAddress,
      publicKey: account.publicKey,
      score: submissionScore,
      submissionType,
      isSponsored: false,
    });

    const unsigned = response.data?.unsignedGameSubmissionTransaction;
    if (!unsigned?.submission?.id || !unsigned.serializedTx) {
      throw new Error("Invalid transaction response.");
    }

    await submitWalletTransaction({
      accountIndex,
      unsignedSerializedTx: unsigned.serializedTx,
      linkedSubmissionId: unsigned.submission.id,
    });

    const eventName =
      submissionContext?.kind === "raffle"
        ? "raffle_entered"
        : "score_submitted";
    void trackEvent(eventName, { method: "wallet" });
    return String(unsigned.submission.id);
  }, [
    createGameSubmissionTransactionMutation,
    runSummary?.score,
    score,
    submissionContext?.kind,
    submitWalletTransaction,
  ]);

  return { handleSubmissionSuccess, handleSubmitSponsored, handleSubmitWallet };
};
