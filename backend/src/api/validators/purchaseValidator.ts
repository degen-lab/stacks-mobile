import z from 'zod';
import { AppPlatform } from '../../shared/types';

export const createWidgetUrlSchema = z.object({
  cryptoCurrencyCode: z.string(),
  fiatCurrency: z.string(),
  fiatAmount: z.number(),
  platform: z.enum(AppPlatform),
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
    isBuyOrSell: z.string().optional(),
    conversionPrice: z.number().optional(),
    totalFeeInFiat: z.number().optional(),
  }),
});

export type TransakWebhookPayload = z.infer<typeof transakWebhookPayloadSchema>;
