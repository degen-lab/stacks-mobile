export type TransferAsset = "STX" | "BTC" | "sBTC";

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
  asset: TransferAsset | null;
  recipient: string;
  memo: string;
  amount: string;
  source: TransferSource;
}

export interface SendFlowRequest {
  asset?: TransferAsset | null;
  recipient?: string;
  memo?: string;
  amount?: string;
  source?: TransferSource;
  locks?: Partial<SendFieldLocks>;
}

export interface ReceiveFlowRequest {
  asset?: TransferAsset | null;
}

export interface TransferSheetRequest {
  mode?: Exclude<TransferMode, "select">;
  send?: SendFlowRequest;
  receive?: ReceiveFlowRequest;
}
