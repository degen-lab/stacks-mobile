import {
  ANDROID_REFERRER_DOMAIN,
  IOS_REFERRER_DOMAIN,
  TRANSAK_API_KEY,
  TRANSAK_API_SECRET,
  TRANSAK_API_URL,
  TRANSAK_GATEWAY_URL,
  TRANSAK_WIDGET_PRIMARY_COLOR,
  TRANSAK_WIDGET_PRIMARY_TEXT_COLOR,
} from '../../shared/constants';
import {
  AppPlatform,
  TransakAccessToken,
  TransakApiRoutes,
} from '../../shared/types';
import { TransakApiError } from '../../application/errors/purchaseErrors';
import { logger } from '../../api/helpers/logger';

export class TransakPurchaseClient {
  async createWidgetUrl(
    accessToken: string,
    cryptoCurrencyCode: string,
    fiatCurrency: string,
    fiatAmount: number | undefined,
    cryptoAmount: number | undefined,
    partnerCustomerId: string,
    partnerOrderId: string,
    platform: AppPlatform,
    productsAvailed: string,
    walletAddress?: string,
  ): Promise<string> {
    const referrerDomain =
      platform === AppPlatform.IOS
        ? IOS_REFERRER_DOMAIN
        : ANDROID_REFERRER_DOMAIN;

    const getNetwork = (code: string): string => {
      switch (code.toUpperCase()) {
        case 'BTC':
          return 'bitcoin';
        case 'STX':
          return 'stacks';
        default:
          return 'mainnet';
      }
    };

    const isSell = productsAvailed === 'SELL';
    const widgetParams = {
      apiKey: TRANSAK_API_KEY,
      referrerDomain,
      brandColor: TRANSAK_WIDGET_PRIMARY_COLOR,
      primaryButtonFillColor: TRANSAK_WIDGET_PRIMARY_COLOR,
      primaryButtonTextColor: TRANSAK_WIDGET_PRIMARY_TEXT_COLOR,
      cryptoCurrencyCode,
      fiatCurrency,
      network: getNetwork(cryptoCurrencyCode),
      productsAvailed,
      ...(fiatAmount != null ? { fiatAmount } : {}),
      ...(cryptoAmount != null ? { cryptoAmount } : {}),
      partnerCustomerId,
      partnerOrderId,
      ...(walletAddress && !isSell
        ? { walletAddress, disableWalletAddressForm: true }
        : {}),
      ...(isSell ? { walletRedirection: true } : {}),
    };
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'access-token': accessToken,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        widgetParams,
      }),
    };

    const response = await fetch(
      `${TRANSAK_GATEWAY_URL}${TransakApiRoutes.CREATE_WIDGET_URL}`,
      options,
    );

    const responseBody = await response.json();

    if (!response.ok) {
      throw new TransakApiError(
        `Transak API error: ${responseBody?.message || responseBody?.error || 'Unknown error'}`,
        response.status,
        responseBody,
      );
    }

    if (!responseBody?.data?.widgetUrl) {
      throw new TransakApiError(
        'Transak API returned invalid response: missing widgetUrl',
        response.status,
        responseBody,
      );
    }

    return responseBody.data.widgetUrl;
  }

  async refreshAccessToken(): Promise<TransakAccessToken> {
    const url = `${TRANSAK_API_URL}${TransakApiRoutes.REFRESH_ACCESS_TOKEN}`;
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-secret': TRANSAK_API_SECRET,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: TRANSAK_API_KEY,
      }),
    };

    const response = await fetch(url, options);

    const responseBody = await response.json();

    if (!response.ok) {
      logger.error({
        msg: 'Transak token refresh failed',
        status: response.status,
        responseBody: JSON.stringify(responseBody),
      });
      throw new TransakApiError(
        `Transak token refresh failed: ${JSON.stringify(responseBody)}`,
        response.status,
        responseBody,
      );
    }

    if (!responseBody?.data?.accessToken || !responseBody?.data?.expiresAt) {
      throw new TransakApiError(
        'Transak API returned invalid token response',
        response.status,
        responseBody,
      );
    }

    return responseBody.data;
  }
}
