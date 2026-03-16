// Quote Types
export type TransakFeeBreakdown = {
  name: string;
  value: number;
  id: string;
  ids: string[];
};

export type TransakQuoteResponse = {
  conversionPrice: number;
  marketConversionPrice: number;
  slippage: number;
  fiatCurrency: string;
  cryptoCurrency: string;
  paymentMethod: string;
  fiatAmount: number;
  cryptoAmount: number;
  isBuyOrSell: string;
  network: string;
  feeDecimal: number;
  totalFee: number;
  feeBreakdown: TransakFeeBreakdown[];
  nonce: number;
};

export type TransakQuoteErrorKind = "min" | "max" | "feature" | "unknown";

export class TransakQuoteError extends Error {
  kind: TransakQuoteErrorKind;
  minAmount?: number;
  maxAmount?: number;
  unit?: string;

  constructor(
    message: string,
    kind: TransakQuoteErrorKind,
    details?: { minAmount?: number; maxAmount?: number; unit?: string },
  ) {
    super(message);
    this.name = "TransakQuoteError";
    this.kind = kind;
    this.minAmount = details?.minAmount;
    this.maxAmount = details?.maxAmount;
    this.unit = details?.unit;
  }
}

export type TransakQuoteVariables = {
  fiatAmount?: number;
  cryptoAmount?: number;
  cryptoCurrency: string;
  fiatCurrency?: string;
  paymentMethod?: string;
  isBuyOrSell?: "BUY" | "SELL";
  countryCode?: string;
};

// Widget Types
export type CreateWidgetUrlRequest = {
  cryptoCurrencyCode: string;
  fiatCurrency?: string;
  fiatAmount?: number;
  cryptoAmount?: number;
  platform: "ANDROID" | "IOS";
  walletAddress?: string;
  productsAvailed: "BUY" | "SELL";
};

export type CreateWidgetUrlResponse = {
  success: boolean;
  message: string;
  data: {
    widgetUrl: string;
  };
};
