import type { SubmissionType } from "@/lib/enums";

export type UnsignedGameSubmissionTransaction = {
  serializedTx: string;
  submission: {
    id: number;
  };
  requestId?: number;
  expiresAt?: string;
};

export type CreateGameSubmissionTransactionRequest = {
  address: string;
  publicKey: string;
  score: number;
  submissionType: SubmissionType;
  isSponsored: boolean;
};

export type CreateGameSubmissionTransactionResponse = {
  success: boolean;
  message: string;
  data?: {
    unsignedGameSubmissionTransaction: UnsignedGameSubmissionTransaction;
  };
};

export type BroadcastTransactionRequest = {
  serializedTx: string;
  submissionId?: number;
};

export type BroadcastTransactionResponse = {
  success: boolean;
  message: string;
  data?: {
    transactionResult?: {
      txid: string;
    };
  };
};

export type BroadcastSponsoredTransactionRequest = {
  requestId: number;
  serializedTx: string;
};

export type BroadcastSponsoredTransactionResponse = {
  success: boolean;
  message: string;
  data?: {
    requestId: number;
    submission?: {
      id: number;
    };
  };
};

export type CreateSponsoredTransactionRequest = {
  originAddress: string;
};

export type CreateSponsoredTransactionResponse = {
  success: boolean;
  message: string;
  data?: {
    requestId: number;
    expiresAt: string;
  };
};
