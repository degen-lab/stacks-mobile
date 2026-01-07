import z from 'zod';
import { SubmissionType } from '../../domain/entities/enums';

export const createTransactionSchema = z.object({
  address: z
    .string()
    .min(40)
    .max(41)
    .refine(
      (addr) => addr.length === 40 || addr.length === 41,
      'Address must be 40 or 41 characters',
    ),
  publicKey: z.string(), // User's public key for sponsored transaction
  score: z.number(),
  submissionType: z.enum(SubmissionType),
  isSponsored: z.boolean(),
});

export const broadcastTxSchema = z.object({
  submissionId: z.number(),
  serializedTx: z.string(),
});
