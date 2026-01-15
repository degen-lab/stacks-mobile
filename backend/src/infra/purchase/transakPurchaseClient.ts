import {
  TRANSAK_API_KEY,
  TRANSAK_API_SECRET,
  TRANSAK_BASE_URL,
  TRANSAK_REFERRER_DOMAIN,
} from '../../shared/constants';
import { TransakAccessToken, TransakApiRoutes } from '../../shared/types';
import { TransakApiError } from '../../application/errors/purchaseErrors';

export class TransakPurchaseClient {
  async createWidgetUrl(
    accessToken: string,
    cryptoCurrencyCode: string,
    fiatCurrency: string,
    fiatAmount: number,
    partnerCustomerId: string,
    partnerOrderId: string,
  ): Promise<string> {
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
          referrerDomain: TRANSAK_REFERRER_DOMAIN,
          cryptoCurrencyCode,
          fiatCurrency,
          fiatAmount,
          partnerCustomerId,
          partnerOrderId,
        },
      }),
    };

    const response = await fetch(
      `${TRANSAK_BASE_URL}${TransakApiRoutes.CREATE_WIDGET_URL}`,
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

    const response = await fetch(
      `${TRANSAK_BASE_URL}${TransakApiRoutes.REFRESH_ACCESS_TOKEN}`,
      options,
    );

    const responseBody = await response.json();

    if (!response.ok) {
      throw new TransakApiError(
        `Transak token refresh failed: ${responseBody?.message || responseBody?.error || 'Unknown error'}`,
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
