import { ItemCategory, ItemType, ItemVariant } from '../entities/enums';
import { StoreItem } from './types';

export const storeItems: Record<ItemVariant, StoreItem> = {
  [ItemVariant.Revive]: {
    itemType: ItemType.PowerUp,
    variant: ItemVariant.Revive,
    category: ItemCategory.consumable,
    name: 'Revive',
    description: 'Revive your character when defeated.',
    price: 15,
  },
  [ItemVariant.DropPoint]: {
    itemType: ItemType.PowerUp,
    variant: ItemVariant.DropPoint,
    category: ItemCategory.consumable,
    name: 'Drop Point',
    description: 'Preview where your bridge will land.',
    price: 15,
  },
  [ItemVariant.PurpleSkin]: {
    itemType: ItemType.Skin,
    variant: ItemVariant.PurpleSkin,
    category: ItemCategory.unique,
    name: 'Purple Skin',
    description: 'A purple skin for your character.',
    price: 10,
  },
  [ItemVariant.BlackSkin]: {
    itemType: ItemType.Skin,
    variant: ItemVariant.BlackSkin,
    category: ItemCategory.unique,
    name: 'Black Skin',
    description: 'A black skin for your character.',
    price: 20,
  },
};
