import type { SubmissionType } from "@/lib/enums";

export type CreateTransactionRequest = {
  address: string;
  publicKey: string;
  score: number;
  submissionType: SubmissionType;
  isSponsored: boolean;
};

export type CreateTransactionResponse = {
  success: boolean;
  message: string;
  data?: {
    unsignedTransaction?: {
      serializedTx: string;
      submission: {
        id: number;
      };
    };
  };
};

export type BroadcastTransactionRequest = {
  submissionId: number;
  serializedTx: string;
};

export type BroadcastTransactionResponse = {
  success: boolean;
  message: string;
  data?: {
    submission?: {
      id: number;
    };
  };
};
