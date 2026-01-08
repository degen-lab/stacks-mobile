import { z } from 'zod';
import { ItemType, ItemVariant } from '../../domain/entities/enums';

export const purchaseItemSchema = z.object({
  itemType: z.enum(ItemType), // 0 = PowerUp, 1 = Skin
  quantity: z.number().min(1).optional(),
  metadata: z.object({
    variant: z.enum(ItemVariant),
  }),
});
