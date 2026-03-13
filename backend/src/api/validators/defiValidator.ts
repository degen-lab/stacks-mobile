import { validateStacksAddress } from '@stacks/transactions';
import z from 'zod';
export const swapParamsSchema = z.object({
  tokenInId: z.string().min(1, 'Token In ID is required'),
  tokenOutId: z.string().min(1, 'Token Out ID is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !Number.isNaN(parseFloat(val)), 'Amount must be a valid number')
    .transform((val) => parseFloat(val))
    .refine((val) => val > 0, 'Amount must be positive')
    .refine((val) => Number.isFinite(val), 'Amount must be finite'),
  senderAddress: z
    .string()
    .min(1, 'Sender address is required')
    .refine(validateStacksAddress, 'Invalid Stacks address (c32check)'),
});
