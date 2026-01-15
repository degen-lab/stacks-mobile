import {
  ANDROID_REFERRER_DOMAIN,
  IOS_REFERRER_DOMAIN,
  TRANSAK_API_KEY,
  TRANSAK_API_SECRET,
  TRANSAK_API_URL,
  TRANSAK_GATEWAY_URL,
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
    fiatAmount: number,
    partnerCustomerId: string,
    partnerOrderId: string,
    platform: AppPlatform,
  ): Promise<string> {
    const referrerDomain =
      platform === AppPlatform.IOS
        ? IOS_REFERRER_DOMAIN
        : ANDROID_REFERRER_DOMAIN;
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'access-token': accessToken,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        widgetParams: {
          apiKey: TRANSAK_API_KEY,
          referrerDomain,
          cryptoCurrencyCode,
          fiatCurrency,
          fiatAmount,
          partnerCustomerId,
          partnerOrderId,
        },
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
