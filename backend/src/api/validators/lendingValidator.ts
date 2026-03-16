import { validateStacksAddress } from '@stacks/transactions';
import z from 'zod';

export const saveLendingOperationSchema = z.object({
  txId: z
    .string()
    .min(1, 'Transaction ID is required')
    .regex(
      /^(0x)?[a-fA-F0-9]{64}$/,
      'Invalid Stacks transaction ID (must be 64 hex chars, optional 0x prefix)',
    )
    .transform((val) => (val.startsWith('0x') ? val : `0x${val}`)),
  senderAddress: z
    .string()
    .min(1, 'Sender address is required')
    .refine(validateStacksAddress, 'Invalid Stacks address (c32check)'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .int('Amount must be an integer'),
  assetId: z.string().min(1, 'Asset ID is required'),
  assetContract: z
    .string()
    .min(1, 'Asset contract is required')
    .refine((val) => {
      const parts = val.split('.');
      return (
        parts.length === 2 &&
        parts[1].length > 0 &&
        /^[a-z0-9-]+$/.test(parts[1]) &&
        validateStacksAddress(parts[0])
      );
    }, 'Invalid contract format (principal.contract-name)'),
});
