import z from 'zod';

export const registerOrLoginSchema = z.object({
  googleId: z.string().min(21, {
    message: 'Invalid googleId it must be at least 21 characters longs',
  }),
  nickName: z
    .string()
    .min(2, { message: 'The nickname must be at least 2 characters long' })
    .max(25, { message: 'The nickname must be maximum 25 characters long' })
    .optional(),
  referralCode: z
    .string()
    .length(8, {
      message: 'Invalid referral code, it must be 8 characters long ',
    })
    .optional(),
  photoUri: z.string().optional(),
});
