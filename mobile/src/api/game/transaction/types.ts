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
  defiOperationId?: number;
};

export type CreateSponsoredTransactionResponse = {
  success: boolean;
  message: string;
  data?: {
    requestId: number;
    expiresAt: string;
  };
};

export type SponsoredTransactionStatus =
  | "not_broadcasted"
  | "processing"
  | "pending"
  | "success"
  | "failed";

export type GetSponsoredTransactionStatusRequest = {
  requestId: number;
};

export type GetSponsoredTransactionStatusResponse = {
  success: boolean;
  message: string;
  data?: {
    requestId: number;
    status: SponsoredTransactionStatus;
    txId?: string | null;
    waitReason?: "previous_origin_pending" | null;
    blockingRequestId?: number | null;
    blockingTxId?: string | null;
    originNonce?: number | null;
    adsRequired: number;
    adsWatchedCount: number;
  };
};
