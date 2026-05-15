import type { PortfolioAssetSnapshot } from "@/lib/assets/portfolio";

export type EarnTokenId = "btc" | "sbtc" | "stx";
export type EarnAcquisitionAsset = "STX" | "BTC";

export type EarnAssetSnapshot = PortfolioAssetSnapshot;

export type EarnQuickActions = {
  onBuy: () => void;
  onTransfer: () => void;
  onSwap: () => void;
  onBridge: () => void;
};

export type EarnRewardRowId = "dual-stacking" | "stacking" | "bridge-game";

export type EarnRewardRow = {
  id: EarnRewardRowId;
  label: string;
  value: number;
  statusLabel: string;
  statusTone: "active" | "inactive" | "pending";
  valueToken: "btc" | "stx";
};

export type EarnRewardsSummary = {
  totalRewardsUsd: number | null;
  currentStackingApr: number | null;
  rows: EarnRewardRow[];
};

export type EarnNextStepId =
  | "dual-stacking"
  | "bridge-sbtc"
  | "stack-stx"
  | "get-stx"
  | "get-btc"
  | "all-set";

export type EarnNextStepStatus =
  | "primary"
  | "secondary"
  | "preview"
  | "success";

export type EarnNextStepAction =
  | { type: "acquire"; asset: EarnAcquisitionAsset }
  | { type: "bridge" }
  | { type: "stacking" }
  | { type: "dual-stacking" }
  | { type: "none" };

export type EarnNextStepCard = {
  id: EarnNextStepId;
  title: string;
  description: string;
  status: EarnNextStepStatus;
  action: EarnNextStepAction;
};
