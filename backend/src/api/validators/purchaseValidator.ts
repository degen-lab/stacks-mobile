import z from 'zod';

export const createWidgetUrlSchema = z.object({
  cryptoCurrencyCode: z.string(),
  fiatCurrency: z.string(),
  fiatAmount: z.number(),
});
