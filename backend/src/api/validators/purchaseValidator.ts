import z from 'zod';
import { AppPlatform } from '../../shared/types';

export const createWidgetUrlSchema = z.object({
  cryptoCurrencyCode: z.string(),
  fiatCurrency: z.string(),
  fiatAmount: z.number().optional(),
  cryptoAmount: z.number().optional(),
  platform: z.enum(AppPlatform),
  productsAvailed: z.enum(['BUY', 'SELL']),
  walletAddress: z.string().optional(),
});

export const transakQuoteSchema = z
  .object({
    fiatAmount: z.number().positive().optional(),
    cryptoAmount: z.number().positive().optional(),
    cryptoCurrency: z.string().min(1),
    fiatCurrency: z.string().min(1).optional(),
    paymentMethod: z.string().min(1).optional(),
    isBuyOrSell: z.enum(['BUY', 'SELL']).optional(),
    countryCode: z.string().min(1).optional(),
  })
  .refine((data) => data.fiatAmount || data.cryptoAmount, {
    message: 'Either fiatAmount or cryptoAmount is required',
  });

// Transak webhook payload after JWT decryption
export const transakWebhookPayloadSchema = z.object({
  webhookData: z.object({
    id: z.string(), // Transak order ID
    partnerCustomerId: z.string().optional(), // Our purchase ID
    partnerOrderId: z.string().optional(),
    status: z.string(),
    fiatCurrency: z.string().optional(),
    cryptoCurrency: z.string().optional(),
    fiatAmount: z.number().optional(),
    cryptoAmount: z.number().optional(),
    walletAddress: z.string().optional(),
    network: z.string().optional(),
    transactionHash: z.string().optional(),
    transactionLink: z.string().optional(),
    conversionPrice: z.number().optional(),
    totalFeeInFiat: z.number().optional(),
  }),
});

export type TransakWebhookPayload = z.infer<typeof transakWebhookPayloadSchema>;
