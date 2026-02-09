export type TransferAsset = "STX" | "BTC" | "sBTC";

export type TransferMode = "select" | "send" | "receive";

export type SendStep = "asset" | "recipient" | "amount" | "confirm";

export interface SendFormData {
  asset: TransferAsset;
  recipient: string;
  memo?: string;
  amount: string;
}
