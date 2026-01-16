import z from 'zod';
import { GameSession } from '../../shared/types';
import { ItemVariant, SubmissionType } from '../../domain/entities/enums';

// Zod schema matching the GameSession type
const gameSessionSchema: z.ZodType<GameSession> = z.object({
  seed: z.string(),
  signature: z.string(),
  moves: z.array(
    z.object({
      startTime: z.number().min(0),
      duration: z.number().min(0),
      idleDurationMs: z.number().min(0).optional(),
      debug: z
        .object({
          stickTip: z.number().nullable(),
          bridgeLength: z.number().nullable(),
          currentPlatformRight: z.number().nullable(),
          nextPlatformIndex: z.number().nullable(),
          platformX: z.number().nullable(),
          platformRight: z.number().nullable().optional(),
          platformCenter: z.number().nullable().optional(),
          platformIsMoving: z.boolean().nullable(),
          distToCenter: z.number().nullable().optional(),
        })
        .optional(),
    }),
  ),
  usedItems: z.array(z.enum(ItemVariant)),
});

export const gameSessionDataSchema = z.object({
  sessionData: gameSessionSchema,
  debug: z.boolean().optional(),
  transactionData: z
    .object({
      address: z.string().min(40).max(41),
      publicKey: z.string(),
      submissionType: z.enum(SubmissionType),
      isSponsored: z.boolean(),
    })
    .optional(),
});
