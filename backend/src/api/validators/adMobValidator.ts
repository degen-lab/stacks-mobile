import z from 'zod';

export const ssvSchema = z.object({
  transaction_id: z.string(),
  user_id: z.coerce.number(),
  custom_data: z.string(),
  timestamp: z.coerce.number(),
  key_id: z.string(),
  signature: z.string(),
  reward_amount: z.coerce.number().optional(),
  reward_item: z.string().optional(),
});
