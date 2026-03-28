import type { AppToken } from "@/lib/assets/tokens";

export type TransferMode = "select" | "send" | "receive";

export type SendStep = "asset" | "amount" | "recipient" | "confirm";

export type TransferSource = "manual" | "transak-sell";

export interface SendFieldLocks {
  asset: boolean;
  recipient: boolean;
  memo: boolean;
  amount: boolean;
}

export interface SendFormData {
  asset: AppToken | null;
  recipient: string;
  memo: string;
  amount: string;
  source: TransferSource;
}

export interface SendFlowRequest {
  asset?: AppToken | null;
  recipient?: string;
  memo?: string;
  amount?: string;
  source?: TransferSource;
  locks?: Partial<SendFieldLocks>;
}

export interface ReceiveFlowRequest {
  asset?: AppToken | null;
}

export interface TransferSheetRequest {
  mode?: Exclude<TransferMode, "select">;
  send?: SendFlowRequest;
  receive?: ReceiveFlowRequest;
}
