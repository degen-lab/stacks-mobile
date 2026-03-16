import z from 'zod';
import { SubmissionType } from '../../domain/entities/enums';

export const stacksAddressSchema = z
  .string()
  .min(40)
  .max(41)
  .refine(
    (addr) => addr.length === 40 || addr.length === 41,
    'Address must be 40 or 41 characters',
  );

export const createGameSubmissionTransactionSchema = z.object({
  address: stacksAddressSchema,
  publicKey: z.string(), // User's public key for sponsored transaction
  score: z.number(),
  submissionType: z.enum(SubmissionType),
  isSponsored: z.boolean(),
});

export const broadcastTxSchema = z.object({
  serializedTx: z.string(),
  submissionId: z.number().optional(),
});

export const enqueueSponsoredTransactionSchema = z.object({
  requestId: z.number().int().positive(),
  serializedTx: z.string(),
});

export const createSponsoredTransactionSchema = z.object({
  originAddress: stacksAddressSchema,
});
