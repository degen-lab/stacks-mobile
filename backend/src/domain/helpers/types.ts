import { ItemCategory, ItemType, ItemVariant } from '../entities/enums';

export type StoreItem = {
  itemType: ItemType;
  variant: ItemVariant;
  category: ItemCategory;
  name: string;
  description: string;
  price: number;
};

export enum SubmissionTier {
  None,
  Bronze,
  Silver,
  Gold,
  RaffleWinner,
}

export type SwapTxMetadata = {
  tokenIn: string;
  tokenOut: string;
  amount: number;
};

export type LendingTxMetadata = Record<string, never>;

export type DefiOperationMetadata = SwapTxMetadata | LendingTxMetadata;
