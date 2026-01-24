import z from 'zod';

export const saveStackingDataSchema = z.object({
  txId: z.string(),
  poolName: z.string().min(3).max(40),
});
