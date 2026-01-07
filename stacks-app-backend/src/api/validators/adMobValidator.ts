import z from 'zod';

export const ssvSchema = z.object({
  transaction_id: z.string(),
  user_id: z.number(),
  custom_data: z.string().optional(),
  timestamp: z.number(),
  key_id: z.string(),
  signature: z.string(),
  reward_amount: z.number().optional(),
  reward_item: z.string().optional(),
});
