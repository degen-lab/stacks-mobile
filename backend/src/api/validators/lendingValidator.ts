import z from 'zod';

export const saveLendingOperationSchema = z.object({
  txId: z
    .string()
    .min(1, 'Transaction ID is required')
    .regex(/^0x[a-fA-F0-9]+$/, 'Invalid transaction ID format'),
  senderAddress: z
    .string()
    .min(1, 'Sender address is required')
    .regex(/^S[A-Z0-9]+$/, 'Invalid Stacks address format'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .int('Amount must be an integer'),
  assetId: z.string().min(1, 'Asset ID is required'),
  assetContract: z
    .string()
    .min(1, 'Asset contract is required')
    .regex(
      /^S[A-Z0-9]+\.[a-z0-9-]+$/,
      'Invalid contract format (must be principal.contract-name)',
    ),
});
