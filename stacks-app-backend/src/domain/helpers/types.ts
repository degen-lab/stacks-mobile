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
